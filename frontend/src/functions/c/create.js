// File: /frontend/src/functions/c/create.js

/**
 * ============================================================================
 * MODULE: /frontend/src/functions/c/create.js
 * 
 * FUNCTION: 
 * The TAO Forge. A standardized, windowed assembly line for creating 
 * dynamically defined objects. Enforces name collision prevention, 
 * user visibility / access rules, and constructs a detailed JSONB blueprint.
 * 
 * ============================================================================
 * ARCHITECTURE UPDATE: STRICT APP BINDING
 * If the user selects 'application-program' or 'system-program', the Forge 
 * dynamically reveals a Directory Search module. It queries the backend file 
 * system (/api/system/scan-files) for matches and allows the user to select 
 * the exact absolute path from a dropdown, automatically embedding it into 
 * the object's ui_state memory. No fallbacks.
 * ============================================================================
 */

import { writeSystemLog } from '/master-imports.js';
import { getHighestUserLayer, bringModuleToFront } from '/src/functions/system/get-highest-user-layer.js';

import { HELP_DICTIONARY } from '/config/help-dictionary.js';
import { TAO_DICTIONARY } from '/config/tao-dictionary.js';

window.TAO_GLOSSARY = window.TAO_GLOSSARY || {
    'universe': {}, 'galaxy': {}, 'solar': {}, 'planet': {}, 'moon': {}, 
    'star': {}, 'comet': {}, 'asteroid': {}, 'dark-matter': {}, 'strange-matter': {}
};

export async function initiateCreationForge(creatorContext, objectName) {
    let targetName = objectName;
    const userId = creatorContext?.id || 'unknown';
    
    writeSystemLog(userId, 'create_forge', `Forge initiated.`, 'info');
    
    if (!targetName || targetName.trim() === '') {
        targetName = await launchNamePrompt(creatorContext);
        if (!targetName) return null;
    }

    let existingObjects = [];
    try {
        const res = await fetch('/api/objects');
        if (res.ok) existingObjects = await res.json();
    } catch (e) {
        console.warn('[Forge] Could not verify existing objects against AWS.');
    }

    let nameIsValid = false;
    while (!nameIsValid) {
        const exists = existingObjects.find(o => o.name.toLowerCase() === targetName.toLowerCase());
        
        if (exists) {
            let action = await launchDuplicatePrompt(targetName, creatorContext);
            if (action === 'CANCEL') return null;
            else if (action === 'UPDATE') return { redirect: `manageobject ${targetName}` };
            else if (action && action.trim() !== '') targetName = action.trim();
            else targetName = ''; 
        } else {
            nameIsValid = true;
        }
    }

    const forgeData = await launchForgeBlueprintForm(targetName, creatorContext);

    if (!forgeData) return null;

    let blueprint = {
        name: targetName,
        creatorId: userId,
        creatorClearance: creatorContext?.clearance || 'Explorer', 
        taxonomy: forgeData.type, 
        classification: forgeData.classification || 'Private',
        isRestricted: false,
        status: 'not done',
        description: forgeData.brief,
        ui_state: {
            detailed_logic: forgeData.detailed,
            expected_output: forgeData.output,
            tao_announcement: forgeData.announcement,
            help_text: forgeData.helpText,
            modulePath: forgeData.modulePath || null,
            initMethod: forgeData.initMethod || null,
            iconSvg: forgeData.iconSvg || `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`
        }
    };

    blueprint = await registerBlueprint(blueprint, creatorContext);

    HELP_DICTIONARY[blueprint.name.toLowerCase()] = { title: blueprint.name, category: blueprint.taxonomy, text: blueprint.ui_state.help_text || blueprint.description };
    TAO_DICTIONARY[blueprint.name.toLowerCase()] = { type: blueprint.taxonomy, handler: 'dynamic', description: blueprint.description };

    if (window.TAO_CORE && typeof window.TAO_CORE.createObject === 'function') {
        try {
            window.TAO_CORE.createObject(userId, { objName: blueprint.name.toLowerCase(), isFinished: true, description: blueprint.description });
        } catch (err) {}
    }

    return blueprint;
}

