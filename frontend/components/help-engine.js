// File: /frontend/components/help-engine.js

/**
 * ============================================================================
 * MODULE: /frontend/components/help-engine.js
 * 
 * FUNCTION: 
 * The TAO Universal Help UI Controller. A dual-mode engine for system documentation.
 * 
 * 1. CONTEXTUAL MODE (Micro): Triggered by '?' buttons on individual objects. 
 *    Passes specific help text to the Chatbox and reads it aloud.
 * 2. GLOBAL MODE (Macro): A comprehensive Layer 2 window offering a searchable 
 *    index of all system documentation.
 * ============================================================================
 * 
 * ARCHITECTURE UPDATE:
 * - Data Decoupled: Dictionary data moved to /frontend/config/help-dictionary.js
 * - Hybrid Chatbox Integration: Eliminates pop-ups for contextual help.
 * - SSOT Compliant: Global Help Window dynamically routes to Layer 2.
 * ============================================================================
 */

import { getHighestUserLayer, bringModuleToFront } from '../src/functions/system/get-highest-user-layer.js';
import { speak } from './voiceManager.js';

// >>> THE FIX: Import the decoupled data object <<<
import { HELP_DICTIONARY } from '../config/help-dictionary.js';

let isGlobalHelpOpen = false;

// ============================================================================
// 1. CONTEXTUAL HELP (The Micro Chatbox Bridge)
// Usage: window.TAO_ENGINE.triggerHelp('forge');
// ============================================================================
export function triggerContextualHelp(topicId, customText = null) {
    const helpData = HELP_DICTIONARY[topicId] || HELP_DICTIONARY['default'];
    const helpText = customText || helpData.text;

    // 1. Ensure Chatbox is visible
    if (window.TAO_TOGGLE_CHATBOX) {
        const chatWrapper = document.getElementById('tao-chatbox-wrapper');
        if (chatWrapper && chatWrapper.style.display === 'none') {
            window.TAO_TOGGLE_CHATBOX();
        }
    }

    // 2. Inject help directly into the Chatbox DOM
    const msgArea = document.getElementById('msg-area');
    if (msgArea) {
        const msgRow = document.createElement('div');
        msgRow.style.cssText = `display: flex; width: 100%; justify-content: flex-start; box-sizing: border-box; margin-bottom: 8px;`;
        
        const bubble = document.createElement('div');
        bubble.style.cssText = `
            background-color: rgba(16, 185, 129, 0.1); color: #10b981; 
            padding: 8px 16px; border-radius: 20px; max-width: 85%; 
            font-family: monospace; font-size: 14px; line-height: 1.5; 
            font-weight: bold; border: 1px dashed #10b981;
        `;
        
        bubble.innerHTML = `[Help: ${helpData.title}]<br><span style="color:#e2e8f0; font-weight:normal;">${helpText}</span>`;
        msgRow.appendChild(bubble);
        msgArea.appendChild(msgRow);
        msgArea.scrollTop = msgArea.scrollHeight;
    }

    // 3. Speak the text (Can be interrupted by the Chatbox Stop Button)
    speak(helpText, () => {
        console.log(`[Help Engine] Finished reading context for: ${topicId}`);
    });
}

