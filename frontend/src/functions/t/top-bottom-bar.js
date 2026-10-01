/**
 * ============================================================================
 * MODULE: /frontend/src/functions/t/top-bottom-bar.js
 * 
 * THE DUAL-DOCK FACTORY (System Chrome)
 * ============================================================================
 */

export function initTopBottomBar() {
    
    // 🚀 THE COMPONENT DEFINES ITS OWN SIZE HERE
    const BAR_HEIGHT = 44; 
    
    window.TAO_ENGINE = window.TAO_ENGINE || {};
    window.TAO_ENGINE.BAR_HEIGHT = BAR_HEIGHT; // Share this size with the Window Manager
    
    if (!document.getElementById('tao-dock-styles')) {
        const style = document.createElement('style');
        style.id = 'tao-dock-styles';
        style.innerHTML = `
            .tao-dock-scroll-container::-webkit-scrollbar { display: none; }
            .tao-dock-scroll-container { -ms-overflow-style: none; scrollbar-width: none; }
        `;
        document.head.appendChild(style);
    }
    
    const createDockForWorkspace = (workspaceId, isSecureTheme) => {
        const workspace = document.getElementById(workspaceId);
        if (!workspace) return;

        // Fetch placement math from Window Manager
        const bounds = window.TAO_ENGINE?.getWorkspaceBounds 
            ? window.TAO_ENGINE.getWorkspaceBounds() 
            : { dockTopPx: window.innerHeight - BAR_HEIGHT }; 

        const bottomDock = document.createElement('div');
        bottomDock.className = 'tao-os-bottom-dock'; 
        
        Object.assign(bottomDock.style, {
            position: 'fixed', 
            top: `${bounds.dockTopPx}px`, // Placement calculated by Window Manager
            left: '0', 
            width: '100vw',
            height: `${BAR_HEIGHT}px`,     // Size controlled locally!
            backgroundColor: '#000000', // 🚀 Forced to solid black
            borderTop: '1px solid #1e293b', 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            padding: `0 12px`, pointerEvents: 'auto', 
            zIndex: '52000', boxSizing: 'border-box', gap: '12px'
        });

        const dockItemsContainer = document.createElement('div');
        dockItemsContainer.className = 'tao-dock-scroll-container';
        Object.assign(dockItemsContainer.style, {
            display: 'flex', alignItems: 'center', gap: '8px', flex: '1',
            overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap',
            scrollBehavior: 'smooth', overscrollBehaviorX: 'contain',
            WebkitOverflowScrolling: 'touch' 
        });

        document.addEventListener('tao-window-closed', (e) => {
            const { winElement } = e.detail;
            if (!winElement || !winElement.id) return;
            const globalIcons = document.querySelectorAll(`.docked-app-icon[data-window-id="${winElement.id}"]`);
            globalIcons.forEach(icon => icon.remove());
        });

        document.addEventListener('tao-window-docked', (e) => {
            const { winElement, title } = e.detail;
            
            const isGlobalApp = winElement.classList.contains('tao-system-window');
            const belongsToThisWorkspace = winElement.parentNode?.id === workspaceId;

            if (!isGlobalApp && !belongsToThisWorkspace) return;

            const safeWorkspaceId = workspaceId.replace('-', '_'); 
            const namespaceKey = `docked_${safeWorkspaceId}`;
            
            if (winElement.dataset[namespaceKey] === 'true') return;
            winElement.dataset[namespaceKey] = 'true';

            const dockItem = document.createElement('div');
            dockItem.dataset.windowId = winElement.id || 'unknown'; 
            dockItem.className = 'docked-app-icon';
            
            Object.assign(dockItem.style, {
                padding: '0 10px', height: '32px', borderRadius: '6px', 
                backgroundColor: '#0f172a', // Forced dark background for icons
                border: '1px solid #1e293b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                color: '#ffffff', fontSize: '11px', fontWeight: 'bold',
                cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'uppercase',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                flexShrink: '0' 
            });
            
            const rawIcon = winElement.dataset.appIcon ? decodeURIComponent(winElement.dataset.appIcon) : '';
            const safeTitle = title ? title.substring(0, 2) : 'OS';
            
            dockItem.innerHTML = `
                <div style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
                    <div style="transform: scale(0.65); transform-origin: center; display: flex; align-items: center; justify-content: center;">
                        ${rawIcon}
                    </div>
                </div>
                <span>${safeTitle}</span>
            `;

            dockItem.title = title;

            dockItem.onmouseover = () => { 
                dockItem.style.transform = 'translateY(-4px)'; 
                dockItem.style.backgroundColor = '#38bdf8'; 
                dockItem.style.borderColor = '#0284c7';
            };
            dockItem.onmouseout = () => { 
                dockItem.style.transform = 'none'; 
                dockItem.style.backgroundColor = '#0f172a'; // Fixed dark color
                dockItem.style.borderColor = '#1e293b';
            };

            dockItem.onclick = (ev) => {
                ev.stopPropagation();
                
                if (winElement.classList.contains('is-minimized') || winElement.style.display === 'none') {
                    winElement.style.display = 'flex';
                    winElement.classList.remove('is-minimized');
                    
                    setTimeout(() => {
                        winElement.style.transform = 'none'; 
                        winElement.style.opacity = '1';
                        if (window.TAO_ENGINE?.bringToFront) window.TAO_ENGINE.bringToFront(winElement);
                    }, 10);
                } else {
                    winElement.style.transition = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                    winElement.style.transform = 'translateY(80vh) scale(0.2)'; 
                    winElement.style.opacity = '0';
                    setTimeout(() => { 
                        winElement.style.display = 'none'; 
                        winElement.classList.add('is-minimized'); 
                    }, 400);
                }
            };

            dockItemsContainer.appendChild(dockItem);
            
            setTimeout(() => {
                dockItemsContainer.scrollTo({ left: dockItemsContainer.scrollWidth, behavior: 'smooth' });
            }, 50);
        });

        const trashCan = document.createElement('div');
        trashCan.title = 'Trash (Items kept for 30 days)';
        Object.assign(trashCan.style, {
            width: '36px', height: '36px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', cursor: 'pointer', flexShrink: '0',
            color: '#ef4444', // 🚀 Forced BRIGHT RED default
            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
        });

        trashCan.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

        trashCan.onmouseover = () => { trashCan.style.color = '#ff1111'; trashCan.style.transform = 'scale(1.1)'; }; // Even brighter on hover
        trashCan.onmouseout = () => { trashCan.style.color = '#ef4444'; trashCan.style.transform = 'none'; }; // 🚀 Reset to bright red

        if (!window.TAO_ENGINE) window.TAO_ENGINE = {};
        if (!window.TAO_ENGINE.cinematicTrash) {
            window.TAO_ENGINE.cinematicTrash = (elementToTrash, itemName = 'Item') => {
                if (!elementToTrash) return;
                
                const activeTrash = document.querySelector('.tao-os-bottom-dock:visible #tao-os-trashcan') || trashCan;
                const trashRect = activeTrash.getBoundingClientRect();
                const trashCenterY = trashRect.top + (trashRect.height / 2);
                
                elementToTrash.style.transition = 'all 0.7s cubic-bezier(0.5, 0, 0.2, 1)';
                elementToTrash.style.transform = `translateY(${trashCenterY}px) scale(0) rotate(360deg)`;
                elementToTrash.style.opacity = '0';
                
                setTimeout(() => { activeTrash.style.transform = 'scale(1.3)'; activeTrash.style.color = '#ff1111'; }, 300); // Burst brighter when item hits
                setTimeout(() => { activeTrash.style.transform = 'none'; activeTrash.style.color = '#ef4444'; }, 500); // 🚀 Reset to bright red

                setTimeout(() => { elementToTrash.style.display = 'none'; elementToTrash.remove(); }, 700);
            };
        }

        bottomDock.appendChild(dockItemsContainer);
        bottomDock.appendChild(trashCan);
        workspace.appendChild(bottomDock);
    };

    createDockForWorkspace('user-workspace', false);
    createDockForWorkspace('backend-workspace', true);
}