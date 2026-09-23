/**
 * ============================================================================
 * MODULE: /frontend/screen-panels/home-screen.js
 * 
 * THE PUBLIC ROOM (User Mode Switch)
 * ============================================================================
 * LAYPERSON EXPLANATION:
 * This script is the "Light Switch" for the Public Room. When you enter 
 * standard mode, this script turns off the lights in the Backend Room, 
 * turns on the lights in the User Room, and tells the OS to hide the top bar.
 * It builds the public desktop only ONCE on boot.
 * ============================================================================
 */

import { desktopManifest } from './desktop-manifest.js';

export async function initHomeScreen() {
    return new Promise((resolve) => {
        // 1. THE LIGHT SWITCH 
        const userWorkspace = document.getElementById('user-workspace');
        const backendWorkspace = document.getElementById('backend-workspace');
        
        if (backendWorkspace) backendWorkspace.style.display = 'none'; // Turn off backend
        if (userWorkspace) userWorkspace.style.display = 'block';      // Turn on user mode

        // 2. GEOMETRY ENFORCEMENT
        if (window.TAO_ENGINE && window.TAO_ENGINE.setWorkspaceMode) {
            window.TAO_ENGINE.setWorkspaceMode('standard');
        }

        // 3. PREVENT DUPLICATE MOUNTS 
        // If the public desktop already exists, we are done. (The switch is complete).
        if (document.getElementById('tao-desktop-canvas')) {
            console.log('[System Router] Switched to Public User Mode.');
            resolve();
            return;
        }

        // ====================================================================
        // 4. DESKTOP CONSTRUCTION (Runs only once during OS Boot)
        // ====================================================================
        const userDesignation = window.TAO_USER_CONFIG?.designation || 'Explorer';
        const userShortcuts = window.TAO_USER_CONFIG?.desktopShortcuts || ['Health'];
        if (!userShortcuts.includes('Chatbox')) userShortcuts.push('Chatbox');

        const workspaceTop = 0; 
        const workspaceBottom = 44; 

        const desktop = document.createElement('div');
        desktop.id = 'tao-desktop-canvas';
        Object.assign(desktop.style, {
            position: 'absolute', top: `${workspaceTop}px`, left: '0',
            width: '100vw', height: `calc(100vh - ${workspaceTop + workspaceBottom}px)`,
            backgroundColor: '#000000', // Solid black curtain for user mode
            display: 'flex', alignContent: 'flex-start', flexWrap: 'wrap',
            padding: '24px 40px', gap: '30px', boxSizing: 'border-box',
            overflowY: 'auto', pointerEvents: 'auto', zIndex: '20000' 
        });
        
        const createAppIcon = (appName, iconSvg, onClickAction) => {
            const appContainer = document.createElement('div');
            appContainer.dataset.appName = appName; 
            Object.assign(appContainer.style, {
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                width: '80px', cursor: 'pointer', transition: 'transform 0.2s ease'
            });

            const iconBox = document.createElement('div');
            Object.assign(iconBox.style, {
                width: '60px', height: '60px', backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)', marginBottom: '8px',
                backdropFilter: 'blur(5px)'
            });
            iconBox.innerHTML = iconSvg;

            const appLabel = document.createElement('div');
            Object.assign(appLabel.style, {
                color: '#ffffff', fontFamily: 'sans-serif', fontSize: '12px',
                textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.8)'
            });
            appLabel.innerText = appName;

            appContainer.onmouseover = () => appContainer.style.transform = 'scale(1.05)';
            appContainer.onmouseout = () => appContainer.style.transform = 'scale(1)';
            appContainer.onclick = onClickAction;

            appContainer.appendChild(iconBox);
            appContainer.appendChild(appLabel);
            return appContainer;
        };
        
        const appsToRender = userDesignation === 'System' 
            ? desktopManifest 
            : desktopManifest.filter(app => userShortcuts.includes(app.appName));

        appsToRender.forEach(app => {
            const injectedApp = createAppIcon(app.appName, app.iconSvg, async () => {
                console.log(`[Public Desktop] Launching ${app.appName}...`);
                
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

                        // The Smart Router in windowmanager.js will catch this and put it in the right room

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

        // Attach the canvas specifically to the User Room
        if (userWorkspace) {
            userWorkspace.appendChild(desktop);
        } else {
            document.body.appendChild(desktop); // Fallback
        }
        
        resolve();
    });
}