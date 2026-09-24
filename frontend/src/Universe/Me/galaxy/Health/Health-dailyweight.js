/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/Health-dailyweight.js
 * 
 * DESCRIPTION: 
 * A decoupled Daily Weight Tracker utilizing a Universal Date Ledger.
 * User-driven UI: No automatic onboarding prompts. Chatbox only activates 
 * to confirm deliberate historical date changes. Calculates daily weight flux.
 * ============================================================================
 */

var dwLedger = {}; // Structure: { "YYYY-MM-DD": { morningWeightKg: ..., eveningWeightKg: ... } }
let profileData = null; 

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getPreviousDateStr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00'); // Prevent timezone shift
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
};

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00'); 
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatWeight = (kg, unit) => {
    if (kg === null || kg === undefined || kg === '') return '';
    return unit === 'Imperial' ? `${(kg * 2.20462).toFixed(1)} lbs` : `${Number(kg).toFixed(1)} kg`;
};

const parseWeightToKg = (input, unit) => {
    if (!input) return null;
    const val = parseFloat(String(input).replace(/[^\d.]/g, ''));
    if (isNaN(val)) return null;
    return unit === 'Imperial' ? val * 0.453592 : val;
};

// Calculates the difference between yesterday's morning weight and today's
const calculateWeightChange = (prevKg, currKg, unit) => {
    if (prevKg == null || currKg == null) return 'Not tracked';
    
    const prev = unit === 'Imperial' ? prevKg * 2.20462 : prevKg;
    const curr = unit === 'Imperial' ? currKg * 2.20462 : currKg;
    const diff = curr - prev;
    
    if (Math.abs(diff) < 0.1) return 'No change';
    
    const absDiff = Math.abs(diff).toFixed(1);
    const unitStr = unit === 'Imperial' ? 'lbs' : 'kg';
    
    return diff > 0 ? `Gained ${absDiff} ${unitStr}` : `Lost ${absDiff} ${unitStr}`;
};