async function registerBlueprint(bp, creatorContext) {
    try {
        const response = await fetch('/api/objects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bp) });
        if (!response.ok) throw new Error(`AWS transmission failed`);
    } catch (error) { console.error(`[Forge System Error]`, error); }
    return bp;
}

function createStandardWindow(titleText, width, height, layerMath) {
    const appLayerId = window.TAO_ENGINE?.LAYERS?.USER || 'layer-2-user';
    const targetLayer = document.getElementById(appLayerId) || document.body;
    const win = document.createElement('div');
    win.classList.add('tao-workspace-window'); 
    Object.assign(win.style, {
        position: 'absolute', width: width, maxWidth: '96%', height: height, maxHeight: '96%', minHeight: '200px', 
        backgroundColor: '#0f172a', border: '1px solid #38bdf8', borderRadius: '8px', 
        display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', 
        zIndex: layerMath.zIndex, overflow: 'hidden', pointerEvents: 'auto', boxSizing: 'border-box'
    });
    if (window.TAO_ENGINE && window.TAO_ENGINE.createWindowBar) win.appendChild(window.TAO_ENGINE.createWindowBar({ titleText: titleText, windowElement: win }));
    win.onmousedown = () => bringModuleToFront('create_forge');
    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', boxSizing: 'border-box', color: '#e2e8f0', fontFamily: 'monospace' });
    win.appendChild(contentArea);
    targetLayer.appendChild(win);
    return { win, contentArea, destroy: () => targetLayer.removeChild(win) };
}

async function launchNamePrompt(creatorContext) {
    return new Promise(resolve => {
        const layerMath = getHighestUserLayer('create_forge', false, creatorContext?.id);
        const { win, contentArea, destroy } = createStandardWindow('FORGE: INITIALIZE', '400px', '220px', layerMath);
        contentArea.innerHTML = `<div style="color:#38bdf8; font-weight:bold; font-size:1.1rem; text-align:center;">Enter the name of the new object to create:</div>`;
        const input = document.createElement('input');
        input.type = 'text'; input.placeholder = 'e.g., Health Module';
        Object.assign(input.style, { width: '100%', padding: '12px', background: '#1e293b', color: '#10b981', border: '1px solid #475569', borderRadius: '4px', outline: 'none', fontFamily: 'monospace', fontSize: '1rem', boxSizing: 'border-box' });
        contentArea.appendChild(input);

        const footer = document.createElement('div');
        Object.assign(footer.style, { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', backgroundColor: '#0f172a', borderTop: '1px solid #334155', flexShrink: 0 });
        const cancelBtn = document.createElement('button'); cancelBtn.innerText = 'CANCEL';
        Object.assign(cancelBtn.style, { padding: '10px 16px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' });
        const submitBtn = document.createElement('button'); submitBtn.innerText = 'CONTINUE';
        Object.assign(submitBtn.style, { padding: '10px 16px', backgroundColor: '#10b981', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' });
        footer.appendChild(cancelBtn); footer.appendChild(submitBtn); win.appendChild(footer);

        const submit = (val) => { destroy(); resolve(val); };
        cancelBtn.onclick = () => submit(null);
        submitBtn.onclick = () => submit(input.value.trim());
        input.onkeydown = (e) => { if (e.key === 'Enter') submit(input.value.trim()); };
        setTimeout(() => input.focus(), 50);
    });
}

async function launchDuplicatePrompt(existingName, creatorContext) {
    return new Promise(resolve => {
        const layerMath = getHighestUserLayer('create_forge', true, creatorContext?.id);
        const { win, contentArea, destroy } = createStandardWindow('WARNING: OBJECT COLLISION', '450px', '320px', layerMath);
        win.style.borderColor = '#ef4444';
        contentArea.innerHTML = `<div style="color:#ef4444; font-weight:bold; font-size:1.2rem; text-align:center;">THIS OBJECT EXISTS</div><div style="color:#94a3b8; font-size:0.95rem; text-align:center;">The name <span style="color:#e2e8f0; font-weight:bold;">'${existingName}'</span> is already registered.</div>`;
        const input = document.createElement('input'); input.placeholder = 'Enter NEW object name...';
        Object.assign(input.style, { width: '100%', padding: '12px', background: '#1e293b', color: '#10b981', border: '1px solid #475569', borderRadius: '4px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' });
        contentArea.appendChild(input); 

        const footer = document.createElement('div');
        Object.assign(footer.style, { display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '16px 20px', backgroundColor: '#0f172a', borderTop: '1px solid #334155', flexShrink: 0 });
        const cancelBtn = document.createElement('button'); cancelBtn.innerText = 'CANCEL'; Object.assign(cancelBtn.style, { padding: '10px 12px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #64748b', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' });
        const updateBtn = document.createElement('button'); updateBtn.innerText = 'UPDATE EXISTING'; Object.assign(updateBtn.style, { flex: 1, padding: '10px 12px', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' });
        const createBtn = document.createElement('button'); createBtn.innerText = 'CREATE NEW'; Object.assign(createBtn.style, { flex: 1, padding: '10px 12px', backgroundColor: '#10b981', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' });
        footer.appendChild(cancelBtn); footer.appendChild(updateBtn); footer.appendChild(createBtn); win.appendChild(footer);

        const submit = (val) => { destroy(); resolve(val); };
        cancelBtn.onclick = () => submit('CANCEL'); updateBtn.onclick = () => submit('UPDATE'); createBtn.onclick = () => { if (input.value.trim()) submit(input.value.trim()); };
    });
}

async function launchForgeBlueprintForm(targetName, creatorContext) {
    return new Promise(resolve => {
        const layerMath = getHighestUserLayer('create_forge', true, creatorContext?.id);
        const { win, contentArea, destroy } = createStandardWindow(`FORGE BLUEPRINT: ${targetName}`, '600px', '96%', layerMath);

        const createField = (labelText, isTextarea = false, placeholder = '') => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex'; wrapper.style.flexDirection = 'column'; wrapper.style.gap = '6px';
            const label = document.createElement('div'); label.innerText = labelText; Object.assign(label.style, { color: '#38bdf8', fontWeight: 'bold', fontSize: '0.9rem' });
            const input = document.createElement(isTextarea ? 'textarea' : 'input');
            if (isTextarea) input.style.resize = 'vertical';
            input.placeholder = placeholder;
            Object.assign(input.style, { width: '100%', padding: '10px', background: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '4px', outline: 'none', fontFamily: 'monospace', fontSize: '0.9rem', boxSizing: 'border-box' });
            wrapper.appendChild(label); wrapper.appendChild(input); contentArea.appendChild(wrapper);
            return input;
        };

        const typeWrapper = document.createElement('div');
        typeWrapper.style.display = 'flex'; typeWrapper.style.flexDirection = 'column'; typeWrapper.style.gap = '6px';
        typeWrapper.innerHTML = `<div style="color:#38bdf8; font-weight:bold; font-size:0.9rem;">Object Type</div>`;
        const typeSelect = document.createElement('select');
        Object.assign(typeSelect.style, { width: '100%', padding: '10px', background: '#1e293b', color: '#10b981', border: '1px solid #475569', borderRadius: '4px', outline: 'none', fontFamily: 'monospace', fontSize: '1rem', boxSizing: 'border-box' });
        
        ['application-program', 'system-program', 'image', 'video', 'pdf', 'doc', 'universe', 'galaxy', 'other'].forEach(t => {
            const opt = document.createElement('option'); opt.value = t; opt.innerText = `<${t}>`; typeSelect.appendChild(opt);
        });

        const customTypeInput = document.createElement('input'); customTypeInput.placeholder = "Define custom object type...";
        Object.assign(customTypeInput.style, { display: 'none', width: '100%', marginTop: '6px', padding: '10px', background: '#1e293b', color: '#10b981', border: '1px solid #475569', borderRadius: '4px', outline: 'none', boxSizing: 'border-box' });
        typeWrapper.appendChild(typeSelect); typeWrapper.appendChild(customTypeInput); contentArea.appendChild(typeWrapper);

        // ====================================================================
        // STRICT DIRECTORY SEARCH MODULE (No Fallbacks)
        // ====================================================================
        const appBindingWrapper = document.createElement('div');
        Object.assign(appBindingWrapper.style, { display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.05)', border: '1px solid #38bdf8', borderRadius: '6px', marginTop: '4px' });
        appBindingWrapper.innerHTML = `<div style="color:#38bdf8; font-weight:bold; font-size:0.9rem;">OS Directory Binding (Code Search)</div>`;
        
        const searchRow = document.createElement('div');
        searchRow.style.display = 'flex'; searchRow.style.gap = '8px';
        
        const fileSearchInput = document.createElement('input');
        fileSearchInput.placeholder = "File query (e.g., health)";
        Object.assign(fileSearchInput.style, { flex: '1', padding: '8px', background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '4px', outline: 'none' });
        
        const extSelect = document.createElement('select');
        Object.assign(extSelect.style, { padding: '8px', background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '4px', outline: 'none' });
        ['.js', '.html'].forEach(ext => { const opt = document.createElement('option'); opt.value = ext; opt.innerText = ext; extSelect.appendChild(opt); });
        
        const searchBtn = document.createElement('button');
        searchBtn.innerText = 'SEARCH SYSTEM';
        Object.assign(searchBtn.style, { padding: '8px 12px', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' });
        
        searchRow.appendChild(fileSearchInput); searchRow.appendChild(extSelect); searchRow.appendChild(searchBtn);
        appBindingWrapper.appendChild(searchRow);

        const resultsSelect = document.createElement('select');
        Object.assign(resultsSelect.style, { display: 'none', width: '100%', padding: '10px', background: '#0f172a', color: '#10b981', border: '1px solid #10b981', borderRadius: '4px', outline: 'none' });
        appBindingWrapper.appendChild(resultsSelect);

        const initMethodInput = document.createElement('input');
        initMethodInput.placeholder = "Init Function (e.g., initHealth)";
        Object.assign(initMethodInput.style, { display: 'none', width: '100%', padding: '10px', background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '4px', outline: 'none' });
        appBindingWrapper.appendChild(initMethodInput);

        searchBtn.onclick = async () => {
            const query = fileSearchInput.value.trim();
            if (!query) {
                alert("Please enter a file query.");
                return;
            }

            searchBtn.innerText = 'SCANNING...';
            try {
                // STRICT BACKEND FETCH (Fails hard if endpoint is missing)
                const response = await fetch(`/api/system/scan-files?q=${query}&ext=${extSelect.value}`);
                if (!response.ok) {
                    throw new Error(`Backend API Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json(); 

                resultsSelect.innerHTML = '';
                
                if (!data || data.length === 0) {
                    const opt = document.createElement('option');
                    opt.value = "";
                    opt.innerText = "NO MATCHES FOUND";
                    resultsSelect.appendChild(opt);
                } else {
                    data.forEach(p => {
                        const opt = document.createElement('option'); 
                        opt.value = p; 
                        opt.innerText = p; 
                        resultsSelect.appendChild(opt);
                    });
                }
                
                resultsSelect.style.display = 'block';
                initMethodInput.style.display = extSelect.value === '.js' ? 'block' : 'none';
                
                // Auto-fill logic for user convenience if paths were found
                const capitalized = query.charAt(0).toUpperCase() + query.slice(1);
                initMethodInput.value = `init${capitalized}`;
                
            } catch (e) {
                console.error('[Forge API Error]', e);
                alert(`Failed to scan system files:\n${e.message}\n\nEnsure your backend route /api/system/scan-files is built and running.`);
                resultsSelect.style.display = 'none';
                initMethodInput.style.display = 'none';
            }
            searchBtn.innerText = 'SEARCH SYSTEM';
        };

        contentArea.appendChild(appBindingWrapper);

        typeSelect.onchange = () => { 
            customTypeInput.style.display = typeSelect.value === 'other' ? 'block' : 'none'; 
            appBindingWrapper.style.display = (typeSelect.value === 'application-program' || typeSelect.value === 'system-program') ? 'flex' : 'none';
        };

        const visibilityWrapper = document.createElement('div');
        visibilityWrapper.style.display = 'flex'; visibilityWrapper.style.flexDirection = 'column'; visibilityWrapper.style.gap = '6px';
        visibilityWrapper.innerHTML = `<div style="color:#38bdf8; font-weight:bold; font-size:0.9rem;">Visibility</div>`;
        const visibilitySelect = document.createElement('select');
        Object.assign(visibilitySelect.style, { width: '100%', padding: '10px', background: '#1e293b', color: '#10b981', border: '1px solid #475569', borderRadius: '4px', outline: 'none', boxSizing: 'border-box' });
        [{ label: '<public>', value: 'Public' }, { label: '<private>', value: 'Private' }].forEach(item => { const opt = document.createElement('option'); opt.value = item.value; opt.innerText = item.label; visibilitySelect.appendChild(opt); });
        visibilityWrapper.appendChild(visibilitySelect); contentArea.appendChild(visibilityWrapper);

        const briefInput = createField('Brief Description:', false, 'Short summary of purpose...');
        const detailedInput = createField('Detailed Logic:', true, 'Extensive operational logic...'); detailedInput.style.minHeight = '80px';
        const outputInput = createField('Expected Output:', true, 'Data structure or visual result...'); outputInput.style.minHeight = '60px';
        const announceInput = createField('Voice Announcement:', false, 'e.g., "Initializing health module..."');
        const helpInput = createField('Help Documentation (Edge AI Search):', true, 'Instructions for the user.'); helpInput.style.minHeight = '60px';

        const footer = document.createElement('div');
        Object.assign(footer.style, { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', backgroundColor: '#0f172a', borderTop: '1px solid #334155', flexShrink: 0 });
        const cancelBtn = document.createElement('button'); cancelBtn.innerText = 'CANCEL'; Object.assign(cancelBtn.style, { padding: '12px 24px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' });
        const commitBtn = document.createElement('button'); commitBtn.innerText = 'COMMIT TO FORGE'; Object.assign(commitBtn.style, { padding: '12px 24px', backgroundColor: '#10b981', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' });
        footer.appendChild(cancelBtn); footer.appendChild(commitBtn); win.appendChild(footer);

        const submit = (data) => { destroy(); resolve(data); };
        cancelBtn.onclick = () => submit(null);
        
        commitBtn.onclick = () => {
            let finalType = typeSelect.value === 'other' ? customTypeInput.value.trim() : typeSelect.value;
            
            let modPath = (finalType === 'application-program' || finalType === 'system-program') ? resultsSelect.value : null;
            let modInit = (finalType === 'application-program' || finalType === 'system-program') ? initMethodInput.value : null;

            submit({
                type: finalType || 'object',
                classification: visibilitySelect.value,
                brief: briefInput.value.trim(),
                detailed: detailedInput.value.trim(),
                output: outputInput.value.trim(),
                announcement: announceInput.value.trim(),
                helpText: helpInput.value.trim(),
                modulePath: modPath,
                initMethod: modInit
            });
        };
    });
}