// ============================================================================
// 2. GLOBAL HELP DICTIONARY (The Macro Window)
// Usage: launchGlobalHelp(userContext);
// ============================================================================
export function launchGlobalHelp(userContext) {
    const userId = userContext?.id || 'unknown';

    if (isGlobalHelpOpen) {
        bringModuleToFront('help_engine', userId);
        return;
    }
    isGlobalHelpOpen = true;

    // Dynamically target Layer 2 Front Stage
    const layerMath = getHighestUserLayer('help_engine', false, userId);
    const appLayerId = window.TAO_USER_CONFIG?.WORKSPACE_LAYER_ID || 'layer-2-user';
    const targetLayer = document.getElementById(appLayerId) || document.body;

    // Window Construction
    const win = document.createElement('div');
    win.classList.add('tao-workspace-window'); 
    Object.assign(win.style, {
        position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)',
        width: '800px', maxWidth: '95%', height: '600px', maxHeight: '90%', 
        backgroundColor: '#0f172a', border: '1px solid #10b981', borderRadius: '8px', 
        display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', 
        zIndex: layerMath.zIndex, pointerEvents: 'auto', overflow: 'hidden'
    });

    if (window.TAO_ENGINE && window.TAO_ENGINE.createWindowBar) {
        const winBar = window.TAO_ENGINE.createWindowBar({ titleText: 'TAO HELP DICTIONARY', windowElement: win });
        const closeBtn = winBar.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.onclick = () => {
                isGlobalHelpOpen = false;
                targetLayer.removeChild(win);
            };
        }
        win.appendChild(winBar);
    }
    win.onmousedown = () => bringModuleToFront('help_engine', userId);

    // Main Layout Split (Sidebar Index + Main Content)
    const container = document.createElement('div');
    Object.assign(container.style, { display: 'flex', flex: 1, overflow: 'hidden' });

    // Sidebar: Index List
    const sidebar = document.createElement('div');
    Object.assign(sidebar.style, {
        width: '250px', backgroundColor: '#1e293b', borderRight: '1px solid #334155',
        display: 'flex', flexDirection: 'column', padding: '10px', overflowY: 'auto'
    });

    // Main Content Area
    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, {
        flex: 1, backgroundColor: '#020617', padding: '20px', 
        display: 'flex', flexDirection: 'column', overflowY: 'auto'
    });

    // Search Bar
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search help dictionary...';
    Object.assign(searchInput.style, {
        width: '100%', padding: '10px', background: '#0f172a', color: '#10b981', 
        border: '1px solid #475569', borderRadius: '4px', outline: 'none', 
        fontFamily: 'monospace', marginBottom: '15px', boxSizing: 'border-box'
    });
    contentArea.appendChild(searchInput);

    // Display Area
    const displayBox = document.createElement('div');
    Object.assign(displayBox.style, { color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', lineHeight: '1.6' });
    displayBox.innerHTML = `<h2 style="color:#10b981; margin-top:0;">Welcome to TAO Help</h2><p>Select an object from the dictionary index or search for a specific function to begin.</p>`;
    contentArea.appendChild(displayBox);

    // Build the Index list from the imported Dictionary
    const buildIndex = (filterText = '') => {
        sidebar.innerHTML = '<div style="color:#94a3b8; font-family:monospace; font-weight:bold; margin-bottom:10px;">OBJECT INDEX</div>';
        
        Object.entries(HELP_DICTIONARY).forEach(([key, data]) => {
            if (filterText && !data.title.toLowerCase().includes(filterText.toLowerCase())) return;

            const item = document.createElement('div');
            item.innerText = `> ${data.title}`;
            Object.assign(item.style, {
                padding: '8px', color: '#38bdf8', cursor: 'pointer', 
                fontFamily: 'monospace', fontSize: '13px', borderRadius: '4px',
                marginBottom: '4px'
            });
            
            item.onmouseenter = () => item.style.backgroundColor = '#0f172a';
            item.onmouseleave = () => item.style.backgroundColor = 'transparent';
            
            item.onclick = () => {
                displayBox.innerHTML = `
                    <h2 style="color:#10b981; margin-top:0;">${data.title}</h2>
                    <span style="background:#334155; padding:2px 6px; border-radius:4px; font-size:11px; font-family:monospace;">${data.category}</span>
                    <p style="margin-top:15px; font-size:15px;">${data.text}</p>
                    <button id="btn-read-${key}" style="margin-top:20px; padding:8px 16px; background:#38bdf8; color:#0f172a; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">
                        READ ALOUD IN CHATBOX
                    </button>
                `;
                
                // Wire the button to trigger the Hybrid Chatbox Micro Mode
                document.getElementById(`btn-read-${key}`).onclick = () => {
                    triggerContextualHelp(key);
                };
            };
            sidebar.appendChild(item);
        });
    };

    searchInput.addEventListener('input', (e) => buildIndex(e.target.value));
    buildIndex();

    container.appendChild(sidebar);
    container.appendChild(contentArea);
    win.appendChild(container);
    targetLayer.appendChild(win);

    // Expose to window for global OS routing
    window.TAO_ENGINE = window.TAO_ENGINE || {};
    window.TAO_ENGINE.triggerHelp = triggerContextualHelp;
}