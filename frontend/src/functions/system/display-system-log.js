// File: /frontend/src/functions/system/display-system-log.js

/**
 * ============================================================================
 * MODULE: /frontend/src/functions/system/display-system-log.js
 * 
 * FUNCTION: 
 * The Unified System Monitor. Provides a secure, tabbed UI for OS observability.
 * - LIVE MODE: Intercepts zero-latency TAO_LIVE_LOG events directly in the browser.
 * - HISTORICAL MODE: Queries the AWS PostgreSQL database with advanced filters 
 *   (User, Module, Date Range, Severity).
 * 
 * USAGE SYNTAX:
 * import { launchSystemLogMonitor } from './display-system-log.js';
 * 
 * // userContext must include clearance level (e.g., 'Admin')
 * launchSystemLogMonitor(userContext);
 * ============================================================================
 * 
 * ARCHITECTURE UPDATE (SSOT Dynamic Math):
 * - Layer Target: Replaced legacy string targeting. Now correctly mounts to 
 *   window.TAO_USER_CONFIG.WORKSPACE_LAYER_ID (Layer 2).
 * - Physics Integration: Leverages the tao-workspace-window class, ensuring 
 *   windowmanager.js can properly drag and drop this module.
 * ============================================================================
 */

import { getHighestUserLayer, bringModuleToFront } from './get-highest-user-layer.js';

let isMonitorOpen = false;

