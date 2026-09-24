/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/Health-meal.js
 * 
 * DESCRIPTION: 
 * A decoupled Meal Tracker utilizing a Universal Date Ledger.
 * Features dynamic, stackable Meal Blocks. Each block contains its own 
 * dropdown, auto-saving text area, and isolated Nutritional Summary.
 * Includes Chatbox prompting for "Other" categories and a Trashcan system.
 * ============================================================================
 */

var mealLedger = {}; 
// Structure: { "YYYY-MM-DD": { active: [mealObjs], trash: [mealObjs] } }

const MEAL_CATEGORIES = ['Morning Routine', 'Breakfast', 'Lunch', 'Brunch', 'Dinner', 'Snack', 'Dessert', 'Supplement', 'Other'];

const getTodayStr = () => new Date().toISOString().split('T')[0];

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00'); 
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const generateId = () => 'meal_' + Math.random().toString(36).substr(2, 9);

const syncMealsToAWS = async () => {
    const payload = { 
        userId: localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev', 
        appName: 'health_meals', 
        stateData: mealLedger 
    };
    try {
        await fetch('/api/state/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('[Health-meal] AWS Cloud Ledger sync successful.');
    } catch (err) { console.error('[Health-meal] AWS Sync Error:', err); }
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

export const createMealBlock = () => {
    let currentViewDate = getTodayStr();
    let isTrashOpen = false;
    let saveTimeout = null;

    const saveIndicator = document.createElement('span');
    Object.assign(saveIndicator.style, { color: '#10b981', fontSize: '11px', fontWeight: 'normal', fontStyle: 'italic', marginLeft: 'auto' });

    const mBlock = document.createElement('div');
    Object.assign(mBlock.style, {
        backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
        padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px',
        fontFamily: 'sans-serif', fontSize: '13px', color: '#0f172a', marginBottom: '16px'
    });

    const headerRow = document.createElement('div');
    Object.assign(headerRow.style, { display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' });
    mBlock.appendChild(headerRow);

    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, {
        display: 'flex', flexDirection: 'column', gap: '16px',
        backgroundColor: '#ffffff', padding: '16px', border: '1px solid #cbd5e1', borderRadius: '6px'
    });
    mBlock.appendChild(contentArea);

    const triggerSave = () => {
        const now = new Date();
        saveIndicator.innerText = ` • System saved at ${now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' })}`;
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(syncMealsToAWS, 1500);
    };

    // Helper to generate the Nutritional Summary HTML to keep render logic clean
    const buildNutritionSummary = (mealData) => {
        const nutritionBlock = document.createElement('div');
        Object.assign(nutritionBlock.style, {
            marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px'
        });

        const nutHeader = document.createElement('div');
        const displayName = mealData.category === 'Other' && mealData.customName ? mealData.customName : mealData.category;
        nutHeader.innerHTML = `<strong>Nutritional Summary:</strong> <span style="color:#64748b; font-weight:normal;">${displayName}</span>`;
        nutritionBlock.appendChild(nutHeader);

        const nutGrid = document.createElement('div');
        Object.assign(nutGrid.style, {
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', 
            padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px'
        });

        const makeNutRow = (label, val, hlColor = '#0f172a') => {
            const row = document.createElement('div');
            Object.assign(row.style, { display: 'flex', justifyContent: 'space-between', marginBottom: '4px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '2px' });
            
            const lblSpan = document.createElement('span');
            lblSpan.innerText = label + ':';
            Object.assign(lblSpan.style, { color: '#475569', fontSize: '13px' });

            const valSpan = document.createElement('strong');
            valSpan.innerText = val || '--';
            Object.assign(valSpan.style, { color: val && val !== '--' ? hlColor : '#94a3b8', fontSize: '13px' });

            row.appendChild(lblSpan); row.appendChild(valSpan);
            return row;
        };

        const activeNut = mealData.nutrition || {};

        const macrosCol = document.createElement('div');
        macrosCol.innerHTML = `<div style="font-weight:bold; margin-bottom:8px; color:#0ea5e9; font-size:12px; text-transform:uppercase;">Macros</div>`;
        macrosCol.appendChild(makeNutRow('Calories', activeNut.calories ? `${activeNut.calories} kcal` : '--'));
        macrosCol.appendChild(makeNutRow('Protein', activeNut.protein ? `${activeNut.protein} g` : '--'));
        macrosCol.appendChild(makeNutRow('Carbs', activeNut.carbs ? `${activeNut.carbs} g` : '--'));
        macrosCol.appendChild(makeNutRow('Fats', activeNut.fats ? `${activeNut.fats} g` : '--'));

        const microsCol = document.createElement('div');
        microsCol.innerHTML = `<div style="font-weight:bold; margin-bottom:8px; color:#0ea5e9; font-size:12px; text-transform:uppercase;">Micros</div>`;
        microsCol.appendChild(makeNutRow('Vitamin A', activeNut.vitaminA || '--'));
        microsCol.appendChild(makeNutRow('Vitamin C', activeNut.vitaminC || '--'));
        microsCol.appendChild(makeNutRow('Calcium', activeNut.calcium || '--'));
        microsCol.appendChild(makeNutRow('Iron', activeNut.iron || '--'));

        nutGrid.appendChild(macrosCol);
        nutGrid.appendChild(microsCol);
        nutritionBlock.appendChild(nutGrid);

        return nutritionBlock;
    };

    const renderMeals = (isEditMode) => {
        headerRow.innerHTML = '';
        contentArea.innerHTML = '';

        // Safe Initialization
        if (!mealLedger[currentViewDate] || !Array.isArray(mealLedger[currentViewDate].active)) {
            mealLedger[currentViewDate] = { active: [], trash: [] };
        }
        const dayData = mealLedger[currentViewDate];

        // --- HEADER ---
        const prefix = document.createElement('strong');
        prefix.innerText = 'Daily Meal Tracker: ';
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

            const confirm = await askChatbox(`Do you want to manage meals for ${formatDisplayDate(newDate)}?`, { choices: ['Yes', 'No'], expand: true });

            if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
            window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: false } }));

            if (confirm.toLowerCase() === 'yes') {
                currentViewDate = newDate;
                isTrashOpen = false;
                renderMeals(true);
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
                renderMeals();
            };
            headerRow.appendChild(returnBtn);
        }

        headerRow.appendChild(saveIndicator);

        if (isEditMode) {
            // --- EDIT MODE ---
            const actionBtn = document.createElement('button');
            actionBtn.innerText = '[Update]';
            Object.assign(actionBtn.style, { background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: 'auto' });

            actionBtn.onclick = async () => {
                await syncMealsToAWS();
                currentViewDate = getTodayStr(); 
                renderMeals(false);
            };
            headerRow.appendChild(actionBtn);

            if (dayData.active.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.innerHTML = `<span style="color:#94a3b8; font-style:italic; font-weight:bold;">(No meals tracked)</span>`;
                contentArea.appendChild(emptyMsg);
            }

            // Render Each Active Meal Block
            dayData.active.forEach(meal => {
                const blockWrapper = document.createElement('div');
                Object.assign(blockWrapper.style, {
                    border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff',
                    display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                });

                // Top Row: Dropdown & Delete Button
                const blockHeader = document.createElement('div');
                Object.assign(blockHeader.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between' });

                const mealSelect = document.createElement('select');
                Object.assign(mealSelect.style, {
                    padding: '6px 12px', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#f8fafc', 
                    border: '1px solid #cbd5e1', borderRadius: '4px', color: '#0f172a', outline: 'none', cursor: 'pointer'
                });

                MEAL_CATEGORIES.forEach((cat) => {
                    const option = document.createElement('option');
                    option.value = cat;
                    if (cat === 'Other' && meal.customName && meal.category === 'Other') {
                        option.innerText = `Other: ${meal.customName}`;
                    } else {
                        option.innerText = cat;
                    }
                    if (cat === meal.category) option.selected = true;
                    mealSelect.appendChild(option);
                });

                mealSelect.onchange = async (e) => {
                    const newVal = e.target.value;
                    if (newVal === 'Other') {
                        const chatWin = document.getElementById('tao-chatbox-window');
                        if (chatWin && chatWin.style.display === 'none') if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
                        window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: true } }));

                        const customPrompt = await askChatbox(`What would you like to name this meal?`, { waitForInput: true });

                        if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
                        window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: false } }));

                        meal.customName = customPrompt;
                    } else {
                        meal.customName = '';
                    }
                    meal.category = newVal;
                    triggerSave();
                    renderMeals(true);
                };

                const removeBtn = document.createElement('button');
                removeBtn.innerText = "Delete Block ×";
                Object.assign(removeBtn.style, { background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', padding: '4px 8px' });
                
                removeBtn.onclick = () => {
                    const idx = dayData.active.findIndex(m => m.id === meal.id);
                    if (idx > -1) {
                        const trashedItem = dayData.active.splice(idx, 1)[0];
                        dayData.trash.push(trashedItem);
                        triggerSave();
                        renderMeals(true);
                    }
                };

                blockHeader.appendChild(mealSelect);
                blockHeader.appendChild(removeBtn);
                blockWrapper.appendChild(blockHeader);

                // Text Area
                const mealText = document.createElement('textarea');
                Object.assign(mealText.style, {
                    width: '100%', height: '80px', padding: '12px', fontSize: '13px', backgroundColor: '#f8fafc', 
                    fontFamily: 'sans-serif', border: '1px solid #cbd5e1', borderRadius: '4px', 
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box'
                });
                
                const displayName = meal.category === 'Other' && meal.customName ? meal.customName : meal.category;
                mealText.placeholder = `Enter details for ${displayName} (e.g. vegetable omelet, ginger tea)...`;
                mealText.value = meal.text || '';

                const timestampDisplay = document.createElement('div');
                Object.assign(timestampDisplay.style, { color: '#10b981', fontSize: '11px', fontStyle: 'italic', fontWeight: 'bold', textAlign: 'right', marginTop: '-4px' });
                timestampDisplay.innerText = meal.timestamp ? `Updated: ${meal.timestamp}` : '';

                mealText.oninput = (e) => {
                    meal.text = e.target.value;
                    if (meal.text.trim() === '') {
                        meal.timestamp = '';
                        timestampDisplay.innerText = '';
                    } else {
                        const nowStamp = new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
                        meal.timestamp = nowStamp;
                        timestampDisplay.innerText = `Updated: ${nowStamp}`;
                    }
                    triggerSave();
                };

                blockWrapper.appendChild(mealText);
                blockWrapper.appendChild(timestampDisplay);
                blockWrapper.appendChild(buildNutritionSummary(meal));
                
                contentArea.appendChild(blockWrapper);
            });

            // "Add Meal Block" Button
            const addBtnWrap = document.createElement('div');
            Object.assign(addBtnWrap.style, { display: 'flex', justifyContent: 'center', marginTop: '12px' });
            
            const addBtn = document.createElement('button');
            addBtn.innerText = "+ Add Meal Block";
            Object.assign(addBtn.style, {
                backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '6px', 
                padding: '10px 24px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(14,165,233,0.3)', transition: 'background-color 0.2s'
            });
            addBtn.onmouseover = () => addBtn.style.backgroundColor = '#0284c7';
            addBtn.onmouseout = () => addBtn.style.backgroundColor = '#0ea5e9';

            addBtn.onclick = () => {
                dayData.active.push({
                    id: generateId(), category: 'Breakfast', customName: '', text: '', timestamp: '', nutrition: null
                });
                triggerSave();
                renderMeals(true);
            };

            addBtnWrap.appendChild(addBtn);
            contentArea.appendChild(addBtnWrap);

            // --- TRASHCAN SECTION ---
            if (dayData.trash.length > 0) {
                const trashArea = document.createElement('div');
                const trashToggle = document.createElement('button');
                trashToggle.innerText = isTrashOpen ? `▼ Hide Trash (${dayData.trash.length})` : `▶ Open Trash (${dayData.trash.length})`;
                Object.assign(trashToggle.style, { background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', padding: '0', marginTop: '16px', display: 'block' });
                
                trashToggle.onclick = () => { isTrashOpen = !isTrashOpen; renderMeals(true); };
                trashArea.appendChild(trashToggle);

                if (isTrashOpen) {
                    const tList = document.createElement('div');
                    Object.assign(tList.style, { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', padding: '12px', backgroundColor: '#fef2f2', border: '1px dashed #f87171', borderRadius: '6px' });
                    
                    dayData.trash.forEach(meal => {
                        const row = document.createElement('div');
                        Object.assign(row.style, { display: 'flex', alignItems: 'center', fontSize: '12px', color: '#991b1b', opacity: '0.8' });

                        const nameLabel = meal.category === 'Other' && meal.customName ? meal.customName : meal.category;
                        const snippet = meal.text ? (meal.text.length > 30 ? meal.text.substring(0, 30) + '...' : meal.text) : 'Empty block';

                        const info = document.createElement('span');
                        info.innerHTML = `<strong>${nameLabel}:</strong> "${snippet}" <em style="margin-left:8px; font-size:11px;">(Updated: ${meal.timestamp || '--'})</em>`;
                        info.style.flex = '1';

                        const recoverBtn = document.createElement('button');
                        recoverBtn.innerText = "[Recover]";
                        Object.assign(recoverBtn.style, { background: 'none', border: 'none', color: '#0ea5e9', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' });
                        
                        recoverBtn.onclick = () => {
                            const idx = dayData.trash.findIndex(m => m.id === meal.id);
                            if (idx > -1) {
                                const recoveredItem = dayData.trash.splice(idx, 1)[0];
                                dayData.active.push(recoveredItem);
                                triggerSave();
                                renderMeals(true);
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
            actionBtn.onclick = () => renderMeals(true);
            headerRow.appendChild(actionBtn);

            if (dayData.active.length === 0) {
                contentArea.innerHTML = `<span style="color:#94a3b8; font-style:italic; font-weight:bold;">(No meals tracked)</span>`;
            } else {
                dayData.active.forEach(meal => {
                    const blockWrapper = document.createElement('div');
                    Object.assign(blockWrapper.style, {
                        border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff',
                        display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    });

                    const nameLabel = meal.category === 'Other' && meal.customName ? meal.customName : meal.category;
                    
                    const blockHeader = document.createElement('div');
                    Object.assign(blockHeader.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '4px' });
                    
                    const title = document.createElement('span');
                    title.innerHTML = `<strong style="font-size:15px; color:#0f172a;">${nameLabel}</strong>`;
                    
                    const ts = document.createElement('span');
                    ts.innerText = meal.timestamp ? `Updated: ${meal.timestamp}` : '';
                    Object.assign(ts.style, { color: '#10b981', fontSize: '11px', fontStyle: 'italic', fontWeight: 'bold' });

                    blockHeader.appendChild(title);
                    blockHeader.appendChild(ts);
                    blockWrapper.appendChild(blockHeader);

                    const textDisplay = document.createElement('div');
                    Object.assign(textDisplay.style, { color: meal.text ? '#334155' : '#94a3b8', fontSize: '13px', lineHeight: '1.5', fontStyle: meal.text ? 'normal' : 'italic', whiteSpace: 'pre-wrap' });
                    textDisplay.innerText = meal.text || '(--)';
                    blockWrapper.appendChild(textDisplay);

                    blockWrapper.appendChild(buildNutritionSummary(meal));
                    contentArea.appendChild(blockWrapper);
                });
            }
        }
    };

    (async () => {
        try {
            const token = localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev';
            const res = await fetch(`/api/state/load?userId=${token}&appName=health_meals`);
            if (res.ok) {
                const dbData = await res.json();
                if (dbData && dbData.state) mealLedger = dbData.state;
            }
        } catch (err) { console.warn('AWS Load failed:', err); }

        renderMeals(false);
    })();

    return mBlock;
};