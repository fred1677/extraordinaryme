// File: /frontend/sandbox.js

/**
 * ============================================================================
 * MODULE: /frontend/sandbox.js
 * 
 * FUNCTION: 
 * The TAO Command Center & Matrix Execution Engine. 
 * Central user workspace hub for dynamic sequencing, app execution, and 
 * real-time display telemetry.
 * ============================================================================
 * 
 * ARCHITECTURAL BOUNDARIES (Strict Separation of Concerns):
 * 1. NO HARDCODED PHYSICS: Relies on windowmanager.js for spatial centering.
 * 2. LIVE DIAGNOSTIC HUD: Exposes active rendering dimensions vs. screensize.js
 *    metrics to prevent invisible layout desyncs.
 * ============================================================================
 */

import { AppBootstrap } from './bootstrap.js'; 
import { getHighestUserLayer, bringModuleToFront } from '/src/functions/system/get-highest-user-layer.js';

export async function renderSandbox(appContainer, config = {}) {
    console.log('[Sandbox] Production canvas built. Initiating Gateway...');
    
    if (!window.TAO_VIEWPORT) {
        AppBootstrap.init();
    }

    if (window.TAO_ENGINE && window.TAO_ENGINE.bulldoze) {
        const targetLayers = window.TAO_ENGINE.LAYERS ? [
            window.TAO_ENGINE.LAYERS.SPACE,
            window.TAO_ENGINE.LAYERS.USER,
            window.TAO_ENGINE.LAYERS.APP
        ] : ['layer-1-space', 'layer-2-user', 'layer-3-application']; 
        
        window.TAO_ENGINE.bulldoze({ layers: targetLayers });
    }

    const userLayerId = window.TAO_ENGINE?.LAYERS?.USER || 'layer-2-user';
    const layer2 = document.getElementById(userLayerId) || document.body;
    
    layer2.style.pointerEvents = 'auto';
    layer2.innerHTML = ''; 
    
    initDashboard(layer2, config); 
}

function createSandboxWindow(titleText, width, height, layerMath, targetLayer) {
    const win = document.createElement('div');
    win.classList.add('tao-workspace-window');
    
    Object.assign(win.style, {
        position: 'absolute', 
        width: width, maxWidth: '96%', height: height, maxHeight: '96%',
        minHeight: '200px', backgroundColor: '#0f172a', border: '1px solid #38bdf8', 
        borderRadius: '8px', display: 'flex', flexDirection: 'column', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', zIndex: layerMath.zIndex, 
        overflow: 'hidden', pointerEvents: 'auto', boxSizing: 'border-box'
    });

    if (window.TAO_ENGINE && window.TAO_ENGINE.createWindowBar) {
        const winBar = window.TAO_ENGINE.createWindowBar({ titleText: titleText, windowElement: win });
        win.appendChild(winBar);
    }

    win.onmousedown = () => bringModuleToFront('sandbox');
    
    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, { 
        padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', 
        flex: 1, overflowY: 'auto', boxSizing: 'border-box', color: '#e2e8f0', fontFamily: 'monospace',
        alignItems: 'center'
    });
    
    win.appendChild(contentArea);
    targetLayer.appendChild(win);
    
    return { win, contentArea };
}

