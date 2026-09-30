/**
 * ============================================================================
 * MODULE: /frontend/components/windowmanager.js
 * 
 * OS WINDOW PHYSICS, GEOMETRY & WORKSPACE MODE ENGINE
 * ============================================================================
 */

window.TAO_ENGINE = window.TAO_ENGINE || {};

let currentWorkspaceMode = 'standard'; 

window.TAO_ENGINE.getWorkspaceBounds = () => {
    // Poll the hardware for the exact usable pixels (Handles Safari mobile bug)
    let usableHeight = window.innerHeight;
    if (window.visualViewport) {
        usableHeight = window.visualViewport.height;
    }

    // 🚀 DYNAMICALLY READ SIZE: Respect the size declared by top-bottom-bar.js (Fallback to 44)
    const dockHeight = window.TAO_ENGINE.BAR_HEIGHT || 44; 
    
    // Calculate exactly where the dock goes from the TOP of the screen
    const dockTopPx = usableHeight - dockHeight;

    return { 
        ceiling: 0, 
        top: 38, 
        bottom: dockHeight, 
        usableHeight: usableHeight, 
        dockHeight: dockHeight,     
        dockTopPx: dockTopPx        
    };
};

window.TAO_ENGINE.setWorkspaceMode = (mode = 'standard') => {
    currentWorkspaceMode = mode;
    console.log(`[Window Manager] Workspace Mode Switched to: [${mode.toUpperCase()}]`);
    broadcastSafeAreaConstraints();
    
    window.dispatchEvent(new CustomEvent('tao-workspace-mode-changed', { 
        detail: { mode: currentWorkspaceMode } 
    }));
};

export function broadcastSafeAreaConstraints() {
    const bounds = window.TAO_ENGINE.getWorkspaceBounds();
    document.documentElement.style.setProperty('--tao-ceiling', `${bounds.ceiling}px`);
    document.documentElement.style.setProperty('--tao-workspace-top', `${bounds.top}px`);
    document.documentElement.style.setProperty('--tao-bottom-bound', `${bounds.bottom}px`); 
}