const syncDailyweightToAWS = async () => {
    const payload = { 
        userId: localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev', 
        appName: 'health_dailyweight', 
        stateData: dwLedger 
    };
    try {
        await fetch('/api/state/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('[Health-dailyweight] AWS Cloud Ledger sync successful.');
    } catch (err) { console.error('[Health-dailyweight] AWS Sync Error:', err); }
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

export const createDailyweightBlock = () => {
    let currentViewDate = getTodayStr(); // Tracks the currently displayed/editing date

    const dwBlock = document.createElement('div');
    Object.assign(dwBlock.style, {
        backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
        padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px',
        fontFamily: 'sans-serif', fontSize: '13px', color: '#0f172a', marginBottom: '16px'
    });

    const headerRow = document.createElement('div');
    Object.assign(headerRow.style, { display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' });
    dwBlock.appendChild(headerRow);

    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, {
        display: 'flex', flexDirection: 'column',
        backgroundColor: '#ffffff', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px'
    });
    dwBlock.appendChild(contentArea);

    const renderDW = (isEditMode) => {
        headerRow.innerHTML = '';
        contentArea.innerHTML = '';

        const unitPref = (profileData && profileData.unitPreference) ? profileData.unitPreference : 'Imperial';
        
        if (!dwLedger[currentViewDate]) dwLedger[currentViewDate] = { morningWeightKg: undefined, eveningWeightKg: undefined };
        
        const tState = dwLedger[currentViewDate];
        const prevDateStr = getPreviousDateStr(currentViewDate);
        const prevMorningWeight = dwLedger[prevDateStr] ? dwLedger[prevDateStr].morningWeightKg : null;
        
        const changeText = calculateWeightChange(prevMorningWeight, tState.morningWeightKg, unitPref);

        const prefix = document.createElement('strong');
        prefix.innerText = 'Daily Weight Tracker: ';
        prefix.style.marginRight = '16px';
        headerRow.appendChild(prefix);

        const makeReadField = (labelText, valText, hlColor = '#0f172a') => {
            const wrap = document.createElement('div');
            Object.assign(wrap.style, { display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', marginRight: '16px', marginBottom: '4px' });
            const lbl = document.createElement('span');
            lbl.innerText = labelText + " -";
            Object.assign(lbl.style, { color: '#475569', fontWeight: '500', marginRight: '6px' });
            const val = document.createElement('span');
            
            if (valText === null || valText === 'Not tracked') {
                val.innerText = valText === null ? '(Skipped)' : '(Not tracked)';
                Object.assign(val.style, { color: '#94a3b8', fontStyle: 'italic', fontWeight: 'bold' });
            } else {
                val.innerText = valText ? `(${valText})` : '(--)';
                Object.assign(val.style, { color: valText ? hlColor : '#94a3b8', fontWeight: 'bold' });
            }
            
            wrap.appendChild(lbl); wrap.appendChild(val);
            return wrap;
        };

        if (isEditMode) {
            const inputs = {};
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

            // Date Input logic
            inputs.date = document.createElement('input');
            inputs.date.type = 'date';
            inputs.date.value = currentViewDate;
            Object.assign(inputs.date.style, { width: '115px', padding: '4px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' });
            headerRow.appendChild(wrapContainer([makeLabel('Date -'), inputs.date]));

            inputs.date.onchange = async (e) => {
                const newDate = e.target.value;
                if (!newDate || newDate === currentViewDate) return;
                
                const chatWin = document.getElementById('tao-chatbox-window');
                if (chatWin && chatWin.style.display === 'none') if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
                window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: true } }));

                const confirm = await askChatbox(`Do you want to update the weights for ${formatDisplayDate(newDate)}?`, { choices: ['Yes', 'No'], expand: true });

                if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
                window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: false } }));

                if (confirm.toLowerCase() === 'yes') {
                    currentViewDate = newDate;
                    renderDW(true);
                } else {
                    inputs.date.value = currentViewDate;
                }
            };

            // Top Row: Inputs
            const inlineRow = document.createElement('div');
            Object.assign(inlineRow.style, { display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' });

            const getDisplayVal = (kgVal) => {
                if (kgVal === null || kgVal === undefined) return '';
                return unitPref === 'Imperial' ? (kgVal * 2.20462).toFixed(1) : Number(kgVal).toFixed(1);
            };

            const makeWeightInput = (kgVal, key) => {
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.value = getDisplayVal(kgVal);
                inp.placeholder = kgVal === null ? 'Skipped' : '';
                Object.assign(inp.style, { width: '60px', padding: '4px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' });
                inputs[key] = inp;
                
                const unitLbl = document.createElement('span');
                unitLbl.innerText = unitPref === 'Imperial' ? ' lbs' : ' kg';
                unitLbl.style.marginLeft = '4px';
                
                const block = document.createElement('div');
                Object.assign(block.style, { display: 'flex', alignItems: 'center' });
                block.appendChild(inp);
                block.appendChild(unitLbl);
                return block;
            };

            const morningWrap = document.createElement('div');
            Object.assign(morningWrap.style, { display: 'flex', alignItems: 'center' });
            morningWrap.appendChild(makeLabel('Morning Weight -'));
            morningWrap.appendChild(makeWeightInput(tState.morningWeightKg, 'morning'));
            inlineRow.appendChild(morningWrap);

            const eveningWrap = document.createElement('div');
            Object.assign(eveningWrap.style, { display: 'flex', alignItems: 'center' });
            eveningWrap.appendChild(makeLabel('Evening Weight -'));
            eveningWrap.appendChild(makeWeightInput(tState.eveningWeightKg, 'evening'));
            inlineRow.appendChild(eveningWrap);

            contentArea.appendChild(inlineRow);

            // Bottom Row: Calculated Change (Read-only even in Edit Mode)
            const changeRow = document.createElement('div');
            Object.assign(changeRow.style, { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' });
            changeRow.appendChild(makeReadField('Daily change', changeText, '#0ea5e9'));
            contentArea.appendChild(changeRow);

            const actionBtn = document.createElement('button');
            actionBtn.innerText = '[Update]';
            Object.assign(actionBtn.style, {
                background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: 'auto'
            });

            actionBtn.onclick = async () => {
                const mVal = inputs.morning.value.trim();
                const eVal = inputs.evening.value.trim();
                
                tState.morningWeightKg = mVal === '' ? null : parseWeightToKg(mVal, unitPref);
                tState.eveningWeightKg = eVal === '' ? null : parseWeightToKg(eVal, unitPref);
                
                await syncDailyweightToAWS();
                speakAmbient("Weight updated.");
                
                // Reset to today's date upon successful update
                currentViewDate = getTodayStr(); 
                renderDW(false);
            };
            headerRow.appendChild(actionBtn);

        } else {
            headerRow.appendChild(makeReadField('Date', formatDisplayDate(currentViewDate)));
            
            // Top Row: Read Data
            const inlineRow = document.createElement('div');
            Object.assign(inlineRow.style, { display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' });
            
            inlineRow.appendChild(makeReadField('Morning Weight', tState.morningWeightKg !== undefined ? formatWeight(tState.morningWeightKg, unitPref) : null));
            inlineRow.appendChild(makeReadField('Evening Weight', tState.eveningWeightKg !== undefined ? formatWeight(tState.eveningWeightKg, unitPref) : null));
            contentArea.appendChild(inlineRow);
            
            // Bottom Row: Calculated Change
            const changeRow = document.createElement('div');
            Object.assign(changeRow.style, { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' });
            changeRow.appendChild(makeReadField('Daily change', changeText, '#0ea5e9'));
            contentArea.appendChild(changeRow);

            const actionBtn = document.createElement('button');
            actionBtn.innerText = '[Edit]';
            Object.assign(actionBtn.style, {
                background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: 'auto'
            });

            actionBtn.onclick = () => renderDW(true);
            headerRow.appendChild(actionBtn);
        }
    };

    const bootDailyWeight = async () => {
        try {
            const token = localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev';
            
            // 1. Fetch Profile for formatting
            const profRes = await fetch(`/api/state/load?userId=${token}&appName=health_profile`);
            if (profRes.ok) {
                const pData = await profRes.json();
                if (pData && pData.state) profileData = pData.state;
            }

            // 2. Fetch Daily Weight Ledger
            const dwRes = await fetch(`/api/state/load?userId=${token}&appName=health_dailyweight`);
            if (dwRes.ok) {
                const dbData = await dwRes.json();
                if (dbData && dbData.state) dwLedger = dbData.state;
            }
        } catch (err) { console.warn('AWS Load failed:', err); }

        renderDW(false);
    };

    // Listen for the custom event to recalculate whenever the profile updates (e.g. Lbs -> Kg change)
    window.addEventListener('tao-profile-updated', bootDailyWeight);

    // Initial load
    bootDailyWeight();

    return dwBlock;
};