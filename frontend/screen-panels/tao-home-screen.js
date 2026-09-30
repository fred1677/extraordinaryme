/**
 * ============================================================================
 * MODULE: /frontend/screen-panels/tao-home-screen.js
 * 
 * THE SECURE ROOM (Backend Mode Switch)
 * ============================================================================
 * Updated for Database-Driven Architecture.
 * Dynamically fetches restricted administrative applications from the PostgreSQL 
 * registry based on user clearance level and merges them with the local manifest.
 * ============================================================================
 */

import { initTopBar } from '../src/functions/t/top-bar.js';
import { desktopManifest } from './desktop-manifest.js';

export async function initTaoHomeScreen() {
    return new Promise(async (resolve) => {
        const userWorkspace = document.getElementById('user-workspace');
        const backendWorkspace = document.getElementById('backend-workspace');
        
        if (userWorkspace) userWorkspace.style.display = 'none';     
        if (backendWorkspace) backendWorkspace.style.display = 'block'; 

        if (window.TAO_ENGINE && window.TAO_ENGINE.setWorkspaceMode) {
            window.TAO_ENGINE.setWorkspaceMode('backend');
        }
        await initTopBar(); 

        if (document.getElementById('tao-backend-canvas')) {
            console.log('[System Router] Switched to Secure Backend Mode.');
            resolve();
            return;
        }

        const bounds = window.TAO_ENGINE.getWorkspaceBounds();

        const desktop = document.createElement('div');
        desktop.id = 'tao-backend-canvas';
        Object.assign(desktop.style, {
            position: 'absolute', top: `${bounds.top}px`, left: '0', width: '100vw', 
            height: `calc(100vh - ${bounds.top + bounds.bottom}px)`,
            backgroundColor: '#0f172a', 
            display: 'flex', alignContent: 'flex-start', flexWrap: 'wrap',
            padding: '24px 40px', gap: '30px', boxSizing: 'border-box',
            overflowY: 'auto', pointerEvents: 'auto', zIndex: '20000' 
        });

        const userDesignation = window.TAO_USER_CONFIG?.designation || 'Explorer';
        const userShortcuts = window.TAO_USER_CONFIG?.desktopShortcuts || ['Health'];
        if (!userShortcuts.includes('Chatbox')) userShortcuts.push('Chatbox');

        // ====================================================================
        // HYBRID APP LOADER (Database Registry + Local Manifest)
        // ====================================================================
        let dbApps = [];
        try {
            const userId = localStorage.getItem('TAO_SESSION_TOKEN') || 'unknown';
            const res = await fetch(`/api/system/apps?userId=${userId}`);
            const data = await res.json();
            if (data.success) dbApps = data.apps;
        } catch (err) {
            console.error('[Secure Desktop] Failed to fetch dynamic apps from database:', err);
        }

        // Map DB apps to the manifest structure for seamless rendering
        const dynamicApps = dbApps.map(dbApp => ({
            appName: dbApp.app_name,
            iconPath: dbApp.icon_path,
            modulePath: dbApp.js_file_path,
            windowFrame: true, 
            initMethod: 'init' + dbApp.app_name.replace(/\s+/g, '') // e.g. "App Manager" -> "initAppManager"
        }));

        // Merge static and dynamic apps. Dynamic DB apps overwrite static ones if names collide.
        const mergedManifest = [...desktopManifest];
        dynamicApps.forEach(dynApp => {
            const existingIdx = mergedManifest.findIndex(m => m.appName === dynApp.appName);
            if (existingIdx > -1) mergedManifest[existingIdx] = dynApp;
            else mergedManifest.push(dynApp);
        });

        const createAppIcon = (appName, iconData, onClickAction) => {
            const appContainer = document.createElement('div');
            appContainer.dataset.appName = appName; 
            
            Object.assign(appContainer.style, {
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                width: '44px', minHeight: '44px', cursor: 'pointer', transition: 'transform 0.2s ease'
            });

            const iconBox = document.createElement('div');
            Object.assign(iconBox.style, {
                width: '32px', height: '32px', backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)', marginBottom: '6px',
                backdropFilter: 'blur(5px)'
            });

            // Auto-detect if icon is raw SVG string or an image path (from the DB)
            let iconHtml = '';
            if (iconData && iconData.trim().startsWith('<svg')) {
                iconHtml = `<div style="display: flex; align-items: center; justify-content: center; transform: scale(0.70); transform-origin: center;">${iconData}</div>`;
            } else if (iconData) {
                iconHtml = `<img src="${iconData}" style="width: 24px; height: 24px; object-fit: contain;" alt="${appName}">`;
            }
            iconBox.innerHTML = iconHtml;

            const appLabel = document.createElement('div');
            Object.assign(appLabel.style, {
                color: '#f8fafc', 
                fontFamily: 'sans-serif', fontSize: '11px',
                textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap', overflow: 'visible'
            });
            appLabel.innerText = appName;

            appContainer.onmouseover = () => appContainer.style.transform = 'scale(1.05)';
            appContainer.onmouseout = () => appContainer.style.transform = 'scale(1)';
            appContainer.onclick = onClickAction;

            appContainer.appendChild(iconBox);
            appContainer.appendChild(appLabel);
            return appContainer;
        };
        
        // Filter apps based on user shortcuts (System/Godmode bypasses this filter)
        const appsToRender = (userDesignation === 'System' || userDesignation === 'Godmode')
            ? mergedManifest 
            : mergedManifest.filter(app => userShortcuts.includes(app.appName) || app.appName === 'Chatbox');

        appsToRender.forEach(app => {
            // Use iconPath if available (from DB), otherwise fallback to hardcoded iconSvg
            const activeIcon = app.iconPath || app.iconSvg;

            const injectedApp = createAppIcon(app.appName, activeIcon, async () => {
                console.log(`[Secure Desktop] Launching ${app.appName}...`);
                
                if (app.appName === 'Chatbox' || app.modulePath === 'chatbox') {
                    if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
                    return;
                }
                
                try {
                    const module = await import(app.modulePath);

                    if (app.windowFrame) {
                        const appWindow = document.createElement('div');
                        appWindow.classList.add('tao-workspace-window');
                        Object.assign(appWindow.style, {
                            backgroundColor: '#ffffff', overflow: 'hidden', 
                            display: 'flex', flexDirection: 'column', pointerEvents: 'auto'
                        });

                        const contentArea = document.createElement('div');
                        Object.assign(contentArea.style, { flex: '1', overflow: 'hidden', position: 'relative' });
                        appWindow.appendChild(contentArea);

                        if (window.TAO_ENGINE && window.TAO_ENGINE.decorateAppWindow) {
                            window.TAO_ENGINE.decorateAppWindow(appWindow, app.appName);
                        }
                        
                        // Robust ES Module initialization fallback chain
                        if (typeof module[app.initMethod] === 'function') {
                            module[app.initMethod](contentArea);
                        } else if (typeof module.default === 'function') {
                            module.default(contentArea);
                        } else {
                            const exportKeys = Object.keys(module);
                            const firstFuncKey = exportKeys.find(key => typeof module[key] === 'function');
                            if (firstFuncKey) module[firstFuncKey](contentArea);
                            else console.error(`[Desktop] No init function found in ${app.modulePath}`);
                        }
                    } else {
                        if (typeof module[app.initMethod] === 'function') module[app.initMethod]();
                    }
                } catch (err) { console.error(`Failed to load module: ${app.appName}`, err); }
            });
            desktop.appendChild(injectedApp);
        });

        if (backendWorkspace) {
            backendWorkspace.appendChild(desktop);
        } else {
            document.body.appendChild(desktop); 
        }
        
        console.log('[System Chrome] Backend Canvas rendered with desktop icons.');
        resolve();
    });
}