/**
 * ============================================================================
 * MODULE: /frontend/screen-panels/tao-home-screen.js
 * 
 * THE SECURE ROOM (Backend Mode Switch)
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

        const createAppIcon = (appName, iconSvg, onClickAction) => {
            const appContainer = document.createElement('div');
            appContainer.dataset.appName = appName; 
            
            // Touch target strictly locked to Apple's 44px minimum
            Object.assign(appContainer.style, {
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                width: '44px', minHeight: '44px', cursor: 'pointer', transition: 'transform 0.2s ease'
            });

            const iconBox = document.createElement('div');
            // Visible glass container scaled down to 32px
            Object.assign(iconBox.style, {
                width: '32px', height: '32px', backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)', marginBottom: '6px',
                backdropFilter: 'blur(5px)'
            });
            // SVG graphic inside scaled down proportionally
            iconBox.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; transform: scale(0.70); transform-origin: center;">${iconSvg}</div>`;

            const appLabel = document.createElement('div');
            // Labels configured to prevent wrapping inside the tight 44px bounds
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
        
        const appsToRender = (userDesignation === 'System' || userDesignation === 'Godmode')
            ? desktopManifest 
            : desktopManifest.filter(app => userShortcuts.includes(app.appName));

        appsToRender.forEach(app => {
            const injectedApp = createAppIcon(app.appName, app.iconSvg, async () => {
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
                        if (typeof module[app.initMethod] === 'function') {
                            module[app.initMethod](contentArea);
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