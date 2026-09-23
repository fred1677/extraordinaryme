/**
 * ============================================================================
 * MODULE: /frontend/screen-panels/tao-home-screen.js
 * 
 * THE SECURE ROOM (Backend Mode Switch)
 * ============================================================================
 * LAYPERSON EXPLANATION:
 * This script is the "Light Switch" for the Admin Room. It turns off the 
 * User Room lights, turns on the Backend Room, asks the OS to lower the 
 * ceiling, and injects the secure Top Bar. It builds the secure desktop ONCE.
 * ============================================================================
 */

import { initTopBar } from '../src/functions/t/top-bar.js';
import { desktopManifest } from './desktop-manifest.js';

export async function initTaoHomeScreen() {
    return new Promise(async (resolve) => {
        // 1. THE LIGHT SWITCH
        const userWorkspace = document.getElementById('user-workspace');
        const backendWorkspace = document.getElementById('backend-workspace');
        
        if (userWorkspace) userWorkspace.style.display = 'none';     // Turn off user mode
        if (backendWorkspace) backendWorkspace.style.display = 'block'; // Turn on backend

        // 2. GEOMETRY ENFORCEMENT & TOP BAR
        if (window.TAO_ENGINE && window.TAO_ENGINE.setWorkspaceMode) {
            window.TAO_ENGINE.setWorkspaceMode('backend');
        }
        await initTopBar(); // Ensure top bar is mounted in the backend room

        // 3. PREVENT DUPLICATE MOUNTS
        // If the secure desktop already exists, we are done. (The switch is complete).
        if (document.getElementById('tao-backend-canvas')) {
            console.log('[System Router] Switched to Secure Backend Mode.');
            resolve();
            return;
        }

        // ====================================================================
        // 4. DESKTOP CONSTRUCTION (Runs only once during the first entry)
        // ====================================================================
        const bounds = window.TAO_ENGINE.getWorkspaceBounds();

        const desktop = document.createElement('div');
        desktop.id = 'tao-backend-canvas';
        Object.assign(desktop.style, {
            position: 'absolute', top: `${bounds.top}px`, left: '0', width: '100vw', 
            height: `calc(100vh - ${bounds.top + bounds.bottom}px)`,
            backgroundColor: '#0f172a', // Dark theme for backend
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
            Object.assign(appContainer.style, {
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                width: '80px', cursor: 'pointer', transition: 'transform 0.2s ease'
            });

            const iconBox = document.createElement('div');
            Object.assign(iconBox.style, {
                width: '60px', height: '60px', backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)', marginBottom: '8px',
                backdropFilter: 'blur(5px)'
            });
            iconBox.innerHTML = iconSvg;

            const appLabel = document.createElement('div');
            Object.assign(appLabel.style, {
                color: '#f8fafc', // Lighter text to contrast the dark background
                fontFamily: 'sans-serif', fontSize: '12px',
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

        // Attach the secure canvas specifically to the Backend Room
        if (backendWorkspace) {
            backendWorkspace.appendChild(desktop);
        } else {
            document.body.appendChild(desktop); // Fallback
        }
        
        console.log('[System Chrome] Backend Canvas rendered with desktop icons.');
        resolve();
    });
}