async function initDashboard(targetLayer, config) {
    const savedUserId = localStorage.getItem('tao_user_id') || '00000000-0000-0000-0000-000000000000';
    const layerMath = getHighestUserLayer('sandbox', false, savedUserId);
    const { win, contentArea } = createSandboxWindow('TAO COMMAND CENTER', '600px', '96%', layerMath, targetLayer);

    contentArea.innerHTML = `
        <div style="background:#0f172a; padding:20px; border-radius:12px; border:1px solid #475569; width: 100%; max-width: 550px; box-sizing: border-box;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #334155; padding-bottom: 10px;">
                <div style="color: #38bdf8; font-weight: bold; font-size: 1.1rem; letter-spacing: 1px;">TAO MATRIX</div>
                <div id="sandbox-active-user" style="font-size: 0.75rem; background: #020617; padding: 6px 12px; border-radius: 4px; font-family: monospace;">
                </div>
            </div>

            <!-- OS TELEMETRY HUD -->
            <div style="background: #020617; border: 1px solid #334155; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 0.8rem; font-family: monospace; display: flex; flex-direction: column; gap: 4px; line-height: 1.4;">
                <div>
                    <span style="color: #64748b;">Platform :</span> <span id="hud-platform" style="color: #38bdf8; font-weight: bold;">--</span>
                    <span style="color: #475569; margin: 0 6px;">|</span>
                    <span style="color: #64748b;">O/S :</span> <span id="hud-os" style="color: #10b981; font-weight: bold;">--</span>
                </div>
                <div>
                    <span style="color: #64748b;">Screen size :</span>
                </div>
                <div style="padding-left: 12px;">
                    <span style="color: #94a3b8;">Currently using:</span> <span id="hud-current-size" style="color: #f59e0b; font-weight: bold;">--</span>
                </div>
                <div style="padding-left: 12px;">
                    <span style="color: #94a3b8;">From screensize.js:</span> <span id="hud-screensize-js" style="color: #a855f7; font-weight: bold;">--</span>
                </div>
            </div>

            <div id="registry-list-container" style="text-align: left; margin-bottom: 20px; background: #1e293b; padding: 15px; border-radius: 6px; border: 1px solid #334155; width: 100%; box-sizing: border-box; max-height: 300px; overflow-y: auto;">
                <div style="color: #38bdf8; font-style: italic;">Synchronizing with AWS...</div>
            </div>
            
            <p style="color:#94a3b8; font-size: 0.85rem; margin-bottom: 12px; text-align: left;">
                Enter a sequence matrix (e.g., 1, 4, c 4)
            </p>
            
            <input type="text" id="sequence-input" placeholder="Awaiting sequence..." style="width:100%; padding:12px; background:#1e293b; border:1px solid #475569; color:#10b981; border-radius:6px; box-sizing:border-box; font-size: 1rem; outline: none; font-family: monospace; text-align: center;" autocomplete="off" autofocus>
            
            <button id="btn-run-sequence" style="width:100%; padding:14px; margin-top:16px; background:#10b981; color:#0f172a; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size: 1rem; letter-spacing: 1px;">▶ IGNITE SEQUENCE</button>
            
            <div id="sequence-log" style="margin-top:20px; font-size:12px; color:#f59e0b; max-height: 200px; overflow-y: auto; background: #0b1120; padding: 10px; border-radius: 4px; text-align: left;"></div>
        </div>
    `;

    // Telemetry Updater Function
    const updateTelemetryUI = () => {
        const platformEl = document.getElementById('hud-platform');
        const osEl = document.getElementById('hud-os');
        const currentSizeEl = document.getElementById('hud-current-size');
        const screensizeEl = document.getElementById('hud-screensize-js');

        const activePlatform = window.TAO_DISPLAY?.platform || (window.innerWidth <= 768 ? 'Mobile' : 'Desktop');
        const activeOS = window.TAO_DISPLAY?.os || 'unknown';
        
        // Exact container width currently housing the window
        const currentWidth = targetLayer?.clientWidth || window.innerWidth;
        const currentHeight = targetLayer?.clientHeight || window.innerHeight;
        
        // Target exported values from screensize.js
        const sCanvasWidth = window.TAO_DISPLAY?.canvasWidth ?? document.documentElement.clientWidth;
        const sWorkspaceHeight = window.TAO_DISPLAY?.workspaceHeight ?? currentHeight;

        if (platformEl) platformEl.innerText = activePlatform;
        if (osEl) osEl.innerText = activeOS;
        if (currentSizeEl) currentSizeEl.innerText = `${currentWidth}px x ${currentHeight}px (Layer ID: ${targetLayer.id || 'unknown'})`;
        if (screensizeEl) screensizeEl.innerText = `${sCanvasWidth}px x ${sWorkspaceHeight}px`;
    };

    updateTelemetryUI();
    window.addEventListener('resize', updateTelemetryUI);
    window.addEventListener('TAO_DISPLAY_RESIZED', updateTelemetryUI);

    const logEl = document.getElementById('sequence-log');
    const logMsg = (msg, color = '#f59e0b') => {
        logEl.innerHTML += `<div style="color: ${color}; margin-bottom: 6px;">> ${msg}</div>`;
        logEl.scrollTop = logEl.scrollHeight;
    };

    if (config?.justAuthenticated) {
        if (config.isNewUser) {
            logMsg(`Welcome to TAO, Extraordinary Me! Your origin has been established.`, '#10b981');
        } else {
            logMsg(`Welcome back to TAO Matrix. System synced.`, '#38bdf8');
        }
    } else {
        logMsg(`Session restored. Engine secure.`, '#94a3b8');
    }

    const refreshUserBadge = () => {
        const badge = document.getElementById('sandbox-active-user');
        if (!badge) return;
        
        const currentName = localStorage.getItem('tao_username');
        const currentId = localStorage.getItem('tao_user_id');
        const displayUser = currentName || currentId;
        
        if (displayUser) {
            badge.innerHTML = `IDENTITY: <span style="color:#e2e8f0;">${displayUser}</span>`;
            badge.style.color = '#10b981';
            badge.style.border = '1px solid #10b981';
        } else {
            badge.innerHTML = `IDENTITY: <span style="color:#e2e8f0;">SYSTEM (Godmode)</span>`;
            badge.style.color = '#f59e0b';
            badge.style.border = '1px solid #f59e0b';
        }
    };
    
    refreshUserBadge(); 

    const listContainer = document.getElementById('registry-list-container');
    const runBtn = document.getElementById('btn-run-sequence');
    const inputEl = document.getElementById('sequence-input');

    let allObjects = [];
    let numericRegistry = {}; 
    
    try {
        const response = await fetch(`/api/objects?userId=${savedUserId}`); 
        if (response.ok) allObjects = await response.json();
    } catch (error) {
        console.error('[Sandbox] AWS Connection Error:', error);
    }

    listContainer.innerHTML = `<div style="color: #94a3b8; margin-bottom: 8px; border-bottom: 1px solid #334155; padding-bottom: 4px; font-weight: bold;">AWS REGISTERED ENTITIES</div>`;
    
    if (allObjects.length === 0) {
        listContainer.innerHTML += `<div style="color: #ef4444; font-style: italic;">No entities forged yet.</div>`;
    } else {
        let sequenceNumber = 1;
        const taxonomies = [...new Set(allObjects.map(o => o.taxonomy || 'object'))].sort();
        
        taxonomies.forEach(tax => {
            const items = allObjects.filter(o => (o.taxonomy || 'object') === tax);
            
            items.forEach(obj => {
                numericRegistry[sequenceNumber.toString()] = obj.name;
                
                const row = document.createElement('div');
                Object.assign(row.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px dashed #334155' });
                
                const infoDiv = document.createElement('div');
                infoDiv.innerHTML = `<span style="color: #64748b; margin-right: 8px; display: inline-block; width: 20px;">${sequenceNumber}.</span><span style="color: #10b981; font-weight: bold;">${obj.name}</span> <span style="color: #64748b; font-size: 0.8em;">(${tax})</span>`;
                
                const controlsDiv = document.createElement('div');
                
                const updateBtn = document.createElement('span');
                updateBtn.innerText = '[u]';
                Object.assign(updateBtn.style, { color: '#38bdf8', cursor: 'pointer', marginRight: '12px', fontWeight: 'bold' });
                updateBtn.onclick = () => {
                    inputEl.value = obj.name; 
                    runBtn.click();
                };

                const deleteBtn = document.createElement('span');
                deleteBtn.innerText = '[d]';
                Object.assign(deleteBtn.style, { color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' });
                deleteBtn.onclick = async () => {
                    if (confirm(`CRITICAL WARNING:\nAre you absolutely sure you want to delete '${obj.name}'?`)) {
                        try {
                            const res = await fetch(`/api/objects/${obj.id}`, { method: 'DELETE' });
                            if (res.ok) {
                                win.remove();
                                initDashboard(targetLayer, config); 
                            }
                        } catch(err) {
                            console.error('Delete failed', err);
                        }
                    }
                };

                controlsDiv.appendChild(updateBtn);
                controlsDiv.appendChild(deleteBtn);
                row.appendChild(infoDiv);
                row.appendChild(controlsDiv);
                listContainer.appendChild(row);
                
                sequenceNumber++;
            });
        });
    }

    const waitForUserToExit = (currentApp, nextApp) => {
        return new Promise(resolve => {
            const btnId = `btn-next-${Date.now()}`;
            logMsg(`[⏸] Sequence paused. System is running '${currentApp}'.`, '#94a3b8');
            
            const promptDiv = document.createElement('div');
            promptDiv.style = "margin: 12px 0; padding: 12px; background: #1e293b; border: 1px solid #38bdf8; border-radius: 6px; text-align: center;";
            promptDiv.innerHTML = `
                <div style="color: #e2e8f0; margin-bottom: 8px; font-size: 0.9rem;">Next in pipeline: <span style="color: #10b981; font-weight: bold;">${nextApp}</span></div>
                <button id="${btnId}" style="width: 100%; padding: 8px; background: #38bdf8; color: #0f172a; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">▶ ADVANCE SEQUENCE</button>
            `;
            
            logEl.appendChild(promptDiv);
            logEl.scrollTop = logEl.scrollHeight;

            document.getElementById(btnId).addEventListener('click', () => {
                promptDiv.remove();
                const activeWindows = document.querySelectorAll('.tao-workspace-window, [id^="float-win-"], [id^="editor-win-"], #tao-manageobject-panel');
                activeWindows.forEach(w => {
                    if (w !== win) w.remove();
                });
                resolve();
            });
        });
    };

    const triggerExecution = async () => {
        const sequenceStr = inputEl.value.trim();
        if (!sequenceStr) return;

        runBtn.disabled = true;
        runBtn.style.background = '#64748b';
        inputEl.disabled = true;
        
        logMsg(`---`, '#334155');

        const commands = sequenceStr.split(',').map(c => c.trim()).filter(c => c);
        logMsg(`Initiating blocking matrix: [${commands.join(', ')}]`, '#38bdf8');

        for (let i = 0; i < commands.length; i++) {
            let skipPause = false; 
            let rawInput = commands[i];
            const parts = rawInput.split(' ');

            if (numericRegistry[parts[0]]) {
                logMsg(`Translated command [${parts[0]}] -> ${numericRegistry[parts[0]]}`, '#64748b');
                parts[0] = numericRegistry[parts[0]];
            }

            let rawCmd = parts[0].toLowerCase().replace('.js', ''); 
            if (rawCmd === 'c') rawCmd = 'create';
            
            let cmdArg = parts.slice(1).join(' ').trim();
            if (cmdArg && numericRegistry[cmdArg]) {
                logMsg(`Translated argument [${cmdArg}] -> ${numericRegistry[cmdArg]}`, '#64748b');
                cmdArg = numericRegistry[cmdArg];
            }
            
            const folder = rawCmd.charAt(0); 
            logMsg(`[${i+1}/${commands.length}] Resolving physics for: ${rawCmd}...`);

            const searchPaths = [
                `/components/${rawCmd}.js`, 
                `/src/functions/${folder}/${rawCmd}.js`,
                `/src/functions/system/${rawCmd}.js`,
                `/Extraordinaryme-Scripts/Me-Scripts/functions/${folder}/${rawCmd}.js`,
                `/src/utils/${rawCmd}.js`,
                `/${rawCmd}.js`
            ];

            let module = null;
            let foundPath = null;

            for (const p of searchPaths) {
                try {
                    const check = await fetch(p, { method: 'HEAD' });
                    const contentType = check.headers.get('content-type');
                    
                    // >>> THE FIX: Ensure the server isn't handing us the HTML fallback
                    if (check.ok && contentType && !contentType.includes('text/html')) {
                        try {
                            module = await import(p);
                            foundPath = p;
                            break; 
                        } catch (importErr) {
                            logMsg(`CRITICAL: '${p}' crashed while loading. Check code.`, '#ef4444');
                            console.error(`[Matrix Error] Inside ${p}:`, importErr);
                            skipPause = true;
                            break;
                        }
                    }
                } catch (err) {}
            }

            if (!foundPath) {
                if (!skipPause) logMsg(`CRITICAL: '${rawCmd}.js' not found in any known OS directory.`, '#ef4444');
            } else {
                logMsg(`Physical file locked at: ${foundPath}`, '#64748b');
                
                const exportKeys = Object.keys(module);
                const fnKey = exportKeys.find(key => typeof module[key] === 'function' && key !== 'attachTaoContextMenu');
                
                if (fnKey) {
                    try {
                        logMsg(`Executing logic matrix: ${fnKey}(${cmdArg ? `'${cmdArg}'` : ''})`, '#10b981');
                        
                        const activeUserId = localStorage.getItem('tao_user_id');
                        const creatorContext = { 
                            id: activeUserId || '00000000-0000-0000-0000-000000000000', 
                            clearance: activeUserId ? 'Admin' : 'System' 
                        };
                        
                        let execResult;

                        if (rawCmd === 'login') {
                            logMsg(`[System Guard] Manual execution of login.js blocked. OS Bootloader handles authentication.`, '#ef4444');
                            skipPause = true;
                        } else {
                            execResult = await module[fnKey](creatorContext, cmdArg);
                        }
                        
                        refreshUserBadge(); 
                        
                        if (execResult && execResult.redirect) {
                            logMsg(`[OS Pipeline] Handoff requested. Injecting: ${execResult.redirect}`, '#38bdf8');
                            commands.splice(i + 1, 0, execResult.redirect);
                            skipPause = true; 
                        }
                        
                    } catch (execError) {
                        logMsg(`APP CRASH: '${rawCmd}' threw an internal code error. Check DevTools.`, '#ef4444');
                        console.error(`[App Crash] Inside ${rawCmd}:`, execError);
                    }
                } else {
                    logMsg(`Error: No exported function found inside ${rawCmd}.js`, '#ef4444');
                }
            }

            if (i < commands.length - 1 && !skipPause) {
                let nextInput = commands[i+1];
                let nextAppName = numericRegistry[nextInput] ? numericRegistry[nextInput] : nextInput;
                nextAppName = nextAppName.replace('.js', ''); 
                
                await waitForUserToExit(rawCmd, nextAppName);
                refreshUserBadge(); 
            } else if (!skipPause) {
                await waitForUserToExit(rawCmd, 'END OF SEQUENCE (Return to Command Center)');
                refreshUserBadge(); 
            }
        }

        logMsg(`Sequence matrix complete.`, '#38bdf8');
        
        runBtn.disabled = false;
        runBtn.style.background = '#10b981';
        runBtn.innerText = '▶ RUN ANOTHER SEQUENCE';
        inputEl.disabled = false;
        inputEl.focus();
    };

    runBtn.addEventListener('click', triggerExecution);
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); triggerExecution(); }
    });
}