export function launchSystemLogMonitor(userContext) {
    if (isMonitorOpen) {
        bringModuleToFront('display_system_log', userContext?.id);
        return;
    }

    // 1. Verify Clearance
    const clearance = userContext?.clearance?.toLowerCase() || 'explorer';
    if (!['admin', 'superadmin', 'root', 'system'].includes(clearance)) {
        alert("ACCESS DENIED: Insufficient clearance to view system telemetry.");
        return;
    }

    isMonitorOpen = true;
    const userId = userContext?.id || 'unknown';

    // 2. Standardized Window Construction (Dynamically routed to Layer 2 via SSOT)
    const layerMath = getHighestUserLayer('display_system_log', false, userId);
    
    // >>> THE SSOT FIX: Replaced hardcoded Layer 3 string with dynamic Layer 2 config
    const appLayerId = window.TAO_USER_CONFIG?.WORKSPACE_LAYER_ID || 'layer-2-user';
    const targetLayer = document.getElementById(appLayerId) || document.body;

    const win = document.createElement('div');
    win.classList.add('tao-workspace-window'); // Critical for dragging physics
    
    Object.assign(win.style, {
        position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)',
        width: '800px', height: '600px', backgroundColor: '#0f172a', 
        border: '1px solid #38bdf8', borderRadius: '8px', display: 'flex', 
        flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', 
        zIndex: layerMath.zIndex, pointerEvents: 'auto', overflow: 'hidden'
    });

    if (window.TAO_ENGINE && window.TAO_ENGINE.createWindowBar) {
        const winBar = window.TAO_ENGINE.createWindowBar({ titleText: 'SYSTEM MONITOR', windowElement: win });
        const closeBtn = winBar.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.onclick = () => {
                window.removeEventListener('TAO_LIVE_LOG', logListener);
                isMonitorOpen = false;
                targetLayer.removeChild(win);
            };
        }
        win.appendChild(winBar);
    }
    
    win.onmousedown = () => bringModuleToFront('display_system_log', userId);

    // 3. Control Header (Tabs & Filters)
    const controlHeader = document.createElement('div');
    Object.assign(controlHeader.style, {
        padding: '12px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155',
        display: 'flex', gap: '15px', alignItems: 'center'
    });

    const liveTab = document.createElement('button');
    liveTab.innerText = '🔴 LIVE TELEMETRY';
    
    const historyTab = document.createElement('button');
    historyTab.innerText = '📜 HISTORICAL SEARCH';

    const baseBtnStyle = {
        padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', border: 'none', fontFamily: 'monospace'
    };
    
    Object.assign(liveTab.style, { ...baseBtnStyle, backgroundColor: '#ef4444', color: '#fff' });
    Object.assign(historyTab.style, { ...baseBtnStyle, backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #64748b' });

    const filterContainer = document.createElement('div');
    Object.assign(filterContainer.style, { display: 'none', gap: '10px', flex: 1, justifyContent: 'flex-end' });
    
    const createFilter = (placeholder) => {
        const input = document.createElement('input');
        Object.assign(input.style, {
            padding: '6px', backgroundColor: '#0f172a', color: '#10b981', border: '1px solid #475569', borderRadius: '4px', fontFamily: 'monospace'
        });
        input.placeholder = placeholder;
        return input;
    };

    const userFilter = createFilter('User ID...');
    const moduleFilter = createFilter('Module...');
    const severityFilter = document.createElement('select');
    Object.assign(severityFilter.style, { padding: '6px', backgroundColor: '#0f172a', color: '#10b981', border: '1px solid #475569', borderRadius: '4px', fontFamily: 'monospace' });
    severityFilter.innerHTML = `<option value="">All Severities</option><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option>`;
    
    const searchBtn = document.createElement('button');
    searchBtn.innerText = 'SEARCH DB';
    Object.assign(searchBtn.style, { ...baseBtnStyle, backgroundColor: '#38bdf8', color: '#0f172a' });

    filterContainer.append(userFilter, moduleFilter, severityFilter, searchBtn);
    controlHeader.append(liveTab, historyTab, filterContainer);
    win.appendChild(controlHeader);

    // 4. Output Display Area
    const terminal = document.createElement('div');
    Object.assign(terminal.style, {
        flex: 1, padding: '15px', overflowY: 'auto', backgroundColor: '#020617',
        fontFamily: 'monospace', fontSize: '0.9rem', color: '#94a3b8'
    });
    terminal.innerHTML = `<div style="color:#10b981; margin-bottom:10px;">[System] Live telemetry stream connected... Waiting for events.</div>`;
    win.appendChild(terminal);
    targetLayer.appendChild(win);

    // ==========================================
    // 5. HELPER: DYNAMIC TERMINAL WRITER
    // ==========================================
    const printToTerminal = (timestamp, moduleName, message, type) => {
        let color = '#e2e8f0'; 
        if (type === 'warning') color = '#f59e0b';
        if (type === 'error') color = '#ef4444';

        const entry = document.createElement('div');
        entry.style.cssText = 'margin-bottom:8px; border-bottom:1px solid #1e293b; padding-bottom:6px;';
        entry.innerHTML = `
            <span style="color:#64748b;">[${timestamp}]</span> 
            <span style="color:#38bdf8; font-weight:bold;">[${moduleName}]</span> 
            <span style="color:${color};">${message}</span>
        `;
        
        terminal.appendChild(entry);
        terminal.scrollTop = terminal.scrollHeight; // Auto-scroll
    };

    // ==========================================
    // 6. LOGIC: TAB SWITCHING
    // ==========================================
    let currentMode = 'LIVE';

    liveTab.onclick = () => {
        if (currentMode === 'LIVE') return;
        currentMode = 'LIVE';
        Object.assign(liveTab.style, { backgroundColor: '#ef4444', color: '#fff', border: 'none' });
        Object.assign(historyTab.style, { backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #64748b' });
        filterContainer.style.display = 'none';
        terminal.innerHTML = `<div style="color:#10b981; margin-bottom:10px;">[System] Switched to Live Telemetry...</div>`;
    };

    historyTab.onclick = () => {
        if (currentMode === 'HISTORY') return;
        currentMode = 'HISTORY';
        Object.assign(historyTab.style, { backgroundColor: '#38bdf8', color: '#0f172a', border: 'none' });
        Object.assign(liveTab.style, { backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #64748b' });
        filterContainer.style.display = 'flex';
        terminal.innerHTML = `<div style="color:#38bdf8; margin-bottom:10px;">[System] Ready to query AWS Database. Enter filters and press SEARCH.</div>`;
    };

    // ==========================================
    // 7. LOGIC: LIVE EVENT LISTENER
    // ==========================================
    const logListener = (event) => {
        if (currentMode !== 'LIVE') return; 
        const { moduleName, message, type, timestamp } = event.detail;
        
        printToTerminal(timestamp, moduleName, message, type);
    };

    window.addEventListener('TAO_LIVE_LOG', logListener);

    // ==========================================
    // 8. LOGIC: HISTORICAL AWS SEARCH
    // ==========================================
    searchBtn.onclick = async () => {
        terminal.innerHTML = `<div style="color:#f59e0b;">[System] Querying AWS database...</div>`;
        
        const params = new URLSearchParams();
        if (userFilter.value) params.append('userId', userFilter.value);
        if (moduleFilter.value) params.append('module', moduleFilter.value);
        if (severityFilter.value) params.append('type', severityFilter.value);

        try {
            const response = await fetch(`/api/system/log?${params.toString()}`);
            if (!response.ok) throw new Error('Database fetch failed');
            const data = await response.json();
            
            terminal.innerHTML = ''; 
            
            if (data.length === 0) {
                terminal.innerHTML = `<div style="color:#94a3b8;">No records found for these filters.</div>`;
                return;
            }

            data.forEach(log => {
                const timeStr = new Date(log.created_at).toLocaleString();
                printToTerminal(timeStr, log.module_name, log.message, log.log_type);
            });
        } catch (error) {
            terminal.innerHTML = `<div style="color:#ef4444;">[System Error] ${error.message}</div>`;
        }
    };
}