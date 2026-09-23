// File: /frontend/src/functions/l/list.js

/**
 * ME-SCRIPT: list.js
 * Purpose: Lightweight, read-only data parser and viewer.
 * Usage: "list" (shows all), "list universe" (shows universes), "list system program"
 */

export async function executeListCommand(args = []) {
    console.log(`[Me-Script] Executing list parser. Filters:`, args);

    let allObjects = [];

    // 1. Fetch live objects from AWS
    try {
        const response = await fetch('/api/objects');
        if (!response.ok) throw new Error('Failed to fetch AWS objects');
        allObjects = await response.json();
    } catch (error) {
        console.error('[List] AWS Connection Error:', error);
        return;
    }

    // 2. Parse arguments and filter data
    if (args && args.length > 0) {
        const targetTypes = args.map(arg => arg.toLowerCase());
        allObjects = allObjects.filter(obj => 
            targetTypes.includes((obj.taxonomy || 'object').toLowerCase())
        );
    }

    // 3. Target Layer 3 for the floating UI
    const layer3 = document.getElementById('layer-3-drawers') || document.body;
    const existingPanel = document.getElementById('tao-list-panel');
    if (existingPanel) existingPanel.remove();

    // 4. Build the Read-Only Container
    const panel = document.createElement('div');
    panel.id = 'tao-list-panel';
    Object.assign(panel.style, {
        position: 'absolute', top: '20px', right: '20px', width: '400px', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', 
        border: '1px solid #334155', borderRadius: '8px', padding: '16px', 
        color: '#e2e8f0', fontFamily: 'monospace', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 9999
    });

    // 5. Build Header with Close Button
    const headerRow = document.createElement('div');
    Object.assign(headerRow.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' });
    
    const header = document.createElement('h2');
    header.innerText = args.length > 0 ? `SYSTEM DICTIONARY: [${args.join(', ').toUpperCase()}]` : 'SYSTEM DICTIONARY: [ALL]';
    Object.assign(header.style, { color: '#38bdf8', fontSize: '1.2rem', marginTop: '0', marginBottom: '0' });
    
    const closeBtn = document.createElement('span');
    closeBtn.innerText = '< Close >';
    Object.assign(closeBtn.style, { color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', marginTop: '4px' });
    closeBtn.onmouseover = () => closeBtn.style.color = '#f87171';
    closeBtn.onmouseout = () => closeBtn.style.color = '#ef4444';
    closeBtn.onclick = () => panel.remove();
    
    headerRow.appendChild(header);
    headerRow.appendChild(closeBtn);
    panel.appendChild(headerRow);

    // 6. Build the Content Area
    const contentDiv = document.createElement('div');
    Object.assign(contentDiv.style, { overflowY: 'auto', flex: 1, paddingRight: '4px' });
    panel.appendChild(contentDiv);
    layer3.appendChild(panel);

    // 7. Render the Filtered Output
    if (allObjects.length === 0) {
        contentDiv.innerHTML = `<div style="color:#ef4444; font-style:italic;">No entities matched your query.</div>`;
        return;
    }

    // Group by taxonomy for clean reading
    const taxonomies = [...new Set(allObjects.map(o => o.taxonomy || 'object'))].sort();
    
    taxonomies.forEach(tax => {
        const items = allObjects.filter(o => (o.taxonomy || 'object') === tax);
        if (items.length > 0) {
            const taxHeader = document.createElement('div');
            taxHeader.innerText = `> ${tax.toUpperCase()}`;
            Object.assign(taxHeader.style, { color: '#94a3b8', fontWeight: 'bold', marginTop: '12px', marginBottom: '4px', borderBottom: '1px solid #1e293b' });
            contentDiv.appendChild(taxHeader);
            
            items.sort((a, b) => a.name.localeCompare(b.name)).forEach(obj => {
                const row = document.createElement('div');
                Object.assign(row.style, { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #1e293b' });
                
                const nameEl = document.createElement('span');
                nameEl.innerHTML = `- <strong style="color: #10b981;">${obj.name}</strong>`;
                
                const statusEl = document.createElement('span');
                statusEl.innerText = obj.status === 'finished' ? '[Finished]' : '[Not Done]';
                statusEl.style.color = obj.status === 'finished' ? '#10b981' : '#f59e0b';
                statusEl.style.fontSize = '0.85rem';

                row.appendChild(nameEl);
                row.appendChild(statusEl);
                contentDiv.appendChild(row);
            });
        }
    });
}