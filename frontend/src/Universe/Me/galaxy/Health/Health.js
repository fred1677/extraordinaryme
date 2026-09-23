/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/Health.js
 * 
 * DESCRIPTION:
 * The primary Health application module. 
 * Features a fixed-header flexbox architecture to guarantee sticky tabs.
 * Contains bespoke data entry blocks with EDITABLE clinical timestamps.
 * ============================================================================
 */

const state = {
    isProcessing: false,
    healthData: {
        meals: {} 
    }
};

export const localDictionary = {
    name: "health",
    commands: ["log vital", "120/80", "lb", "lbs", "sleep time", "wake up"]
};

// Updates the MASTER block-level save flag (System Time)
const markUpdated = (flagElement) => {
    if (!flagElement) return;
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' });
    flagElement.innerText = ` • System saved at ${timeString}`;
    flagElement.style.color = '#10b981';
};

// Helper for ultra-compact inputs
const createInputGroup = (labelText, inputType, selectOptions = [], flagElement = null) => {
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, { display: 'flex', flexDirection: 'column', gap: '4px' });

    const label = document.createElement('label');
    label.innerText = labelText;
    Object.assign(label.style, { fontSize: '12px', fontWeight: 'bold', color: '#475569' });

    const inputRow = document.createElement('div');
    Object.assign(inputRow.style, { display: 'flex', gap: '4px' });

    const input = document.createElement('input');
    input.type = inputType;
    Object.assign(input.style, {
        flex: '1', width: '100%', minWidth: '50px', padding: '6px', fontSize: '13px',
        backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px',
        color: '#0f172a', outline: 'none'
    });
    
    input.onfocus = () => input.style.borderColor = '#38bdf8';
    input.onblur = () => input.style.borderColor = '#cbd5e1';
    input.oninput = () => { if (flagElement) markUpdated(flagElement); };

    inputRow.appendChild(input);

    if (selectOptions.length > 0) {
        const select = document.createElement('select');
        Object.assign(select.style, {
            padding: '6px', fontSize: '12px', backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1', borderRadius: '4px', color: '#0f172a', outline: 'none',
            cursor: 'pointer'
        });
        selectOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt; option.innerText = opt;
            select.appendChild(option);
        });
        select.onchange = () => { if (flagElement) markUpdated(flagElement); };
        inputRow.appendChild(select);
    }

    wrapper.appendChild(label);
    wrapper.appendChild(inputRow);
    return wrapper;
};

