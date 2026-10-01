/**
 * ============================================================================
 * MODULE: /frontend/screen-panels/home-screen.js
 * 
 * THE PUBLIC DESKTOP (System Window Architecture)
 * ============================================================================
 */

export async function initHomeScreen() {
    return new Promise(async (resolve) => {
        
        const currentUserId = localStorage.getItem('TAO_SESSION_TOKEN');
        if (currentUserId) {
            try {
                const authCheck = await fetch('/api/auth/check-clearance', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId })
                });
                if (authCheck.status === 401) {
                    localStorage.clear(); window.location.reload(); return; 
                }
            } catch (err) {}
        }

        const userWorkspace = document.getElementById('user-workspace');
        const backendWorkspace = document.getElementById('backend-workspace');
        
        if (backendWorkspace) backendWorkspace.style.display = 'none'; 
        if (userWorkspace) userWorkspace.style.display = 'block';      

        if (window.TAO_ENGINE && window.TAO_ENGINE.setWorkspaceMode) {
            window.TAO_ENGINE.setWorkspaceMode('standard');
        }

        if (document.getElementById('tao-desktop-window')) {
            resolve(); return;
        }

        const desktopWin = document.createElement('div');
        desktopWin.id = 'tao-desktop-window';
        desktopWin.classList.add('tao-system-window', 'is-maximized');
        desktopWin.dataset.physicsEnforced = 'true';
        
        Object.assign(desktopWin.style, {
            backgroundColor: '#000000', display: 'flex', flexDirection: 'column', 
            pointerEvents: 'auto', overflow: 'hidden'
        });

        if (window.TAO_ENGINE && window.TAO_ENGINE.decorateAppWindow) {
            window.TAO_ENGINE.decorateAppWindow(desktopWin, 'me.sphere');
        }

        const header = desktopWin.querySelector('.tao-window-header');
        if (header) {
            header.style.cursor = 'default';
            header.style.backgroundColor = '#ffffff'; 
            header.style.borderBottom = '1px solid #e2e8f0';

            const actionBtns = header.querySelectorAll('.window-action-btn, .chat-trigger-btn');
            actionBtns.forEach(btn => btn.remove());
            
            const leftZone = header.firstChild;
            if (leftZone && leftZone.firstChild && leftZone.firstChild.tagName === 'DIV') {
                leftZone.firstChild.remove(); 
            }

            const titleSpan = header.querySelector('span');
            if (titleSpan) {
                titleSpan.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <img src="./src/functions/t/t-data/Me-sphere.svg" style="width: 24px; height: 24px; object-fit: contain;">
                    </div>
                `;
            }

            const centerZone = document.createElement('div');
            Object.assign(centerZone.style, { display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' });
            
            const hamburgerBtn = document.createElement('div');
            hamburgerBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
            
            Object.assign(hamburgerBtn.style, { 
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '44px', height: '44px', borderRadius: '4px'
            });

            const dropdown = document.createElement('div');
            Object.assign(dropdown.style, {
                display: 'none', position: 'fixed', top: '44px', left: '12px', // 🚀 Dropped down to 44px
                backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.6)', width: '200px', 
                flexDirection: 'column', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', 
                zIndex: '999999' 
            });
            document.body.appendChild(dropdown);

            const buildMenu = () => {
                dropdown.innerHTML = ''; 

                const openWindows = document.querySelectorAll('.tao-workspace-window');

                if (openWindows.length > 0) {
                    const activeHeader = document.createElement('div');
                    activeHeader.innerText = 'ACTIVE APPS';
                    Object.assign(activeHeader.style, {
                        padding: '10px 14px 4px 14px', fontSize: '10px', color: '#64748b', fontWeight: 'bold', letterSpacing: '1px'
                    });
                    dropdown.appendChild(activeHeader);

                    const scrollableAppList = document.createElement('div');
                    Object.assign(scrollableAppList.style, { maxHeight: '160px', overflowY: 'auto', overscrollBehavior: 'contain' });

                    openWindows.forEach(win => {
                        const winTitleSpan = win.querySelector('.tao-window-header span');
                        const appName = winTitleSpan ? winTitleSpan.innerText : 'Unknown App';
                        
                        const itemRow = document.createElement('div');
                        Object.assign(itemRow.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', color: '#f8fafc', fontSize: '13px', cursor: 'pointer' });
                        itemRow.onmouseover = () => itemRow.style.backgroundColor = '#334155';
                        itemRow.onmouseout = () => itemRow.style.backgroundColor = 'transparent';

                        const nameLabel = document.createElement('span');
                        nameLabel.innerText = appName;
                        nameLabel.style.flex = '1';
                        
                        nameLabel.onclick = (e) => {
                            e.stopPropagation();
                            if (win.classList.contains('is-minimized')) {
                                win.style.display = 'flex'; 
                                win.classList.remove('is-minimized');
                                setTimeout(() => {
                                    win.style.transform = 'none'; 
                                    win.style.opacity = '1';
                                    if (window.TAO_ENGINE?.bringToFront) window.TAO_ENGINE.bringToFront(win);
                                }, 10);
                            } else {
                                if (window.TAO_ENGINE?.bringToFront) window.TAO_ENGINE.bringToFront(win);
                            }
                            dropdown.style.display = 'none';
                        };

                        const closeBtn = document.createElement('span');
                        closeBtn.innerHTML = '&times;';
                        Object.assign(closeBtn.style, { color: '#ef4444', fontWeight: 'bold', fontSize: '16px', padding: '0 4px' });
                        
                        closeBtn.onclick = (e) => {
                            e.stopPropagation();
                            document.dispatchEvent(new CustomEvent('tao-window-closed', { detail: { winElement: win, title: appName } }));
                            win.remove();
                            buildMenu(); 
                        };

                        itemRow.appendChild(nameLabel);
                        itemRow.appendChild(closeBtn);
                        scrollableAppList.appendChild(itemRow);
                    });

                    dropdown.appendChild(scrollableAppList);

                    const closeAllBtn = document.createElement('div');
                    closeAllBtn.innerText = 'Close All Apps';
                    Object.assign(closeAllBtn.style, { padding: '10px 14px', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', borderBottom: '1px solid #334155', marginTop: '4px' });
                    closeAllBtn.onmouseover = () => closeAllBtn.style.backgroundColor = '#334155';
                    closeAllBtn.onmouseout = () => closeAllBtn.style.backgroundColor = 'transparent';
                    
                    closeAllBtn.onclick = (e) => {
                        e.stopPropagation();
                        openWindows.forEach(win => {
                            const winTitleSpan = win.querySelector('.tao-window-header span');
                            const appName = winTitleSpan ? winTitleSpan.innerText : 'App';
                            document.dispatchEvent(new CustomEvent('tao-window-closed', { detail: { winElement: win, title: appName } }));
                            win.remove();
                        });
                        dropdown.style.display = 'none';
                    };
                    dropdown.appendChild(closeAllBtn);
                }

                const menuOptions = [
                    { label: 'Help', action: () => { window.dispatchEvent(new CustomEvent('tao-global-help-clicked', { detail: { appName: 'me.sphere', windowRef: desktopWin } })); }},
                    { label: 'Open Chatbox', action: () => { if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX(); else document.dispatchEvent(new CustomEvent('tao-open-chatbox')); }},
                    { label: 'Take Snapshot', action: () => { window.dispatchEvent(new CustomEvent('tao-global-snapshot-clicked', { detail: { appName: 'me.sphere', windowRef: desktopWin } })); }},
                    { isDivider: true },
                    { label: 'Sleep', action: () => { 
                        const sleepScreen = document.createElement('div');
                        Object.assign(sleepScreen.style, { position: 'fixed', inset: '0', backgroundColor: '#000000', zIndex: '99999', cursor: 'pointer' });
                        sleepScreen.onclick = () => sleepScreen.remove();
                        document.body.appendChild(sleepScreen);
                    }},
                    { label: 'Sign Out', action: () => { localStorage.removeItem('TAO_SESSION_TOKEN'); window.location.reload(); }}
                ];

                menuOptions.forEach(opt => {
                    if (opt.isDivider) {
                        const divider = document.createElement('div');
                        Object.assign(divider.style, { height: '1px', backgroundColor: '#334155', margin: '2px 0' });
                        dropdown.appendChild(divider); return;
                    }
                    const item = document.createElement('div');
                    item.innerText = opt.label;
                    Object.assign(item.style, { padding: '10px 14px', color: '#f8fafc', fontSize: '13px', fontFamily: 'sans-serif', cursor: 'pointer' });
                    item.onmouseover = () => item.style.backgroundColor = '#334155';
                    item.onmouseout = () => item.style.backgroundColor = 'transparent';
                    item.onclick = (e) => { e.stopPropagation(); dropdown.style.display = 'none'; opt.action(); };
                    dropdown.appendChild(item);
                });
            };

            hamburgerBtn.onclick = (e) => {
                e.stopPropagation();
                if (dropdown.style.display === 'flex') {
                    dropdown.style.display = 'none';
                } else {
                    buildMenu(); dropdown.style.display = 'flex';
                }
            };
            document.addEventListener('click', () => { dropdown.style.display = 'none'; });

            centerZone.appendChild(hamburgerBtn);
            if (leftZone) leftZone.appendChild(centerZone);
        }

        const desktopCanvas = document.createElement('div');
        Object.assign(desktopCanvas.style, { flex: '1', display: 'flex', alignContent: 'flex-start', flexWrap: 'wrap', padding: '24px 40px', gap: '30px', boxSizing: 'border-box', overflowY: 'auto', position: 'relative' });
        desktopWin.appendChild(desktopCanvas);

        let dbApps = [];
        try {
            const userId = localStorage.getItem('TAO_SESSION_TOKEN') || 'unknown';
            const res = await fetch(`/api/system/apps?userId=${userId}`, { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }});
            const data = await res.json();
            if (data.success) dbApps = data.apps;
        } catch (err) {}

        const createAppIcon = (appName, iconData, onClickAction) => {
            const appContainer = document.createElement('div');
            Object.assign(appContainer.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '44px', minHeight: '44px', cursor: 'pointer', transition: 'transform 0.2s ease' });

            const iconBox = document.createElement('div');
            Object.assign(iconBox.style, { width: '32px', height: '32px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.5)', marginBottom: '6px', backdropFilter: 'blur(5px)' });

            let iconHtml = '';
            const safeIcon = iconData ? String(iconData) : '';
            if (safeIcon.toLowerCase().includes('<svg')) iconHtml = `<div style="display: flex; align-items: center; justify-content: center; transform: scale(0.70); transform-origin: center;">${safeIcon}</div>`;
            else if (safeIcon) iconHtml = `<img src="${safeIcon}" style="width: 24px; height: 24px; object-fit: contain;">`;
            iconBox.innerHTML = iconHtml;

            const appLabel = document.createElement('div');
            Object.assign(appLabel.style, { color: '#ffffff', fontFamily: 'sans-serif', fontSize: '11px', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.8)', whiteSpace: 'nowrap' });
            appLabel.innerText = appName;

            appContainer.onmouseover = () => appContainer.style.transform = 'scale(1.05)';
            appContainer.onmouseout = () => appContainer.style.transform = 'scale(1)';
            appContainer.onclick = onClickAction;

            appContainer.appendChild(iconBox);
            appContainer.appendChild(appLabel);
            return appContainer;
        };

        dbApps.forEach(app => {
            let rawIconHtml = '';
            const safeIcon = app.icon_path ? String(app.icon_path) : '';
            if (safeIcon.toLowerCase().includes('<svg')) rawIconHtml = safeIcon;
            else if (safeIcon) rawIconHtml = `<img src="${safeIcon}" style="width: 100%; height: 100%; object-fit: contain;">`;

            const injectedApp = createAppIcon(app.app_name, app.icon_path, async () => {
                if (app.app_name === 'Chatbox' || app.js_file_path === 'chatbox') {
                    if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX(); return;
                }
                
                const appId = `tao-app-${app.app_name.replace(/\s+/g, '-').toLowerCase()}`;
                const existingWindow = document.getElementById(appId);

                if (existingWindow) {
                    if (existingWindow.classList.contains('is-minimized')) {
                        existingWindow.style.display = 'flex'; existingWindow.classList.remove('is-minimized');
                        setTimeout(() => { existingWindow.style.transform = 'none'; existingWindow.style.opacity = '1';
                            if (window.TAO_ENGINE?.bringToFront) window.TAO_ENGINE.bringToFront(existingWindow);
                        }, 10);
                    } else {
                        if (window.TAO_ENGINE?.bringToFront) window.TAO_ENGINE.bringToFront(existingWindow);
                    }
                    return; 
                }
                
                try {
                    const module = await import(app.js_file_path + '?v=' + new Date().getTime());
                    
                    const appWindow = document.createElement('div');
                    appWindow.id = appId; 
                    appWindow.classList.add('tao-workspace-window');
                    appWindow.dataset.appIcon = encodeURIComponent(rawIconHtml);
                    
                    Object.assign(appWindow.style, { backgroundColor: '#ffffff', overflow: 'hidden', display: 'flex', flexDirection: 'column', pointerEvents: 'auto' });

                    const contentArea = document.createElement('div');
                    Object.assign(contentArea.style, { flex: '1', overflow: 'hidden', position: 'relative' });
                    appWindow.appendChild(contentArea);

                    if (window.TAO_ENGINE && window.TAO_ENGINE.decorateAppWindow) {
                        window.TAO_ENGINE.decorateAppWindow(appWindow, app.app_name);
                    }
                    
                    const initMethod = 'init' + app.app_name.replace(/\s+/g, '');
                    if (typeof module[initMethod] === 'function') module[initMethod](contentArea);
                    else if (typeof module.default === 'function') module.default(contentArea);
                } catch (err) {
                    // 🚀 CRITICAL FIX: Logs missing modules instead of failing silently
                    console.error(`[TAO OS] Failed to load module for ${app.app_name}:`, err);
                    alert(`System Error: Could not locate the application module for ${app.app_name}. Did you rename the Javascript file?`);
                }
            });
            desktopCanvas.appendChild(injectedApp);
        });

        if (userWorkspace) userWorkspace.appendChild(desktopWin);
        else document.body.appendChild(desktopWin); 
        
        resolve();
    });
}