export function initWindowManager() {
    
    const enforceExactResize = () => {
        broadcastSafeAreaConstraints();
        const bounds = window.TAO_ENGINE.getWorkspaceBounds();
        
        ['user-workspace', 'backend-workspace'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.position = 'fixed';
                el.style.top = '0px';
                el.style.left = '0px';
                el.style.width = '100vw';
                el.style.height = `${bounds.usableHeight}px`;
                el.style.overflow = 'hidden';
            }
        });

        const openWindows = document.querySelectorAll('.tao-workspace-window, .tao-system-window');
        openWindows.forEach(win => {
            const isSystemWindow = win.classList.contains('tao-system-window');
            if (win.classList.contains('is-maximized')) {
                win.style.height = isSystemWindow ? `${bounds.usableHeight - bounds.bottom}px` : `${bounds.usableHeight - bounds.top - bounds.bottom}px`;
            }
        });
    };

    enforceExactResize(); 

    let appZIndex = 21000;    
    let sysZIndex = 40000;    
    
    let activeWindow = null;
    let isDragging = false;
    let offsetX = 0; let offsetY = 0; 

    window.TAO_ENGINE.bringToFront = (targetWindow) => {
        if (!targetWindow) return;
        if (parseInt(targetWindow.style.zIndex, 10) === appZIndex) return;

        if (targetWindow.classList.contains('tao-system-window')) {
            sysZIndex++; 
            targetWindow.style.zIndex = sysZIndex;
        } else {
            if (appZIndex >= 49000) appZIndex = 21000; 
            appZIndex++; 
            targetWindow.style.zIndex = appZIndex;
        }
    };

    const physicsObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    const isWindow = node.classList.contains('tao-workspace-window') || 
                                     node.classList.contains('tao-window');
                                     
                    if (isWindow && !node.dataset.physicsEnforced) {
                        const isSystemWindow = node.classList.contains('tao-system-window');
                        const bounds = window.TAO_ENGINE.getWorkspaceBounds();
                        
                        node.style.position = 'absolute';
                        node.style.top = isSystemWindow ? '0px' : `${bounds.top}px`;
                        node.style.left = '0px';
                        node.style.width = '100vw';
                        node.style.height = isSystemWindow ? `${bounds.usableHeight - bounds.bottom}px` : `${bounds.usableHeight - bounds.top - bounds.bottom}px`;
                        node.style.margin = '0';
                        node.style.transform = 'none'; 
                        node.classList.add('is-maximized');
                        node.dataset.physicsEnforced = 'true'; 
                        window.TAO_ENGINE.bringToFront(node);
                    }
                }
            });
        });
    });

    physicsObserver.observe(document.body, { childList: true, subtree: true });
    
    window.addEventListener('resize', enforceExactResize);
    window.addEventListener('orientationchange', () => setTimeout(enforceExactResize, 150));
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', enforceExactResize);
    }
    
    window.addEventListener('tao-workspace-mode-changed', (e) => {
        const bounds = window.TAO_ENGINE.getWorkspaceBounds();
        const openWindows = document.querySelectorAll('.tao-workspace-window, .tao-system-window');

        openWindows.forEach(win => {
            const isSystemWindow = win.classList.contains('tao-system-window');
            
            if (win.classList.contains('is-maximized')) {
                win.style.transition = 'top 0.3s ease, height 0.3s ease';
                win.style.top = isSystemWindow ? '0px' : `${bounds.top}px`;
                win.style.height = isSystemWindow ? `${bounds.usableHeight - bounds.bottom}px` : `${bounds.usableHeight - bounds.top - bounds.bottom}px`;
                setTimeout(() => win.style.transition = 'none', 300);
            } else if (win.classList.contains('is-floating')) {
                const currentTop = parseInt(win.style.top, 10) || 0;
                if (currentTop < bounds.top && !isSystemWindow) {
                    win.style.transition = 'top 0.3s ease';
                    win.style.top = `${bounds.top}px`; 
                    setTimeout(() => win.style.transition = 'none', 300);
                }
            }
        });
    });

    window.TAO_ENGINE.decorateAppWindow = (winElement, titleText) => {
        if (winElement.querySelector('.tao-window-header')) return;

        let targetContainerId = 'tao-os-root'; 

        if (window.TAO_ENGINE?.LAYERS) {
            if (winElement.classList.contains('tao-system-window')) {
                targetContainerId = window.TAO_ENGINE.LAYERS.GLOBAL; 
            } else if (currentWorkspaceMode === 'backend') {
                targetContainerId = window.TAO_ENGINE.LAYERS.BACKEND;
            } else {
                targetContainerId = window.TAO_ENGINE.LAYERS.USER;
            }
        }
        
        const targetContainer = document.getElementById(targetContainerId) || document.body;
        
        if (winElement.parentNode !== targetContainer) {
            targetContainer.appendChild(winElement);
        }

        winElement.addEventListener('mousedown', () => { window.TAO_ENGINE.bringToFront(winElement); }, { capture: true });
        winElement.addEventListener('touchstart', () => { window.TAO_ENGINE.bringToFront(winElement); }, { capture: true, passive: true });

        const header = document.createElement('div');
        header.className = 'tao-window-header';
        Object.assign(header.style, {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: '38px', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b',
            padding: '0 12px', cursor: 'grab', userSelect: 'none', position: 'relative',
            flexShrink: '0', touchAction: 'none' 
        });

        const cleanTitle = titleText ? titleText.replace(/\.js/gi, '') : 'Application';

        const leftZone = document.createElement('div');
        Object.assign(leftZone.style, { display: 'flex', alignItems: 'center', gap: '12px', zIndex: '2' });

        const trafficLights = document.createElement('div');
        Object.assign(trafficLights.style, { display: 'flex', gap: '6px' });
        
        const createLight = (color) => {
            const btn = document.createElement('button');
            btn.classList.add('window-action-btn'); 
            Object.assign(btn.style, { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color, cursor: 'pointer', border: 'none', padding: '0' });
            return btn;
        };

        const redBtn = createLight('#ef4444');    
        const yellowBtn = createLight('#facc15'); 
        const greenBtn = createLight('#22c55e');  

        redBtn.onclick = (e) => {
            e.stopPropagation();
            if (winElement.id === 'tao-chatbox-window' && window.TAO_TOGGLE_CHATBOX) {
                window.TAO_TOGGLE_CHATBOX();
            } else {
                document.dispatchEvent(new CustomEvent('tao-window-closed', { detail: { winElement, title: cleanTitle } }));
                winElement.remove();
            }
        };

        yellowBtn.onclick = (e) => {
            e.stopPropagation();
            winElement.style.transition = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
            winElement.style.transform = 'translateY(80vh) scale(0.2)'; 
            winElement.style.opacity = '0';
            setTimeout(() => { 
                winElement.style.display = 'none'; 
                winElement.classList.add('is-minimized'); 
                document.dispatchEvent(new CustomEvent('tao-window-docked', { detail: { winElement, title: cleanTitle } }));
            }, 400); 
        };

        const toggleMaximize = (e) => {
            e.stopPropagation();
            window.TAO_ENGINE.bringToFront(winElement); 
            winElement.style.transition = 'all 0.3s ease';
            const bounds = window.TAO_ENGINE.getWorkspaceBounds();
            const isSystemWindow = winElement.classList.contains('tao-system-window');
            
            if (winElement.classList.contains('is-maximized')) {
                winElement.classList.remove('is-maximized');
                winElement.classList.add('is-floating');
                winElement.style.width = winElement.dataset.origWidth || '80vw';
                winElement.style.height = winElement.dataset.origHeight || '75vh';
                winElement.style.top = winElement.dataset.origTop || `${bounds.top}px`;
                winElement.style.left = winElement.dataset.origLeft || '10vw';
                winElement.style.borderRadius = '12px';
                header.style.cursor = 'grab'; 
                winElement.querySelectorAll('.tao-resize-handle').forEach(h => h.style.display = 'block');
            } else {
                winElement.dataset.origWidth = winElement.style.width;
                winElement.dataset.origHeight = winElement.style.height;
                winElement.dataset.origTop = winElement.style.top;
                winElement.dataset.origLeft = winElement.style.left;
                
                winElement.classList.remove('is-floating');
                winElement.classList.add('is-maximized');
                winElement.style.width = '100vw';
                winElement.style.height = isSystemWindow ? `${bounds.usableHeight - bounds.bottom}px` : `${bounds.usableHeight - bounds.top - bounds.bottom}px`;
                winElement.style.top = isSystemWindow ? '0px' : `${bounds.top}px`;
                winElement.style.left = '0px';
                winElement.style.borderRadius = '0px';
                header.style.cursor = 'default';
                winElement.querySelectorAll('.tao-resize-handle').forEach(h => h.style.display = 'none');
            }
            setTimeout(() => winElement.style.transition = 'none', 300); 
        };

        greenBtn.onclick = toggleMaximize;

        trafficLights.appendChild(redBtn);
        trafficLights.appendChild(yellowBtn);
        trafficLights.appendChild(greenBtn);

        const helpBtn = document.createElement('button');
        helpBtn.innerText = 'Help';
        helpBtn.classList.add('window-action-btn');
        Object.assign(helpBtn.style, {
            backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'sans-serif'
        });
        
        helpBtn.onclick = (e) => {
            e.stopPropagation();
            winElement.dispatchEvent(new CustomEvent('tao-help-clicked'));
            window.dispatchEvent(new CustomEvent('tao-global-help-clicked', { detail: { appName: cleanTitle, windowRef: winElement } }));
        };

        const chatboxBtn = document.createElement('button');
        chatboxBtn.classList.add('window-action-btn', 'chat-trigger-btn');
        chatboxBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
        Object.assign(chatboxBtn.style, {
            backgroundColor: 'transparent', color: '#a855f7', border: '1px solid #7e22ce', borderRadius: '4px', padding: '2px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        });
        chatboxBtn.onclick = (e) => {
            e.stopPropagation();
            if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
            else document.dispatchEvent(new CustomEvent('tao-open-chatbox'));
        };

        leftZone.appendChild(trafficLights);
        leftZone.appendChild(helpBtn);
        leftZone.appendChild(chatboxBtn);

        const titleSpan = document.createElement('span');
        titleSpan.innerText = cleanTitle;
        Object.assign(titleSpan.style, { position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: '#94a3b8', fontSize: '13px', fontWeight: 'bold', fontFamily: 'sans-serif', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: '1' });

        const rightZone = document.createElement('div');
        Object.assign(rightZone.style, { display: 'flex', alignItems: 'center', gap: '12px', zIndex: '2' });

        const snapshotBtn = document.createElement('button');
        snapshotBtn.innerText = 'Snapshot';
        snapshotBtn.classList.add('window-action-btn');
        Object.assign(snapshotBtn.style, { backgroundColor: 'transparent', color: '#38bdf8', border: '1px solid #0369a1', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'sans-serif' });
        
        snapshotBtn.onclick = (e) => {
            e.stopPropagation();
            winElement.dispatchEvent(new CustomEvent('tao-snapshot-clicked'));
            window.dispatchEvent(new CustomEvent('tao-global-snapshot-clicked', { detail: { appName: cleanTitle, windowRef: winElement } }));
        };

        rightZone.appendChild(snapshotBtn);

        header.appendChild(leftZone);
        header.appendChild(titleSpan);
        header.appendChild(rightZone);
        winElement.insertBefore(header, winElement.firstChild);

        if (winElement.classList.contains('is-floating')) header.style.cursor = 'grab';

        // ==========================================
        // 🚀 BULLETPROOF POINTER-EVENT RESIZE ENGINE (5-WAY)
        // ==========================================
        if (!winElement.classList.contains('tao-system-window')) {
            const handleConfigs = [
                { d: 's', cur: 'ns-resize', css: { bottom: '0', left: '35px', right: '35px', height: '25px' } },
                { d: 'e', cur: 'ew-resize', css: { right: '0', top: '38px', bottom: '35px', width: '25px' } },
                { d: 'w', cur: 'ew-resize', css: { left: '0', top: '38px', bottom: '35px', width: '25px' } },
                { d: 'se', cur: 'nwse-resize', css: { bottom: '0', right: '0', width: '40px', height: '40px' } },
                { d: 'sw', cur: 'nesw-resize', css: { bottom: '0', left: '0', width: '40px', height: '40px' } }
            ];

            handleConfigs.forEach(conf => {
                const h = document.createElement('div');
                h.classList.add('tao-resize-handle');
                h.style.display = winElement.classList.contains('is-maximized') ? 'none' : 'block';
                
                Object.assign(h.style, { 
                    position: 'absolute', zIndex: '50000', cursor: conf.cur, 
                    touchAction: 'none', ...conf.css 
                });
                
                if (conf.d === 'se') {
                    h.style.background = 'linear-gradient(135deg, transparent 50%, rgba(56, 189, 248, 0.5) 50%)';
                    h.style.borderBottomRightRadius = '8px';
                }
                
                winElement.appendChild(h);

                let isResizing = false;
                let rStartW, rStartH, rStartX, rStartY, rStartL, rStartT;

                const startResize = (clientX, clientY) => {
                    if (winElement.classList.contains('is-maximized')) return;
                    isResizing = true;
                    winElement.style.transition = 'none'; 
                    const rect = winElement.getBoundingClientRect();
                    rStartW = rect.width; rStartH = rect.height;
                    rStartX = clientX; rStartY = clientY;
                    rStartL = rect.left; rStartT = rect.top;
                    
                    if (window.TAO_ENGINE?.bringToFront) window.TAO_ENGINE.bringToFront(winElement);

                    if (!document.getElementById('tao-drag-blocker')) {
                        const blocker = document.createElement('div');
                        blocker.id = 'tao-drag-blocker';
                        Object.assign(blocker.style, { position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', zIndex: '999999', cursor: conf.cur });
                        document.body.appendChild(blocker);
                    }
                };

                const doResize = (clientX, clientY) => {
                    if (!isResizing) return;
                    const dx = clientX - rStartX;
                    const dy = clientY - rStartY;
                    let newW = rStartW, newH = rStartH, newL = rStartL, newT = rStartT;

                    if (conf.d.includes('e')) newW = Math.max(280, rStartW + dx);
                    if (conf.d.includes('s')) newH = Math.max(200, rStartH + dy);
                    
                    if (conf.d.includes('w')) {
                        newW = Math.max(280, rStartW - dx);
                        if (newW > 280) newL = rStartL + dx;
                    }

                    winElement.style.width = newW + 'px';
                    winElement.style.height = newH + 'px';
                    winElement.style.left = newL + 'px';
                    winElement.style.top = newT + 'px';
                };

                const endResize = () => { 
                    isResizing = false; 
                    const blocker = document.getElementById('tao-drag-blocker');
                    if (blocker) blocker.remove();
                };

                h.addEventListener('pointerdown', (e) => {
                    e.stopPropagation(); e.preventDefault();
                    try { h.setPointerCapture(e.pointerId); } catch(err) {} 
                    
                    startResize(e.clientX, e.clientY);

                    const onMove = (ev) => {
                        if (ev.pointerId !== e.pointerId) return;
                        ev.preventDefault();
                        doResize(ev.clientX, ev.clientY);
                    };
                    const onUp = (ev) => {
                        if (ev.pointerId !== e.pointerId) return;
                        endResize();
                        try { h.releasePointerCapture(e.pointerId); } catch(err) {}
                        h.removeEventListener('pointermove', onMove);
                        h.removeEventListener('pointerup', onUp);
                        h.removeEventListener('pointercancel', onUp);
                    };

                    h.addEventListener('pointermove', onMove);
                    h.addEventListener('pointerup', onUp);
                    h.addEventListener('pointercancel', onUp);
                });
            });
        }
    };

    const handleGlobalDragStart = (e) => {
        const header = e.target.closest('.tao-window-header');
        if (!header) return;
        
        const winElement = header.closest('.tao-workspace-window, .tao-system-window, .tao-window');
        if (!winElement) return;

        const isActionBtn = e.target.closest('.window-action-btn, button, [style*="cursor: pointer"], svg'); 
        
        if (!isActionBtn && (header.style.cursor === 'grab' || winElement.classList.contains('is-floating'))) {
            isDragging = true;
            activeWindow = winElement;
            window.TAO_ENGINE.bringToFront(activeWindow);
            
            const rect = activeWindow.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            try { header.setPointerCapture(e.pointerId); } catch(err) {}
        }
    };

    const handleGlobalDragMove = (e) => {
        if (!isDragging || !activeWindow) return;
        e.preventDefault(); 
        
        const bounds = window.TAO_ENGINE.getWorkspaceBounds();
        const minTop = activeWindow.classList.contains('tao-system-window') ? 0 : bounds.top;
        
        const rect = activeWindow.getBoundingClientRect();
        const minX = 0;
        const maxX = Math.max(0, window.innerWidth - rect.width);
        const maxTop = Math.max(minTop, bounds.usableHeight - rect.height - bounds.bottom);
        
        let newX = e.clientX - offsetX; 
        let newY = e.clientY - offsetY;
        
        if (newY < minTop) newY = minTop; 
        if (newY > maxTop) newY = maxTop; 
        if (newX < minX) newX = minX;     
        if (newX > maxX) newX = maxX;     
        
        activeWindow.style.left = `${newX}px`; 
        activeWindow.style.top = `${newY}px`;
    };

    const handleGlobalDragEnd = (e) => { 
        if (isDragging) { 
            try { 
                const header = activeWindow.querySelector('.tao-window-header');
                if (header) header.releasePointerCapture(e.pointerId);
            } catch(err) {}
            isDragging = false; 
            activeWindow = null; 
        } 
    };

    document.addEventListener('pointerdown', handleGlobalDragStart);
    document.addEventListener('pointermove', handleGlobalDragMove, { passive: false });
    document.addEventListener('pointerup', handleGlobalDragEnd);
    document.addEventListener('pointercancel', handleGlobalDragEnd);
}