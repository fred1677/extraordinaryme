/**
 * ============================================================================
 * MODULE: /frontend/screen-panels/system-desktop.js
 * DESCRIPTION: An isolated Layer 2 workspace exclusively for System Admin tools.
 * Standardized to match consumer desktop physics and aesthetics.
 * ============================================================================
 */

import { bringModuleToFront } from '../src/functions/system/get-highest-user-layer.js';

// ============================================================================
// SYSTEM REGISTRY (The initial apps available to Admins)
// ============================================================================
export const systemRegistry = [
    {
        appName: 'Ad Inventory',
        iconSvg: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffd700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="12" rx="2" ry="2"></rect><path d="M12 16v4"></path><path d="M8 20h8"></path></svg>`,
        modulePath: '../src/functions/a/manage-vendor-ad.js',
        initMethod: 'initAdManager',
        windowFrame: true // Wraps the app in a draggable/closable OS window
    }
];

export async function initSystemDesktop() {
    const workspace = document.getElementById('tao-os-root') || document.body;
    const standardDesktop = document.getElementById('tao-desktop-canvas');

    // Hide standard desktop safely
    if (standardDesktop) standardDesktop.style.display = 'none';

    // Clear existing system desktop if we are redrawing after adding a new shortcut
    let sysDesktop = document.getElementById('tao-system-canvas');
    if (sysDesktop) sysDesktop.remove();

    // 🚀 FIX: Use the true usable top boundary so it doesn't slide under the Ad/Top bars
    const topBoundary = window.TAO_SYSTEM_CONFIG?.HARDWARE?.USABLE_TOP_BOUNDARY || 44;
    const bottomBarHeight = window.TAO_SYSTEM_CONFIG?.HARDWARE?.TOP_BAR_HEIGHT || 44; 

    // Retrieve Admin's configured shortcuts (Default to the full registry if empty)
    window.TAO_USER_CONFIG = window.TAO_USER_CONFIG || {};
    const adminShortcuts = window.TAO_USER_CONFIG.systemShortcuts || ['Ad Inventory'];

    // Build the isolated Admin Canvas
    sysDesktop = document.createElement('div');
    sysDesktop.id = 'tao-system-canvas';
    Object.assign(sysDesktop.style, {
        position: 'absolute', 
        top: `${topBoundary}px`, 
        left: '0',
        width: '100vw', 
        height: `calc(100vh - ${topBoundary + bottomBarHeight}px)`,
        display: 'flex', alignContent: 'flex-start', flexWrap: 'wrap',
        padding: '40px', gap: '30px', boxSizing: 'border-box',
        overflowY: 'auto', 
        zIndex: window.TAO_USER_CONFIG?.Z_BASE || '20000',
        pointerEvents: 'auto', // 🚀 FIX: Makes the entire canvas and its icons clickable
        backgroundColor: 'transparent' // 🚀 FIX: Standardized to match consumer desktop (pure black)
    });
    
    const createAppIcon = (appName, iconSvg, onClickAction) => {
        const appContainer = document.createElement('div');
        Object.assign(appContainer.style, {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            width: '80px', cursor: 'pointer', transition: 'transform 0.2s ease'
        });

        const iconBox = document.createElement('div');
        // 🚀 FIX: Standardized icon box styling to match consumer desktop glass effect
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
    
    // ==========================================
    // DYNAMIC APP INJECTOR (Filters Registry by Admin Shortcuts)
    // ==========================================
    const appsToRender = systemRegistry.filter(app => adminShortcuts.includes(app.appName));

    appsToRender.forEach(app => {
        const injectedApp = createAppIcon(app.appName, app.iconSvg, async () => {
            console.log(`[System Desktop] Launching ${app.appName}...`);
            try {
                const module = await import(app.modulePath);

                if (app.windowFrame) {
                    // STANDARD OS WINDOW ARCHITECTURE
                    const appLayerId = window.TAO_ENGINE?.LAYERS?.USER || 'layer-2-user';
                    const targetLayer = document.getElementById(appLayerId) || workspace;
                    
                    const appWindow = document.createElement('div');
                    appWindow.classList.add('tao-workspace-window'); 
                    
                    Object.assign(appWindow.style, {
                        position: 'absolute', top: '5%', left: '10%',
                        width: '80%', height: '90%', backgroundColor: '#ffffff',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', borderRadius: '8px',
                        zIndex: '20100', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        pointerEvents: 'auto', boxSizing: 'border-box'
                    });

                    if (window.TAO_ENGINE && window.TAO_ENGINE.createWindowBar) {
                        appWindow.appendChild(window.TAO_ENGINE.createWindowBar({ titleText: `System App: ${app.appName}`, windowElement: appWindow }));
                    } else {
                        const header = document.createElement('div');
                        Object.assign(header.style, {
                            height: '40px', backgroundColor: '#0f172a', display: 'flex',
                            alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', flexShrink: 0
                        });
                        const windowTitle = document.createElement('span');
                        windowTitle.innerText = `TAO OS: ${app.appName}`;
                        Object.assign(windowTitle.style, { color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' });
                        const closeBtn = document.createElement('button');
                        closeBtn.innerText = '✕';
                        Object.assign(closeBtn.style, { background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' });
                        closeBtn.onclick = () => appWindow.remove();
                        header.appendChild(windowTitle);
                        header.appendChild(closeBtn);
                        appWindow.appendChild(header);
                    }

                    appWindow.onmousedown = () => bringModuleToFront(app.appName);

                    const contentArea = document.createElement('div');
                    Object.assign(contentArea.style, { flex: '1', overflowY: 'auto', position: 'relative', boxSizing: 'border-box' });
                    appWindow.appendChild(contentArea);

                    targetLayer.appendChild(appWindow);

                    if (typeof module[app.initMethod] === 'function') {
                        module[app.initMethod](contentArea);
                    } else {
                        contentArea.innerHTML = `<div style="padding:20px;color:red;">Error: Function ${app.initMethod} missing.</div>`;
                    }
                } else {
                    if (typeof module[app.initMethod] === 'function') {
                        module[app.initMethod]();
                    }
                }
            } catch (err) {
                console.error(`Failed to load system module: ${app.appName}`, err);
            }
        });
        sysDesktop.appendChild(injectedApp);
    });

    workspace.appendChild(sysDesktop);
}

/**
 * ============================================================================
 * EXPORT: addSystemShortcut(appName)
 * 
 * Allows dynamic injection of new System apps onto the Admin desktop.
 * ============================================================================
 */
export function addSystemShortcut(appName) {
    window.TAO_USER_CONFIG = window.TAO_USER_CONFIG || {};
    window.TAO_USER_CONFIG.systemShortcuts = window.TAO_USER_CONFIG.systemShortcuts || ['Ad Inventory'];
    
    if (!window.TAO_USER_CONFIG.systemShortcuts.includes(appName)) {
        window.TAO_USER_CONFIG.systemShortcuts.push(appName);
        console.log(`[System Desktop] Shortcut added: ${appName}`);
        initSystemDesktop(); // Redraw immediately
    }
}