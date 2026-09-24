/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/Health-vitals.js
 * 
 * DESCRIPTION: 
 * A decoupled Vitals Tracker utilizing a Universal Date Ledger.
 * Aggressively pre-populates daily ledgers with a default template.
 * Features auto-timestamping, a Trashcan system, and Chatbox date-change loops.
 * ============================================================================
 */

var vitalsLedger = {}; 
// Structure: { "YYYY-MM-DD": { active: [vitalObjs], trash: [vitalObjs] } }

const getTodayStr = () => new Date().toISOString().split('T')[0];

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00'); 
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const generateId = () => 'vital_' + Math.random().toString(36).substr(2, 9);

const syncVitalsToAWS = async () => {
    const payload = { 
        userId: localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev', 
        appName: 'health_vitals', 
        stateData: vitalsLedger 
    };
    try {
        await fetch('/api/state/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('[Health-vitals] AWS Cloud Ledger sync successful.');
    } catch (err) { console.error('[Health-vitals] AWS Sync Error:', err); }
};

const speakAmbient = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
};

function askChatbox(message, options = {}) {
    return new Promise((resolve) => {
        const uniqueEventId = 'tao-prompt-reply-' + Date.now() + Math.random().toString(36).substring(7);
        const listener = (e) => {
            window.removeEventListener(uniqueEventId, listener);
            resolve(e.detail.text);
        };
        window.addEventListener(uniqueEventId, listener);
        window.dispatchEvent(new CustomEvent('tao-chatbox-prompt', {
            detail: {
                message: message,
                waitForInput: options.waitForInput || false,
                choices: options.choices || [],
                expand: options.expand || false,
                responseEvent: uniqueEventId
            }
        }));
    });
}

