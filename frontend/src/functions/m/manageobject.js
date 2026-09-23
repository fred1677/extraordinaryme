// File: /frontend/src/functions/m/manageobject.js

/**
 * ============================================================================
 * MODULE: /frontend/src/functions/m/manageobject.js
 * 
 * FUNCTION: 
 * The System Object Manager. Provides a GUI to search, filter, edit, 
 * and delete TAO objects directly from the AWS database. Mounts to the 
 * Application Layer (Layer 3) and strictly adheres to the OS Safe Zone.
 * 
 * ARCHITECTURE UPDATE (Edge AI Synchronization):
 * - Live Dictionary Mutation: When an object is renamed, trashed, or edited, 
 *   the manager instantly updates HELP_DICTIONARY and TAO_DICTIONARY in local 
 *   memory so Edge AI routing doesn't break.
 * - Unified Signature: Accepts the standardized creatorContext object.
 * - Restored Docs: Retains the raw JSON/Schema viewer for developers.
 * ============================================================================
 */

// >>> THE FIX: Using Absolute Server Paths to prevent MIME crashes <<<
import { HELP_DICTIONARY } from '/src/config/help-dictionary.js';
import { TAO_DICTIONARY } from '/src/config/tao-dictionary.js';

export async function executeManageObjectCommand(creatorContext = {}, targetType = null) {
    // 1. Unified OS Pipeline Fix
    const isLegacy = typeof creatorContext === 'string';
    const userClearance = isLegacy ? creatorContext : (creatorContext?.clearance || 'Explorer');
    const currentUserId = isLegacy ? arguments[1] : (creatorContext?.id || 'unknown');
    const actualTargetType = isLegacy ? arguments[2] : targetType;

    console.log(`[Me-Script] Executing: manageobject | Target Type: ${actualTargetType || 'ALL'} | Clearance: ${userClearance}`);

    let glossary = {};
    let allObjects = [];

    // 2. Fetch from AWS Database
    try {
        const response = await fetch('/api/objects');
        if (response.ok) {
            const data = await response.json();
            data.forEach(obj => {
                const taxonomyLevel = obj.taxonomy || 'object';
                if (!glossary[taxonomyLevel]) glossary[taxonomyLevel] = {};
                glossary[taxonomyLevel][obj.name] = obj;
                allObjects.push({ ...obj, taxonomyLevel });
            });
            window.TAO_GLOSSARY = glossary;
        }
    } catch (error) {
        console.error('[ManageObject] AWS Connection Error:', error);
        return;
    }

    // 3. UI Container Setup
    const appLayerId = window.TAO_ENGINE?.LAYERS?.APP || 'layer-3-application';
    const targetLayer = document.getElementById(appLayerId) || document.body;
    
    const existingPanel = document.getElementById('tao-manageobject-panel');
    if (existingPanel) existingPanel.remove();

    const panel = document.createElement('div');
    panel.id = 'tao-manageobject-panel';
    Object.assign(panel.style, {
        position: 'absolute', top: '2%', left: '2%', width: '96%', 
        height: '96%', minHeight: '300px',
        display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', 
        border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', 
        fontFamily: 'monospace', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', 
        zIndex: 9999, pointerEvents: 'auto', boxSizing: 'border-box', overflow: 'hidden'
    });

    if (window.TAO_ENGINE && window.TAO_ENGINE.createWindowBar) {
        const titleText = actualTargetType ? `OBJECT MANAGER: [${actualTargetType.toUpperCase()}]` : 'SYSTEM OBJECT MANAGER';
        const winBar = window.TAO_ENGINE.createWindowBar({ titleText: titleText, windowElement: panel });
        panel.appendChild(winBar);
    }

    const panelContent = document.createElement('div');
    Object.assign(panelContent.style, { display: 'flex', flexDirection: 'column', padding: '16px', flex: 1, overflowY: 'auto', boxSizing: 'border-box' });

    const controlsDiv = document.createElement('div');
    Object.assign(controlsDiv.style, { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '12px', flexShrink: 0 });

    const searchInput = document.createElement('input');
    searchInput.type = 'text'; searchInput.placeholder = 'Search entities...';
    Object.assign(searchInput.style, { padding: '8px', background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', borderRadius: '4px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', width: '100%' });
    controlsDiv.appendChild(searchInput);

    const toggleDiv = document.createElement('div');
    Object.assign(toggleDiv.style, { display: 'flex', gap: '6px' });
    
    const btnType = document.createElement('button'); btnType.innerText = 'By Type';
    const btnAlpha = document.createElement('button'); btnAlpha.innerText = 'A-Z';
    const btnTrash = document.createElement('button'); btnTrash.innerText = '🗑️ Trash';

    const buttons = [btnType, btnAlpha, btnTrash];
    buttons.forEach(btn => { Object.assign(btn.style, { flex: 1, padding: '8px 4px', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }); });
    
    btnType.style.background = '#38bdf8'; btnType.style.color = '#0f172a';
    buttons.forEach(b => toggleDiv.appendChild(b)); controlsDiv.appendChild(toggleDiv); 
    
    panelContent.appendChild(controlsDiv);

    const contentDiv = document.createElement('div');
    Object.assign(contentDiv.style, { overflowY: 'auto', flex: 1, paddingRight: '4px' });
    panelContent.appendChild(contentDiv); 
    
    panel.appendChild(panelContent);
    targetLayer.appendChild(panel);

    let currentView = 'type';
    let searchTerm = '';

    searchInput.addEventListener('input', (e) => { searchTerm = e.target.value.toLowerCase(); renderContent(); });

    btnType.onclick = () => { currentView = 'type'; resetButtons(btnType); renderContent(); };
    btnAlpha.onclick = () => { currentView = 'alpha'; resetButtons(btnAlpha); renderContent(); };
    btnTrash.onclick = () => { currentView = 'trash'; resetButtons(btnTrash, '#ef4444'); renderContent(); };

    function resetButtons(activeBtn, color = '#38bdf8') {
        buttons.forEach(btn => { btn.style.background = '#334155'; btn.style.color = '#94a3b8'; });
        activeBtn.style.background = color; activeBtn.style.color = '#0f172a';
    }

    // 4. List Rendering & Context Menus
    function renderContent() {
        contentDiv.innerHTML = '';
        
        let filteredObjects = allObjects.filter(o => {
            const isTrash = o.ui_state && o.ui_state.is_deleted === true;
            return currentView === 'trash' ? isTrash : !isTrash;
        });

        if (searchTerm) filteredObjects = filteredObjects.filter(o => o.name.toLowerCase().includes(searchTerm));

        if (filteredObjects.length === 0) {
            contentDiv.innerHTML = `<div style="color:#64748b; font-style:italic; margin-top: 10px; text-align:center;">Empty.</div>`;
            return;
        }

        if (currentView === 'type') {
            const activeTaxonomies = [...new Set(filteredObjects.map(o => o.taxonomyLevel))].sort();
            activeTaxonomies.forEach(tax => {
                const items = filteredObjects.filter(o => o.taxonomyLevel === tax);
                if (items.length > 0) {
                    const taxHeader = document.createElement('div');
                    taxHeader.innerText = `> ${tax.toUpperCase()}`;
                    Object.assign(taxHeader.style, { color: '#94a3b8', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px', borderBottom: '1px solid #1e293b' });
                    contentDiv.appendChild(taxHeader);
                    items.sort((a, b) => a.name.localeCompare(b.name)).forEach(obj => contentDiv.appendChild(createItemRow(obj)));
                }
            });
        } else {
            filteredObjects.sort((a, b) => a.name.localeCompare(b.name)).forEach(obj => contentDiv.appendChild(createItemRow(obj)));
        }
    }

    function createItemRow(obj) {
        const rowContainer = document.createElement('div');
        Object.assign(rowContainer.style, { display: 'flex', flexDirection: 'column', paddingLeft: currentView === 'type' ? '16px' : '0', paddingTop: '8px', paddingBottom: '8px', borderBottom: '1px dashed #1e293b', position: 'relative' });

        const topRow = document.createElement('div');
        Object.assign(topRow.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' });

        const nameEl = document.createElement('span');
        nameEl.innerHTML = `- <strong style="color: #10b981;">${obj.name}</strong> <span style="color:#64748b; font-size: 0.8em;">(${obj.taxonomyLevel})</span>`;
        
        const actionBtn = document.createElement('button');
        actionBtn.innerText = '⚙️ Manage';
        Object.assign(actionBtn.style, { background: '#1e293b', color: '#e2e8f0', border: '1px solid #38bdf8', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' });
        
        actionBtn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            
            const existingMenu = document.getElementById('manageobject-context-menu');
            if (existingMenu) existingMenu.remove();

            const menu = document.createElement('div');
            menu.id = 'manageobject-context-menu';
            Object.assign(menu.style, { position: 'absolute', top: '35px', right: '0', backgroundColor: '#1e293b', border: '1px solid #38bdf8', borderRadius: '6px', padding: '4px', zIndex: 100000, boxShadow: '0 10px 25px rgba(0,0,0,0.8)', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', minWidth: '180px', pointerEvents: 'auto', boxSizing: 'border-box' });

            const createOption = (text, color, onClick) => {
                const btn = document.createElement('div'); btn.innerText = text;
                Object.assign(btn.style, { padding: '10px 12px', cursor: 'pointer', color: color, fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid #334155' });
                btn.onmouseover = () => btn.style.backgroundColor = '#0f172a';
                btn.onmouseout = () => btn.style.backgroundColor = 'transparent';
                btn.onclick = async (ev) => { ev.stopPropagation(); menu.remove(); await onClick(); };
                menu.appendChild(btn);
            };

            if (currentView === 'trash') {
                createOption('♻️ Restore Object', '#10b981', async () => {
                    obj.ui_state.is_deleted = false;
                    await fetch('/api/objects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
                    
                    // EDGE AI MUTATION: Re-add to dictionaries
                    const key = obj.name.toLowerCase();
                    HELP_DICTIONARY[key] = { title: obj.name, category: obj.taxonomyLevel, text: obj.description || 'Restored object.' };
                    TAO_DICTIONARY[key] = { type: obj.taxonomyLevel, handler: 'dynamic', description: obj.description };
                    
                    executeManageObjectCommand(creatorContext, actualTargetType);
                });
                createOption('⚠️ Delete Permanently', '#ef4444', async () => {
                    if (confirm(`CRITICAL WARNING:\nAre you sure you want to PERMANENTLY destroy '${obj.name}'?`)) {
                        await fetch(`/api/objects/${obj.id}`, { method: 'DELETE' });
                        executeManageObjectCommand(creatorContext, actualTargetType);
                    }
                });
            } else {
                createOption('🔍 Display Attributes', '#38bdf8', () => {
                    const schemaText = obj.ui_state?.raw_schema || "No schema defined.";
                    const content = `
                        <div style="margin-bottom: 16px; border-bottom: 1px solid #334155; padding-bottom: 16px;">
                            <div style="color:#38bdf8; font-weight:bold; margin-bottom:8px; font-family:monospace; font-size:1rem;">System Attributes</div>
                            <pre style="margin:0; color:#94a3b8; font-size: 0.85rem; overflow-x: auto; background: #020617; padding: 10px; border-radius: 4px;">${JSON.stringify(obj, null, 2)}</pre>
                        </div>
                        <div>
                            <div style="color:#f59e0b; font-weight:bold; margin-bottom:8px; font-family:monospace; font-size:1rem;">Document Schema</div>
                            <pre style="margin:0; color:#e2e8f0; font-size: 0.85rem; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; background: #020617; padding: 10px; border-radius: 4px;">${schemaText}</pre>
                        </div>
                    `;
                    launchFloatingWindow(`ATTRIBUTES: ${obj.name}`, content, targetLayer);
                });

                createOption('🎛️ Edit System Preferences', '#10b981', () => launchPreferencesWindow(obj, targetLayer, creatorContext, actualTargetType));
                createOption('✏️ Edit Object Schema', '#f59e0b', () => launchEditorWindow(obj, targetLayer, creatorContext, actualTargetType));
                
                createOption('📝 Rename', '#e2e8f0', async () => {
                    const newName = prompt(`Rename '${obj.name}' to:`);
                    if (newName && newName.trim() !== '') {
                        if (confirm(`Please confirm you want to rename this object to '${newName.trim()}'`)) {
                            const oldKey = obj.name.toLowerCase();
                            const newKey = newName.trim().toLowerCase();
                            
                            // EDGE AI MUTATION: Transfer dictionary data to the new key
                            if (HELP_DICTIONARY[oldKey]) {
                                HELP_DICTIONARY[newKey] = { ...HELP_DICTIONARY[oldKey], title: newName.trim() };
                                delete HELP_DICTIONARY[oldKey];
                            }
                            if (TAO_DICTIONARY[oldKey]) {
                                TAO_DICTIONARY[newKey] = { ...TAO_DICTIONARY[oldKey] };
                                delete TAO_DICTIONARY[oldKey];
                            }

                            obj.name = newName.trim();
                            await fetch('/api/objects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
                            executeManageObjectCommand(creatorContext, actualTargetType);
                        }
                    }
                });
                
                createOption('🗑️ Move to Trashcan', '#ef4444', async () => {
                    if (confirm(`Move '${obj.name}' to the Trashcan?`)) {
                        obj.ui_state = obj.ui_state || {};
                        obj.ui_state.is_deleted = true;
                        obj.ui_state.deleted_at = new Date().toISOString();
                        
                        // EDGE AI MUTATION: Remove from local routing so it cannot be launched
                        const delKey = obj.name.toLowerCase();
                        delete HELP_DICTIONARY[delKey];
                        delete TAO_DICTIONARY[delKey];

                        await fetch('/api/objects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
                        executeManageObjectCommand(creatorContext, actualTargetType);
                    }
                });
            }

            topRow.appendChild(menu);
            setTimeout(() => { document.addEventListener('click', function closeMenu() { if(menu) menu.remove(); document.removeEventListener('click', closeMenu); }); }, 10);
        };

        topRow.appendChild(nameEl);
        topRow.appendChild(actionBtn);
        rowContainer.appendChild(topRow);
        
        return rowContainer;
    }

    renderContent();
}

// ==========================================
// >>> UNIVERSAL FLOATING WINDOW SYSTEM
// ==========================================
async function launchFloatingWindow(titleText, htmlContent, targetLayer) {
    const winId = `float-win-${Date.now()}`;
    
    const win = document.createElement('div');
    win.id = winId;
    Object.assign(win.style, {
        position: 'absolute', top: '5%', left: '5%', width: '90%', 
        height: '90%', minHeight: '200px', minWidth: '280px',
        backgroundColor: '#0f172a', border: '1px solid #38bdf8', borderRadius: '8px', 
        display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', 
        zIndex: 100005, overflow: 'hidden', resize: 'both', pointerEvents: 'auto', boxSizing: 'border-box' 
    });

    if (window.TAO_ENGINE && window.TAO_ENGINE.createWindowBar) {
        win.appendChild(window.TAO_ENGINE.createWindowBar({ titleText: titleText, windowElement: win }));
    }

    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, { padding: '16px', overflowY: 'auto', flex: 1, boxSizing: 'border-box' });
    contentArea.innerHTML = htmlContent;

    win.appendChild(contentArea);
    targetLayer.appendChild(win);
}

// ==========================================
// >>> HUMAN-READABLE PREFERENCES WINDOW
// ==========================================
async function launchPreferencesWindow(obj, targetLayer, context, targetType) {
    const winId = `pref-win-${obj.id}`;
    if (document.getElementById(winId)) return;

    const win = document.createElement('div');
    win.id = winId;
    Object.assign(win.style, {
        position: 'absolute', top: '2%', left: '2%', width: '96%', 
        height: '96%', minHeight: '300px', minWidth: '280px',
        backgroundColor: '#0f172a', border: '1px solid #38bdf8', borderRadius: '8px', 
        display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', 
        zIndex: 100010, overflow: 'hidden', resize: 'both', pointerEvents: 'auto', boxSizing: 'border-box' 
    });

    if (window.TAO_ENGINE && window.TAO_ENGINE.createWindowBar) {
        win.appendChild(window.TAO_ENGINE.createWindowBar({ titleText: `PREFERENCES: ${obj.name}`, windowElement: win }));
    }

    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, { padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '16px', boxSizing: 'border-box', overflowY: 'auto' });

    obj.ui_state = obj.ui_state || {};
    const currentClearance = obj.ui_state.creator_clearance || 'Explorer';
    const currentClass = obj.ui_state.classification || 'Private';
    const currentStatus = obj.ui_state.status || 'not done';

    contentArea.innerHTML = `
        <div style="color:#38bdf8; font-weight:bold; font-size:1.2rem; border-bottom:1px solid #334155; padding-bottom:10px;">Object Metadata & Security</div>
        
        <div style="display:flex; flex-direction:column; gap:6px;">
            <label style="color:#94a3b8; font-weight:bold; font-size:0.9rem;">Target Clearance Level</label>
            <select id="pref-clearance-${obj.id}" style="padding:12px; background:#1e293b; color:#10b981; border:1px solid #475569; border-radius:4px; outline:none; font-family:monospace; font-size:1rem;">
                <option value="Explorer" ${currentClearance === 'Explorer' ? 'selected' : ''}>Explorer (Standard User)</option>
                <option value="Admin" ${currentClearance === 'Admin' ? 'selected' : ''}>Admin</option>
                <option value="System" ${currentClearance === 'System' ? 'selected' : ''}>System (OS Core)</option>
                <option value="Godmode" ${currentClearance === 'Godmode' ? 'selected' : ''}>Godmode (Override)</option>
            </select>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
            <label style="color:#94a3b8; font-weight:bold; font-size:0.9rem;">Visibility / Classification</label>
            <select id="pref-class-${obj.id}" style="padding:12px; background:#1e293b; color:#10b981; border:1px solid #475569; border-radius:4px; outline:none; font-family:monospace; font-size:1rem;">
                <option value="Public" ${currentClass === 'Public' ? 'selected' : ''}>Public (Visible to All Users)</option>
                <option value="Private" ${currentClass === 'Private' ? 'selected' : ''}>Private (Creator / Admin Only)</option>
            </select>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
            <label style="color:#94a3b8; font-weight:bold; font-size:0.9rem;">Development Status</label>
            <select id="pref-status-${obj.id}" style="padding:12px; background:#1e293b; color:#10b981; border:1px solid #475569; border-radius:4px; outline:none; font-family:monospace; font-size:1rem;">
                <option value="not done" ${currentStatus === 'not done' ? 'selected' : ''}>Not Done (In Development)</option>
                <option value="active" ${currentStatus === 'active' ? 'selected' : ''}>Active (Production Ready)</option>
                <option value="deprecated" ${currentStatus === 'deprecated' ? 'selected' : ''}>Deprecated (Archived)</option>
            </select>
        </div>
    `;

    const footer = document.createElement('div');
    Object.assign(footer.style, { padding: '16px', borderTop: '1px solid #334155', backgroundColor: '#0f172a', display: 'flex', flexShrink: 0, boxSizing: 'border-box' });

    const saveBtn = document.createElement('button');
    saveBtn.innerText = '💾 Commit Preferences to AWS';
    Object.assign(saveBtn.style, { padding: '14px', background: '#10b981', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', width: '100%', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' });

    footer.appendChild(saveBtn); win.appendChild(contentArea); win.appendChild(footer); targetLayer.appendChild(win);

    saveBtn.onclick = async () => {
        saveBtn.innerText = 'Committing updates...'; saveBtn.disabled = true; saveBtn.style.background = '#64748b';
        obj.ui_state.creator_clearance = document.getElementById(`pref-clearance-${obj.id}`).value;
        obj.ui_state.classification = document.getElementById(`pref-class-${obj.id}`).value;
        obj.ui_state.status = document.getElementById(`pref-status-${obj.id}`).value;

        try {
            const res = await fetch('/api/objects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
            if (res.ok) { win.remove(); executeManageObjectCommand(context, targetType); }
        } catch (err) {
            console.error('Failed to commit preferences:', err);
            saveBtn.innerText = 'Error - Try Again'; saveBtn.disabled = false; saveBtn.style.background = '#ef4444';
        }
    };
}

// ==========================================
// >>> SCHEMA EDITOR
// ==========================================
async function launchEditorWindow(obj, targetLayer, context, targetType) {
    const winId = `editor-win-${obj.id}`;
    if (document.getElementById(winId)) return; 

    await loadCodeMirror();

    const win = document.createElement('div');
    win.id = winId;
    Object.assign(win.style, {
        position: 'absolute', top: '2%', left: '2%', width: '96%', height: '96%', minHeight: '300px', minWidth: '280px',
        backgroundColor: '#0f172a', border: '1px solid #f59e0b', borderRadius: '8px', 
        display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', 
        zIndex: 100010, overflow: 'hidden', resize: 'both', pointerEvents: 'auto', boxSizing: 'border-box'
    });

    if (window.TAO_ENGINE && window.TAO_ENGINE.createWindowBar) {
        win.appendChild(window.TAO_ENGINE.createWindowBar({ titleText: `EDIT: ${obj.name}`, windowElement: win }));
    }

    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, { padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '12px', boxSizing: 'border-box' });

    const typeWrapper = document.createElement('div');
    typeWrapper.innerHTML = `<div style="color:#94a3b8; font-weight:bold; margin-bottom:4px; font-family:monospace;">Object Type</div>`;
    
    const typeSelect = document.createElement('select');
    Object.assign(typeSelect.style, { background: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', padding: '10px', borderRadius: '4px', outline: 'none', fontFamily: 'monospace', width: '100%', fontSize: '1rem', boxSizing: 'border-box' });
    
    const allTypes = [...new Set(['System Program', 'User Application', 'Data', 'Index pointer', 'Me.draw', 'Me.universe', 'Me', ...(window.TAO_DYNAMIC_TYPES || [])])].sort();
    allTypes.forEach(t => {
        const opt = document.createElement('option'); opt.value = t; opt.innerText = t;
        if (t === obj.taxonomyLevel) opt.selected = true;
        typeSelect.appendChild(opt);
    });
    typeWrapper.appendChild(typeSelect);

    const editorLabel = document.createElement('div');
    editorLabel.innerHTML = `<div style="color:#94a3b8; font-weight:bold; margin-bottom:4px; font-family:monospace;">Object Document Schema</div>`;
    
    const editorContainer = document.createElement('div');
    Object.assign(editorContainer.style, { flex: 1, border: '1px solid #475569', borderRadius: '4px', textAlign: 'left', background: '#1e293b', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' });

    const saveBtn = document.createElement('button'); 
    saveBtn.innerText = '💾 Commit Updates to AWS';
    Object.assign(saveBtn.style, { background: '#10b981', color: '#0f172a', border: 'none', borderRadius: '4px', padding: '14px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '1.1rem', marginTop: 'auto', boxSizing: 'border-box' });

    contentArea.appendChild(typeWrapper); contentArea.appendChild(editorLabel); contentArea.appendChild(editorContainer); contentArea.appendChild(saveBtn);
    win.appendChild(contentArea); targetLayer.appendChild(win);

    let defaultSchema = obj.ui_state?.raw_schema || `<invisiblemarker>Section 1\nSection 1: Usage\n${obj.description || ''}\n\n<invisiblemarker>Section 2\nSection 2: Object logics\n\n<invisiblemarker>Section 3\nSection 3: Output result\n`;
    
    let cm = window.CodeMirror(editorContainer, { 
        value: defaultSchema, lineNumbers: true, theme: "tao", indentUnit: 3, 
        extraKeys: { "Tab": (cm) => cm.replaceSelection("   ") } 
    });
    cm.setSize("100%", "100%"); setTimeout(() => { cm.refresh(); }, 50);

    saveBtn.onclick = async (e) => {
        e.stopPropagation(); saveBtn.innerText = 'Committing...'; saveBtn.disabled = true; saveBtn.style.background = '#64748b';
        
        obj.taxonomyLevel = typeSelect.value;
        obj.ui_state = obj.ui_state || {};
        obj.ui_state.raw_schema = cm.getValue();

        // EDGE AI MUTATION: Update taxonomy category in local dictionaries
        const editKey = obj.name.toLowerCase();
        if (HELP_DICTIONARY[editKey]) HELP_DICTIONARY[editKey].category = obj.taxonomyLevel;
        if (TAO_DICTIONARY[editKey]) TAO_DICTIONARY[editKey].type = obj.taxonomyLevel;
        
        const payload = { name: obj.name, taxonomy: obj.taxonomyLevel, ...obj };

        try {
            const res = await fetch('/api/objects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) { win.remove(); executeManageObjectCommand(context, targetType); }
        } catch (err) { 
            console.error('Failed to commit edits:', err); saveBtn.innerText = 'Error - Try Again'; saveBtn.disabled = false; saveBtn.style.background = '#ef4444';
        }
    };
}

async function loadCodeMirror() {
    if (window.CodeMirror) return;
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/src/libs/codemirror.min.css'; document.head.appendChild(css);
    const taoTheme = document.createElement('style'); taoTheme.innerHTML = `.cm-s-tao.CodeMirror { background: #1e293b; color: #10b981; border-radius: 6px; padding: 8px; font-family: monospace; font-size: 14px; height: 100%; } .cm-s-tao .CodeMirror-gutters { background: #0f172a; border-right: 1px solid #334155; } .cm-s-tao .CodeMirror-linenumber { color: #64748b; padding-right: 12px; } .cm-s-tao .CodeMirror-cursor { border-left: 2px solid #38bdf8; } .cm-s-tao .CodeMirror-selected { background: #334155; }`; document.head.appendChild(taoTheme);
    return new Promise((resolve) => { const script = document.createElement('script'); script.src = '/src/libs/codemirror.min.js'; script.onload = resolve; document.head.appendChild(script); });
}