export function initHealth(container) {
    const moduleName = "Health"; 
    const safeId = "health";
    
    if (!container && document.getElementById(`tao-${safeId}-window`)) {
        const existingWin = document.getElementById(`tao-${safeId}-window`);
        if (window.TAO_ENGINE?.bringToFront) window.TAO_ENGINE.bringToFront(existingWin);
        return;
    }

    // ========================================================================
    // 1. OS WINDOW INITIALIZATION
    // ========================================================================
    let targetArea = container;
    let appWindow = null;

    if (!targetArea) {
        appWindow = document.createElement('div');
        appWindow.id = `tao-${safeId}-window`;
        appWindow.classList.add('tao-workspace-window', 'is-floating');
        
        Object.assign(appWindow.style, {
            position: 'fixed', top: '15%', left: '20%', width: '65vw', height: '70vh',
            minWidth: '360px', minHeight: '400px', backgroundColor: '#ffffff', 
            borderRadius: '12px', boxShadow: '0 15px 50px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', 
            pointerEvents: 'auto', zIndex: '21000'
        });

        if (window.TAO_ENGINE && window.TAO_ENGINE.decorateAppWindow) {
            window.TAO_ENGINE.decorateAppWindow(appWindow, moduleName);
        }
        targetArea = appWindow;
    }

    // ========================================================================
    // 2. CANVAS & STICKY HEADER 
    // ========================================================================
    const appCanvas = document.createElement('div');
    Object.assign(appCanvas.style, {
        flex: '1', width: '100%', height: '100%', backgroundColor: '#ffffff',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '0' 
    });

    const headerArea = document.createElement('div');
    Object.assign(headerArea.style, { padding: '24px 32px 16px 32px', flexShrink: '0', backgroundColor: '#ffffff' });

    const titleRow = document.createElement('div');
    Object.assign(titleRow.style, { display: 'flex', alignItems: 'baseline', gap: '16px' });

    const appTitle = document.createElement('h1');
    appTitle.innerText = `${moduleName} Module`;
    Object.assign(appTitle.style, { color: '#38bdf8', fontSize: '24px', fontWeight: 'bold', fontFamily: 'sans-serif', margin: '0' });
    
    const dateDisplay = document.createElement('span');
    const today = new Date();
    dateDisplay.innerText = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    Object.assign(dateDisplay.style, { color: '#64748b', fontSize: '15px', fontFamily: 'sans-serif', fontWeight: '500' });

    titleRow.appendChild(appTitle);
    titleRow.appendChild(dateDisplay);
    headerArea.appendChild(titleRow);

    const tabBar = document.createElement('div');
    Object.assign(tabBar.style, {
        display: 'flex', gap: '24px', padding: '0 32px', borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff', flexShrink: '0', overflowX: 'auto', scrollbarWidth: 'none'
    });
    tabBar.innerHTML = `<style>#${safeId}-tabs::-webkit-scrollbar { display: none; }</style>`;
    tabBar.id = `${safeId}-tabs`;

    // ========================================================================
    // 3. SCROLLABLE CONTENT AREA
    // ========================================================================
    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, {
        flex: '1', padding: '24px 32px 48px 32px', overflowY: 'auto', minHeight: '0', height: '100%',
        scrollBehavior: 'smooth', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative'
    });

    const blocks = [];
    const tabs = [];
    const tabNames = ['Wake/Sleep/Weight', 'Vitals', 'Meal Block', 'Journaling', 'Exercise'];

    const createBlockContainer = (titleText) => {
        const block = document.createElement('div');
        Object.assign(block.style, {
            backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
            padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column'
        });
        
        const headerRow = document.createElement('div');
        Object.assign(headerRow.style, { display: 'flex', alignItems: 'baseline', marginBottom: '16px' });
        
        const header = document.createElement('h2');
        header.innerText = titleText;
        Object.assign(header.style, { color: '#0f172a', fontSize: '18px', fontWeight: 'bold', margin: '0', fontFamily: 'sans-serif' });
        
        const autosaveFlag = document.createElement('span');
        autosaveFlag.innerText = " • Auto-saving";
        Object.assign(autosaveFlag.style, { color: '#10b981', fontSize: '11px', fontWeight: 'normal', fontStyle: 'italic', marginLeft: '8px' });
        
        headerRow.appendChild(header);
        headerRow.appendChild(autosaveFlag);
        block.appendChild(headerRow);
        
        return { block, autosaveFlag };
    };

    // --- BLOCK 1: Wake/Sleep/Weight ---
    const b1 = createBlockContainer('Wake/Sleep/Weight');
    const block1 = b1.block; const flag1 = b1.autosaveFlag;
    const b1Grid = document.createElement('div');
    Object.assign(b1Grid.style, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' });
    
    b1Grid.appendChild(createInputGroup('Wake up', 'time', ['AM', 'PM', 'Mil'], flag1));
    b1Grid.appendChild(createInputGroup('Sleep Time', 'time', ['AM', 'PM', 'Mil'], flag1));
    b1Grid.appendChild(createInputGroup('Morning Weight', 'number', ['Lb', 'Kg'], flag1));
    b1Grid.appendChild(createInputGroup('Evening Weight', 'number', ['Lb', 'Kg'], flag1));
    
    block1.appendChild(b1Grid);
    blocks.push(block1);

    // --- BLOCK 2: Vitals ---
    const b2 = createBlockContainer('Vitals');
    const block2 = b2.block; const flag2 = b2.autosaveFlag;

    // 🚀 EDITABLE CLINICAL TIMESTAMP GENERATOR
    const createRowTimestamp = () => {
        const tsWrap = document.createElement('div');
        Object.assign(tsWrap.style, { display: 'flex', alignItems: 'center', marginLeft: 'auto', marginRight: '12px' });
        
        const prefix = document.createElement('span');
        prefix.innerText = "Taken: ";
        Object.assign(prefix.style, { color: '#94a3b8', fontSize: '11px', fontStyle: 'italic', marginRight: '4px' });
        
        const tsInput = document.createElement('input');
        tsInput.type = 'text';
        Object.assign(tsInput.style, {
            color: '#10b981', fontSize: '11px', fontStyle: 'italic', fontWeight: 'bold', border: 'none',
            background: 'transparent', width: '60px', padding: '0 2px', outline: 'none',
            borderBottom: '1px dashed transparent', cursor: 'text', textAlign: 'center'
        });
        
        tsInput.onfocus = () => { tsInput.style.borderBottomColor = '#10b981'; };
        tsInput.onblur = () => { tsInput.style.borderBottomColor = 'transparent'; };
        
        let manuallyEdited = false;
        
        // If the user manually edits the time, lock it so auto-updates don't overwrite it
        tsInput.oninput = () => {
            manuallyEdited = true;
            markUpdated(flag2); // Still trigger the master block save
        };

        const updateTs = () => {
            if (manuallyEdited) return; // The lock
            tsInput.value = new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
            markUpdated(flag2);
        };
        
        updateTs(); 
        tsWrap.appendChild(prefix);
        tsWrap.appendChild(tsInput);
        
        return { element: tsWrap, update: updateTs };
    };
    
    // Fixed Blood Pressure Box
    const bpBox = document.createElement('div');
    Object.assign(bpBox.style, {
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start', 
        gap: '12px', padding: '8px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: '4px', fontSize: '13px', color: '#0f172a', marginBottom: '8px'
    });

    const bpLabel = document.createElement('span');
    bpLabel.innerHTML = '<strong>Blood Pressure:</strong>';

    const bpInputArea = document.createElement('div');
    Object.assign(bpInputArea.style, { display: 'flex', alignItems: 'center', gap: '6px' });

    const fixedBpTs = createRowTimestamp();

    const createSmallInput = (ph, updateFn, initialVal = '') => {
        const inp = document.createElement('input');
        inp.type = 'text'; inp.placeholder = ph; inp.value = initialVal;
        Object.assign(inp.style, {
            width: '40px', padding: '4px', fontSize: '13px', backgroundColor: '#ffffff', 
            border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center', outline: 'none'
        });
        inp.oninput = updateFn;
        inp.onfocus = () => inp.style.borderColor = '#38bdf8';
        inp.onblur = () => inp.style.borderColor = '#cbd5e1';
        return inp;
    };

    const sysInput = createSmallInput('Sys', fixedBpTs.update);
    const slash = document.createElement('span');
    slash.innerText = '/';
    Object.assign(slash.style, { color: '#64748b', fontWeight: 'bold' });
    const diaInput = createSmallInput('Dia', fixedBpTs.update);

    bpInputArea.appendChild(sysInput);
    bpInputArea.appendChild(slash);
    bpInputArea.appendChild(diaInput);

    bpBox.appendChild(bpLabel);
    bpBox.appendChild(bpInputArea);
    bpBox.appendChild(fixedBpTs.element); 
    block2.appendChild(bpBox);

    // Dynamic Vitals Container
    const dynamicVitals = document.createElement('div');
    Object.assign(dynamicVitals.style, { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' });
    block2.appendChild(dynamicVitals);

    // Add Custom Vital Controls
    const extraVitalRow = document.createElement('div');
    Object.assign(extraVitalRow.style, { display: 'flex', gap: '8px', alignItems: 'flex-end' });
    
    const vitalValueWrap = createInputGroup('Add Vital', 'text');
    const vitalValueInput = vitalValueWrap.querySelector('input');
    
    const vitalTypeSelect = document.createElement('select');
    Object.assign(vitalTypeSelect.style, {
        padding: '6px', fontSize: '13px', backgroundColor: '#f1f5f9', height: '31px',
        border: '1px solid #cbd5e1', borderRadius: '4px', color: '#0f172a', outline: 'none', cursor: 'pointer'
    });
    
    ['Blood Pressure', 'Blood Sugar', 'Heart Rate', 'Body Temp', 'Custom'].forEach(opt => {
        const option = document.createElement('option');
        option.value = opt; option.innerText = opt;
        vitalTypeSelect.appendChild(option);
    });
    
    const addVitalBtn = document.createElement('button');
    addVitalBtn.innerText = "+";
    Object.assign(addVitalBtn.style, {
        backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '4px',
        width: '32px', height: '31px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    });
    addVitalBtn.onmouseover = () => addVitalBtn.style.backgroundColor = '#0284c7';
    addVitalBtn.onmouseout = () => addVitalBtn.style.backgroundColor = '#0ea5e9';
    
    // 🚀 DYNAMIC ROW GENERATOR 
    addVitalBtn.onclick = () => {
        const val = vitalValueInput.value.trim();
        const type = vitalTypeSelect.value;
        if (!val) return; 

        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex', alignItems: type === 'Custom' ? 'flex-start' : 'center', justifyContent: 'flex-start', 
            padding: '8px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '4px', fontSize: '13px', color: '#0f172a'
        });
        
        const leftSide = document.createElement('div');
        Object.assign(leftSide.style, { 
            display: 'flex', alignItems: type === 'Custom' ? 'flex-start' : 'center', 
            gap: '12px', flex: '1' 
        });
        
        const labelWrap = document.createElement('div');
        Object.assign(labelWrap.style, { display: 'flex', alignItems: 'center', marginTop: type === 'Custom' ? '5px' : '0' });
        
        const rowTs = createRowTimestamp(); // Generates individual editable timestamp

        if (type === 'Custom') {
            const customName = document.createElement('input');
            customName.type = 'text'; customName.value = 'Custom';
            Object.assign(customName.style, {
                fontWeight: 'bold', fontSize: '13px', color: '#0f172a', width: '85px',
                border: 'none', borderBottom: '1px dashed #cbd5e1', outline: 'none', backgroundColor: 'transparent'
            });
            customName.oninput = rowTs.update;
            customName.onfocus = () => customName.style.borderBottomColor = '#38bdf8';
            customName.onblur = () => customName.style.borderBottomColor = '#cbd5e1';
            
            const colon = document.createElement('strong');
            colon.innerText = ':';
            labelWrap.appendChild(customName);
            labelWrap.appendChild(colon);
        } else {
            labelWrap.innerHTML = `<strong>${type}:</strong>`;
        }
        
        leftSide.appendChild(labelWrap);

        if (type === 'Blood Pressure') {
            const parts = val.split(/[\/\\]/); 
            const sVal = parts[0] ? parts[0].trim() : '';
            const dVal = parts[1] ? parts[1].trim() : '';
            
            const dynSys = createSmallInput('Sys', rowTs.update, sVal);
            const dynSlash = document.createElement('span');
            dynSlash.innerText = '/';
            Object.assign(dynSlash.style, { color: '#64748b', fontWeight: 'bold' });
            const dynDia = createSmallInput('Dia', rowTs.update, dVal);

            const dynInputArea = document.createElement('div');
            Object.assign(dynInputArea.style, { display: 'flex', alignItems: 'center', gap: '6px' });
            dynInputArea.appendChild(dynSys);
            dynInputArea.appendChild(dynSlash);
            dynInputArea.appendChild(dynDia);
            
            leftSide.appendChild(dynInputArea);
        } else {
            const dynamicInput = document.createElement(type === 'Custom' ? 'textarea' : 'input');
            if (type !== 'Custom') dynamicInput.type = 'text';
            dynamicInput.value = val;
            
            Object.assign(dynamicInput.style, {
                width: type === 'Custom' ? '100%' : '40px',
                flex: type === 'Custom' ? '1' : 'none',
                padding: '4px', fontSize: '13px', backgroundColor: '#ffffff', 
                border: '1px solid #cbd5e1', borderRadius: '4px', 
                textAlign: type === 'Custom' ? 'left' : 'center', outline: 'none',
                resize: type === 'Custom' ? 'vertical' : 'none',
                minHeight: type === 'Custom' ? '30px' : 'auto',
                fontFamily: 'inherit', boxSizing: 'border-box'
            });
            
            dynamicInput.onfocus = () => dynamicInput.style.borderColor = '#38bdf8';
            dynamicInput.onblur = () => dynamicInput.style.borderColor = '#cbd5e1';
            dynamicInput.oninput = rowTs.update;

            leftSide.appendChild(dynamicInput);
        }
        
        const removeBtn = document.createElement('button');
        removeBtn.innerText = "×";
        Object.assign(removeBtn.style, {
            background: 'none', border: 'none', color: '#ef4444', fontSize: '16px',
            fontWeight: 'bold', cursor: 'pointer', padding: '0 4px',
            marginTop: type === 'Custom' ? '4px' : '0'
        });
        removeBtn.onclick = () => { row.remove(); markUpdated(flag2); };
        
        row.appendChild(leftSide);
        row.appendChild(rowTs.element); 
        row.appendChild(removeBtn);
        dynamicVitals.appendChild(row);
        
        vitalValueInput.value = ''; 
    };

    extraVitalRow.appendChild(vitalValueWrap);
    extraVitalRow.appendChild(vitalTypeSelect);
    extraVitalRow.appendChild(addVitalBtn);
    block2.appendChild(extraVitalRow);
    blocks.push(block2);

    // --- BLOCK 3: Meal Block ---
    const b3 = createBlockContainer('Meal Block');
    const block3 = b3.block; const flag3 = b3.autosaveFlag;
    
    const mealPills = document.createElement('div');
    Object.assign(mealPills.style, { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' });
    
    const mealCategories = ['Morning Routine', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Other'];
    let activeMeal = 'Breakfast'; 
    
    const mealText = document.createElement('textarea');
    Object.assign(mealText.style, {
        width: '100%', height: '100px', padding: '12px', fontSize: '13px', backgroundColor: '#f8fafc', fontFamily: 'sans-serif',
        border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical', outline: 'none', boxSizing: 'border-box'
    });
    mealText.placeholder = `Enter details for ${activeMeal}...`;
    mealText.oninput = (e) => {
        state.healthData.meals[activeMeal] = e.target.value;
        markUpdated(flag3);
    };

    mealCategories.forEach((meal) => {
        state.healthData.meals[meal] = ''; 

        const pill = document.createElement('div');
        pill.innerText = meal;
        Object.assign(pill.style, {
            padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s',
            backgroundColor: meal === activeMeal ? '#0ea5e9' : '#f1f5f9', 
            color: meal === activeMeal ? '#ffffff' : '#64748b', 
            border: '1px solid #cbd5e1'
        });
        
        pill.onclick = () => {
            Array.from(mealPills.children).forEach(p => { p.style.backgroundColor = '#f1f5f9'; p.style.color = '#64748b'; });
            pill.style.backgroundColor = '#0ea5e9'; pill.style.color = '#ffffff';
            
            activeMeal = meal;
            mealText.value = state.healthData.meals[activeMeal];
            mealText.placeholder = `Enter details for ${activeMeal}...`;
            markUpdated(flag3);
        };
        mealPills.appendChild(pill);
    });
    
    block3.appendChild(mealPills);
    block3.appendChild(mealText);
    blocks.push(block3);

    // --- BLOCK 4: Journaling ---
    const b4 = createBlockContainer('Journaling');
    const block4 = b4.block; const flag4 = b4.autosaveFlag;
    
    const jGrid = document.createElement('div');
    Object.assign(jGrid.style, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' });
    
    const makeTextArea = (labelTxt, parentFlag) => {
        const wrap = document.createElement('div');
        const lbl = document.createElement('label');
        lbl.innerText = labelTxt;
        Object.assign(lbl.style, { fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' });
        const txt = document.createElement('textarea');
        Object.assign(txt.style, { width: '100%', height: '80px', padding: '8px', fontSize: '13px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical', boxSizing: 'border-box' });
        txt.oninput = () => markUpdated(parentFlag);
        wrap.appendChild(lbl); wrap.appendChild(txt);
        return wrap;
    };
    
    jGrid.appendChild(makeTextArea('Morning Journal', flag4));
    jGrid.appendChild(makeTextArea('Evening Journal', flag4));
    block4.appendChild(jGrid);

    const genJournalWrap = document.createElement('div');
    genJournalWrap.appendChild(makeTextArea('General Journal', flag4));
    
    const addGenBtn = document.createElement('button');
    addGenBtn.innerText = "+ Add General Journal";
    Object.assign(addGenBtn.style, {
        backgroundColor: 'transparent', color: '#0ea5e9', border: 'none', fontSize: '12px',
        fontWeight: 'bold', cursor: 'pointer', padding: '8px 0', marginTop: '4px'
    });
    addGenBtn.onclick = () => {
        genJournalWrap.insertBefore(makeTextArea(`General Journal (${genJournalWrap.children.length})`, flag4), addGenBtn);
        markUpdated(flag4);
    };
    
    genJournalWrap.appendChild(addGenBtn);
    block4.appendChild(genJournalWrap);
    blocks.push(block4);

    // --- BLOCK 5: Exercise ---
    const b5 = createBlockContainer('Exercise');
    const block5 = b5.block; 
    const exText = document.createElement('p');
    exText.innerText = "Exercise tracking layout pending future expansion.";
    Object.assign(exText.style, { color: '#64748b', fontSize: '13px' });
    block5.appendChild(exText);
    blocks.push(block5);

    // ========================================================================
    // 4. ASSEMBLY & EVENT ROUTING
    // ========================================================================
    blocks.forEach((block, index) => {
        contentArea.appendChild(block);
        
        const tab = document.createElement('div');
        tab.innerText = tabNames[index];
        Object.assign(tab.style, {
            padding: '12px 0', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif',
            color: index === 0 ? '#0284c7' : '#64748b', borderBottom: index === 0 ? '3px solid #0284c7' : '3px solid transparent',
            whiteSpace: 'nowrap', transition: 'all 0.2s ease'
        });

        tab.onclick = () => {
            contentArea.scrollTo({
                top: block.offsetTop - 24, 
                behavior: 'smooth'
            });
            tabs.forEach(t => { t.style.color = '#64748b'; t.style.borderBottomColor = 'transparent'; });
            tab.style.color = '#0284c7'; tab.style.borderBottomColor = '#0284c7';
        };
        tabs.push(tab);
        tabBar.appendChild(tab);
    });

    contentArea.addEventListener('scroll', () => {
        let currentBlock = 0;
        const scrollPos = contentArea.scrollTop;
        blocks.forEach((block, index) => {
            if (block.offsetTop - 100 <= scrollPos) {
                currentBlock = index;
            }
        });
        tabs.forEach((tab, index) => {
            if (index === currentBlock) {
                tab.style.color = '#0284c7'; tab.style.borderBottomColor = '#0284c7';
            } else {
                tab.style.color = '#64748b'; tab.style.borderBottomColor = 'transparent';
            }
        });
    });

    appCanvas.appendChild(headerArea);
    appCanvas.appendChild(tabBar);
    appCanvas.appendChild(contentArea);
    targetArea.appendChild(appCanvas);

    if (appWindow) {
        appWindow.addEventListener('tao-help-clicked', async () => {
            try {
                const helpMod = await import('./health-help.js');
                if (helpMod.executeHelp) helpMod.executeHelp(appWindow);
            } catch (e) { console.error("Help missing", e); }
        });
        appWindow.addEventListener('tao-snapshot-clicked', async () => {
            try {
                const snapMod = await import('./health-snapshot.js');
                if (snapMod.executeSnapshot) snapMod.executeSnapshot(appWindow);
            } catch (e) { console.error("Snapshot missing", e); }
        });
    }
}