export const createVitalsBlock = () => {
    let currentViewDate = getTodayStr();
    let isTrashOpen = false;
    let saveTimeout = null;

    const saveIndicator = document.createElement('span');
    Object.assign(saveIndicator.style, { color: '#10b981', fontSize: '11px', fontWeight: 'normal', fontStyle: 'italic', marginLeft: 'auto' });

    const vBlock = document.createElement('div');
    Object.assign(vBlock.style, {
        backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
        padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px',
        fontFamily: 'sans-serif', fontSize: '13px', color: '#0f172a', marginBottom: '16px'
    });

    const headerRow = document.createElement('div');
    Object.assign(headerRow.style, { display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' });
    vBlock.appendChild(headerRow);

    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, {
        display: 'flex', flexDirection: 'column', gap: '12px',
        backgroundColor: '#ffffff', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px'
    });
    vBlock.appendChild(contentArea);

    const triggerSave = () => {
        const now = new Date();
        saveIndicator.innerText = ` • System saved at ${now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' })}`;
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(syncVitalsToAWS, 1500);
    };

    const renderVitals = (isEditMode) => {
        headerRow.innerHTML = '';
        contentArea.innerHTML = '';

        if (!vitalsLedger[currentViewDate]) vitalsLedger[currentViewDate] = { active: [], trash: [] };
        const dayData = vitalsLedger[currentViewDate];

        // Failsafe Initialization: Force seed defaults if active & trash are both empty
        if (dayData.active.length === 0 && dayData.trash.length === 0) {
            dayData.active.push({ id: generateId(), type: 'Blood Pressure', customName: '', value: { sys: '', dia: '' }, timestamp: '' });
            dayData.active.push({ id: generateId(), type: 'Blood Sugar', customName: '', value: '', timestamp: '' });
            dayData.active.push({ id: generateId(), type: 'Heart Rate', customName: '', value: '', timestamp: '' });
            dayData.active.push({ id: generateId(), type: 'Body Temp', customName: '', value: '', timestamp: '' });
            syncVitalsToAWS(); // Silently save the seeded template
        }

        // --- HEADER ---
        const prefix = document.createElement('strong');
        prefix.innerText = 'Daily Vitals Tracker: ';
        prefix.style.marginRight = '16px';
        headerRow.appendChild(prefix);

        const wrapContainer = (children) => {
            const wrap = document.createElement('div');
            Object.assign(wrap.style, { display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', marginRight: '16px' });
            children.forEach(c => wrap.appendChild(c));
            return wrap;
        };

        const makeLabel = (text) => {
            const lbl = document.createElement('span');
            lbl.innerText = text;
            Object.assign(lbl.style, { color: '#475569', fontWeight: '500', marginRight: '6px' });
            return lbl;
        };

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.value = currentViewDate;
        Object.assign(dateInput.style, { width: '115px', padding: '4px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' });
        headerRow.appendChild(wrapContainer([makeLabel('Date -'), dateInput]));

        dateInput.onchange = async (e) => {
            const newDate = e.target.value;
            if (!newDate || newDate === currentViewDate) return;
            
            const chatWin = document.getElementById('tao-chatbox-window');
            if (chatWin && chatWin.style.display === 'none') if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
            window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: true } }));

            const confirm = await askChatbox(`Do you want to manage vitals for ${formatDisplayDate(newDate)}?`, { choices: ['Yes', 'No'], expand: true });

            if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
            window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: false } }));

            if (confirm.toLowerCase() === 'yes') {
                currentViewDate = newDate;
                isTrashOpen = false;
                renderVitals(true);
            } else {
                dateInput.value = currentViewDate;
            }
        };

        if (currentViewDate !== getTodayStr()) {
            const returnBtn = document.createElement('button');
            returnBtn.innerText = '[Return to Today]';
            Object.assign(returnBtn.style, { background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: '8px' });
            returnBtn.onclick = () => {
                currentViewDate = getTodayStr();
                isTrashOpen = false;
                renderVitals();
            };
            headerRow.appendChild(returnBtn);
        }

        headerRow.appendChild(saveIndicator);

        const activeList = document.createElement('div');
        Object.assign(activeList.style, { display: 'flex', flexDirection: 'column', gap: '8px' });

        if (isEditMode) {
            // --- EDIT MODE ---
            const actionBtn = document.createElement('button');
            actionBtn.innerText = '[Update]';
            Object.assign(actionBtn.style, { background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: 'auto' });

            actionBtn.onclick = async () => {
                await syncVitalsToAWS();
                if (currentViewDate !== getTodayStr()) speakAmbient("Vitals updated. Returning to today's ledger.");
                currentViewDate = getTodayStr(); 
                renderVitals(false);
            };
            headerRow.appendChild(actionBtn);

            dayData.active.forEach(vital => {
                const row = document.createElement('div');
                Object.assign(row.style, { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' });

                const leftSide = document.createElement('div');
                Object.assign(leftSide.style, { display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' });

                if (vital.type === 'Custom') {
                    const customNameInp = document.createElement('input');
                    customNameInp.type = 'text'; customNameInp.value = vital.customName || 'Custom';
                    Object.assign(customNameInp.style, { fontWeight: '500', fontSize: '13px', color: '#475569', width: '85px', border: 'none', borderBottom: '1px dashed #cbd5e1', outline: 'none', backgroundColor: 'transparent' });
                    customNameInp.oninput = (e) => { vital.customName = e.target.value; triggerSave(); };
                    leftSide.appendChild(customNameInp); 
                    const dash = document.createElement('span'); dash.innerText = ' -'; Object.assign(dash.style, { color: '#475569', fontWeight: '500' });
                    leftSide.appendChild(dash);
                } else {
                    leftSide.appendChild(makeLabel(`${vital.type} -`));
                }

                const valArea = document.createElement('div');
                Object.assign(valArea.style, { display: 'flex', alignItems: 'center', gap: '6px' });

                const tsWrap = document.createElement('div');
                Object.assign(tsWrap.style, { display: 'flex', alignItems: 'center', marginLeft: '12px' });
                const tsPrefix = document.createElement('span'); tsPrefix.innerText = "Taken: ";
                Object.assign(tsPrefix.style, { color: '#94a3b8', fontSize: '11px', fontStyle: 'italic', marginRight: '4px' });
                
                const tsInput = document.createElement('input');
                tsInput.type = 'text'; tsInput.value = vital.timestamp;
                tsInput.placeholder = '--';
                Object.assign(tsInput.style, { color: '#10b981', fontSize: '11px', fontStyle: 'italic', fontWeight: 'bold', border: 'none', background: 'transparent', width: '60px', padding: '0 2px', outline: 'none', borderBottom: '1px dashed transparent', cursor: 'text', textAlign: 'center' });
                tsInput.oninput = (e) => { vital.timestamp = e.target.value; triggerSave(); };
                
                tsWrap.appendChild(tsPrefix); tsWrap.appendChild(tsInput);

                const handleDataUpdate = (val, bpField) => {
                    if (!vital.timestamp && val.trim() !== '') {
                        vital.timestamp = new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
                        tsInput.value = vital.timestamp;
                    }
                    if (bpField) {
                        if (!vital.value) vital.value = { sys: '', dia: '' };
                        vital.value[bpField] = val;
                    } else {
                        vital.value = val;
                    }
                    
                    if (bpField && !vital.value.sys && !vital.value.dia) { vital.timestamp = ''; tsInput.value = ''; }
                    else if (!bpField && !vital.value) { vital.timestamp = ''; tsInput.value = ''; }

                    triggerSave();
                };

                const createSmallInput = (val, fieldKey) => {
                    const inp = document.createElement('input');
                    inp.type = 'text'; inp.value = val;
                    Object.assign(inp.style, { width: '40px', padding: '4px', fontSize: '13px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center', outline: 'none' });
                    inp.oninput = (e) => handleDataUpdate(e.target.value, fieldKey);
                    return inp;
                };

                if (vital.type === 'Blood Pressure') {
                    const vSys = vital.value?.sys || '';
                    const vDia = vital.value?.dia || '';
                    valArea.appendChild(createSmallInput(vSys, 'sys'));
                    const slash = document.createElement('span'); slash.innerText = '/';
                    Object.assign(slash.style, { color: '#64748b', fontWeight: 'bold' });
                    valArea.appendChild(slash);
                    valArea.appendChild(createSmallInput(vDia, 'dia'));
                } else {
                    const inp = document.createElement('input');
                    inp.type = 'text'; inp.value = vital.value || '';
                    Object.assign(inp.style, { width: '80px', padding: '4px', fontSize: '13px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' });
                    inp.oninput = (e) => handleDataUpdate(e.target.value, null);
                    valArea.appendChild(inp);
                }

                const removeBtn = document.createElement('button');
                removeBtn.innerText = "×";
                Object.assign(removeBtn.style, { background: 'none', border: 'none', color: '#ef4444', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', padding: '0 4px', marginLeft: 'auto' });
                
                removeBtn.onclick = () => {
                    const idx = dayData.active.findIndex(v => v.id === vital.id);
                    if (idx > -1) {
                        const trashedItem = dayData.active.splice(idx, 1)[0];
                        dayData.trash.push(trashedItem);
                        triggerSave();
                        renderVitals(true);
                    }
                };

                row.appendChild(leftSide);
                row.appendChild(valArea);
                row.appendChild(tsWrap);
                row.appendChild(removeBtn);
                activeList.appendChild(row);
            });
            contentArea.appendChild(activeList);

            // --- ADD VITAL SECTION (Only in Edit Mode) ---
            const addWrapper = document.createElement('div');
            Object.assign(addWrapper.style, { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' });

            const valLbl = document.createElement('span');
            valLbl.innerText = 'Add Vital:';
            Object.assign(valLbl.style, { fontSize: '12px', fontWeight: 'bold', color: '#475569' });
            
            const typeSelect = document.createElement('select');
            Object.assign(typeSelect.style, { padding: '4px 8px', fontSize: '13px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', color: '#0f172a', outline: 'none', cursor: 'pointer' });
            ['Blood Pressure', 'Blood Sugar', 'Heart Rate', 'Body Temp', 'Custom'].forEach(opt => {
                const option = document.createElement('option'); option.value = opt; option.innerText = opt; typeSelect.appendChild(option);
            });

            const addBtn = document.createElement('button');
            addBtn.innerText = "+";
            Object.assign(addBtn.style, { backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '4px', width: '28px', height: '28px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' });
            
            addBtn.onclick = () => {
                const type = typeSelect.value;
                const newVital = {
                    id: generateId(), type: type, customName: type === 'Custom' ? 'Custom' : '',
                    value: type === 'Blood Pressure' ? { sys: '', dia: '' } : '', 
                    timestamp: '' 
                };
                
                dayData.active.push(newVital);
                triggerSave();
                renderVitals(true);
            };

            addWrapper.appendChild(valLbl);
            addWrapper.appendChild(typeSelect);
            addWrapper.appendChild(addBtn);
            contentArea.appendChild(addWrapper);

            // --- TRASHCAN SECTION ---
            if (dayData.trash.length > 0) {
                const trashArea = document.createElement('div');
                const trashToggle = document.createElement('button');
                trashToggle.innerText = isTrashOpen ? `▼ Hide Trash (${dayData.trash.length})` : `▶ Open Trash (${dayData.trash.length})`;
                Object.assign(trashToggle.style, { background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', padding: '0', marginTop: '16px', display: 'block' });
                
                trashToggle.onclick = () => { isTrashOpen = !isTrashOpen; renderVitals(true); };
                trashArea.appendChild(trashToggle);

                if (isTrashOpen) {
                    const tList = document.createElement('div');
                    Object.assign(tList.style, { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', padding: '12px', backgroundColor: '#fef2f2', border: '1px dashed #f87171', borderRadius: '6px' });
                    
                    dayData.trash.forEach(vital => {
                        const row = document.createElement('div');
                        Object.assign(row.style, { display: 'flex', alignItems: 'center', fontSize: '12px', color: '#991b1b', opacity: '0.8' });

                        let displayVal = '';
                        if (vital.type === 'Blood Pressure') displayVal = `${vital.value?.sys || '--'}/${vital.value?.dia || '--'}`;
                        else displayVal = vital.value || '--';
                        
                        const nameLabel = vital.type === 'Custom' ? (vital.customName || 'Custom') : vital.type;

                        const info = document.createElement('span');
                        info.innerHTML = `<strong>${nameLabel}:</strong> ${displayVal} <em style="margin-left:8px; font-size:11px;">(Taken: ${vital.timestamp || '--'})</em>`;
                        info.style.flex = '1';

                        const recoverBtn = document.createElement('button');
                        recoverBtn.innerText = "[Recover]";
                        Object.assign(recoverBtn.style, { background: 'none', border: 'none', color: '#0ea5e9', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' });
                        
                        recoverBtn.onclick = () => {
                            const idx = dayData.trash.findIndex(v => v.id === vital.id);
                            if (idx > -1) {
                                const recoveredItem = dayData.trash.splice(idx, 1)[0];
                                dayData.active.push(recoveredItem);
                                triggerSave();
                                renderVitals(true);
                            }
                        };

                        row.appendChild(info);
                        row.appendChild(recoverBtn);
                        tList.appendChild(row);
                    });
                    trashArea.appendChild(tList);
                }
                contentArea.appendChild(trashArea);
            }

        } else {
            // --- READ-ONLY MODE ---
            const actionBtn = document.createElement('button');
            actionBtn.innerText = '[Edit]';
            Object.assign(actionBtn.style, { background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: 'auto' });
            actionBtn.onclick = () => renderVitals(true);
            headerRow.appendChild(actionBtn);

            if (dayData.active.length === 0) {
                activeList.innerHTML = `<span style="color:#94a3b8; font-style:italic; font-weight:bold;">(No vitals tracked)</span>`;
            } else {
                dayData.active.forEach(vital => {
                    let displayVal = '';
                    let isSkipped = false;

                    if (vital.type === 'Blood Pressure') {
                        if (!vital.value || (!vital.value.sys && !vital.value.dia)) isSkipped = true;
                        else displayVal = `${vital.value.sys || '--'}/${vital.value.dia || '--'}`;
                    } else {
                        if (!vital.value) isSkipped = true;
                        else displayVal = vital.value;
                    }
                    
                    const nameLabel = vital.type === 'Custom' ? (vital.customName || 'Custom') : vital.type;
                    
                    const row = document.createElement('div');
                    Object.assign(row.style, { display: 'flex', alignItems: 'center' });
                    
                    const lbl = document.createElement('span');
                    lbl.innerText = `${nameLabel} - `;
                    Object.assign(lbl.style, { color: '#475569', fontWeight: '500', marginRight: '6px', minWidth: '120px' });
                    
                    const val = document.createElement('span');
                    if (isSkipped) {
                        val.innerText = '(--)';
                        Object.assign(val.style, { color: '#94a3b8', fontWeight: 'bold', marginRight: '16px' });
                    } else {
                        val.innerText = `(${displayVal})`;
                        Object.assign(val.style, { color: '#0f172a', fontWeight: 'bold', marginRight: '16px' });
                    }
                    
                    row.appendChild(lbl); row.appendChild(val);
                    
                    if (!isSkipped && vital.timestamp) {
                        const ts = document.createElement('span');
                        ts.innerText = `Taken: ${vital.timestamp}`;
                        Object.assign(ts.style, { color: '#10b981', fontSize: '11px', fontStyle: 'italic', fontWeight: 'bold', marginLeft: 'auto' });
                        row.appendChild(ts);
                    }
                    activeList.appendChild(row);
                });
            }
            contentArea.appendChild(activeList);
        }
    };

    (async () => {
        try {
            const token = localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev';
            const res = await fetch(`/api/state/load?userId=${token}&appName=health_vitals`);
            if (res.ok) {
                const dbData = await res.json();
                if (dbData && dbData.state) vitalsLedger = dbData.state;
            }
        } catch (err) { console.warn('AWS Load failed:', err); }

        renderVitals(false);
    })();

    return vBlock;
};