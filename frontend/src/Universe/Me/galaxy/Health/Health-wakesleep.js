/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/Health-wakesleep.js
 * 
 * DESCRIPTION: 
 * A decoupled Wake & Sleep Tracker utilizing a Universal Date Ledger.
 * User-driven UI: No automatic onboarding prompts. Chatbox only activates 
 * to confirm deliberate historical date changes. Features separated HH:MM inputs
 * and calculates total hours slept spanning from the previous day's ledger.
 * ============================================================================
 */

var wsLedger = {}; // Structure: { "YYYY-MM-DD": { wakeTime: ..., sleepTime: ... } }

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

// Extracts HH, MM, and Unit from a saved "HH:MM AM" string
const parseTimeStr = (str) => {
    if (!str || str === 'Skipped') return { hh: '', mm: '', unit: 'AM' };
    const parts = str.split(' ');
    const timePart = parts[0] || '';
    const unit = parts[1] || 'AM';
    const timeSplit = timePart.split(':');
    return { hh: timeSplit[0] || '', mm: timeSplit[1] || '', unit: unit };
};

// Merges inputs back into "HH:MM AM" or null if empty
const buildTimeStr = (hh, mm, unit) => {
    if (!hh && !mm) return null;
    const safeHH = hh ? hh.trim().padStart(2, '0') : '00';
    const safeMM = mm ? mm.trim().padStart(2, '0') : '00';
    return `${safeHH}:${safeMM} ${unit}`;
};

// Converts "HH:MM AM" to total minutes for math calculations
const timeToMinutes = (timeStr) => {
    if (!timeStr || timeStr === 'Skipped') return null;
    const parts = timeStr.split(' ');
    if (parts.length < 2) return null;
    
    const [time, unit] = parts;
    let [hh, mm] = time.split(':').map(Number);
    if (isNaN(hh) || isNaN(mm)) return null;

    if (unit === 'PM' && hh !== 12) hh += 12;
    if (unit === 'AM' && hh === 12) hh = 0;
    
    return (hh * 60) + mm;
};

// Calculates duration between yesterday's sleep and today's wake
const calculateSleepDuration = (sleepTimeStr, wakeTimeStr) => {
    const sleepMins = timeToMinutes(sleepTimeStr);
    const wakeMins = timeToMinutes(wakeTimeStr);

    if (sleepMins === null || wakeMins === null) return 'Not tracked';

    let durationMins = 0;
    // If sleep time (e.g. 11PM) is numerically greater than wake time (e.g. 7AM)
    if (sleepMins > wakeMins) {
        durationMins = (1440 - sleepMins) + wakeMins;
    } else {
        // If they went to sleep after midnight (e.g. 1AM) and woke up at 7AM
        durationMins = wakeMins - sleepMins;
    }

    const hrs = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
};

const syncWakesleepToAWS = async () => {
    const payload = { 
        userId: localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev', 
        appName: 'health_wakesleep', 
        stateData: wsLedger 
    };
    try {
        await fetch('/api/state/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('[Health-wakesleep] AWS Cloud Ledger sync successful.');
    } catch (err) { console.error('[Health-wakesleep] AWS Sync Error:', err); }
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

export const createWakesleepBlock = () => {
    let currentViewDate = getTodayStr(); // Tracks the currently displayed/editing date

    const wsBlock = document.createElement('div');
    Object.assign(wsBlock.style, {
        backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
        padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px',
        fontFamily: 'sans-serif', fontSize: '13px', color: '#0f172a', marginBottom: '16px'
    });

    const headerRow = document.createElement('div');
    Object.assign(headerRow.style, { display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' });
    wsBlock.appendChild(headerRow);

    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, {
        display: 'flex', flexDirection: 'column',
        backgroundColor: '#ffffff', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px'
    });
    wsBlock.appendChild(contentArea);

    const renderWS = (isEditMode) => {
        headerRow.innerHTML = '';
        contentArea.innerHTML = '';
        
        if (!wsLedger[currentViewDate]) wsLedger[currentViewDate] = { wakeTime: undefined, sleepTime: undefined };
        
        const tState = wsLedger[currentViewDate];
        const prevDateStr = getPreviousDateStr(currentViewDate);
        const prevSleepTime = wsLedger[prevDateStr] ? wsLedger[prevDateStr].sleepTime : null;
        
        const durationText = calculateSleepDuration(prevSleepTime, tState.wakeTime);
        
        const prefix = document.createElement('strong');
        prefix.innerText = 'Wake & Sleep Tracker: ';
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

                const confirm = await askChatbox(`Do you want to update the wake up and sleep time for ${formatDisplayDate(newDate)}?`, { choices: ['Yes', 'No'], expand: true });

                if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
                window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: false } }));

                if (confirm.toLowerCase() === 'yes') {
                    currentViewDate = newDate;
                    renderWS(true);
                } else {
                    inputs.date.value = currentViewDate;
                }
            };

            // Helper to generate the HH : MM [AM] block
            const makeTimeBlock = (timeData, keyPrefix) => {
                const wrap = document.createElement('div');
                Object.assign(wrap.style, { display: 'flex', alignItems: 'center' });
                
                const inpStyles = { width: '30px', padding: '4px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', textAlign: 'center' };
                
                const hhInp = document.createElement('input');
                hhInp.type = 'text'; hhInp.maxLength = 2; hhInp.value = timeData.hh;
                hhInp.placeholder = 'HH';
                Object.assign(hhInp.style, inpStyles);
                inputs[`${keyPrefix}HH`] = hhInp;
                
                const colon = document.createElement('span');
                colon.innerText = ':';
                Object.assign(colon.style, { margin: '0 4px', fontWeight: 'bold', color: '#475569' });
                
                const mmInp = document.createElement('input');
                mmInp.type = 'text'; mmInp.maxLength = 2; mmInp.value = timeData.mm;
                mmInp.placeholder = 'MM';
                Object.assign(mmInp.style, inpStyles);
                inputs[`${keyPrefix}MM`] = mmInp;

                const sel = document.createElement('select');
                Object.assign(sel.style, { padding: '4px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', marginLeft: '6px', cursor: 'pointer' });
                ['AM', 'PM', 'Mil'].forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt; option.innerText = opt;
                    if (timeData.unit === opt) option.selected = true;
                    sel.appendChild(option);
                });
                inputs[`${keyPrefix}Unit`] = sel;

                wrap.appendChild(hhInp); wrap.appendChild(colon); wrap.appendChild(mmInp); wrap.appendChild(sel);
                return wrap;
            };

            // Top Row: Inputs
            const inlineRow = document.createElement('div');
            Object.assign(inlineRow.style, { display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' });

            const wData = parseTimeStr(tState.wakeTime);
            const wakeWrap = document.createElement('div');
            Object.assign(wakeWrap.style, { display: 'flex', alignItems: 'center' });
            wakeWrap.appendChild(makeLabel('Wake Time -'));
            wakeWrap.appendChild(makeTimeBlock(wData, 'wake'));
            inlineRow.appendChild(wakeWrap);

            const sData = parseTimeStr(tState.sleepTime);
            const sleepWrap = document.createElement('div');
            Object.assign(sleepWrap.style, { display: 'flex', alignItems: 'center' });
            sleepWrap.appendChild(makeLabel('Sleep Time -'));
            sleepWrap.appendChild(makeTimeBlock(sData, 'sleep'));
            inlineRow.appendChild(sleepWrap);

            contentArea.appendChild(inlineRow);

            // Bottom Row: Calculated Duration (Read-only even in Edit Mode)
            const durationRow = document.createElement('div');
            Object.assign(durationRow.style, { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' });
            durationRow.appendChild(makeReadField('Hours sleep', durationText, '#0ea5e9'));
            contentArea.appendChild(durationRow);

            const actionBtn = document.createElement('button');
            actionBtn.innerText = '[Update]';
            Object.assign(actionBtn.style, {
                background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: 'auto'
            });

            actionBtn.onclick = async () => {
                const wHH = inputs.wakeHH.value.trim();
                const wMM = inputs.wakeMM.value.trim();
                const sHH = inputs.sleepHH.value.trim();
                const sMM = inputs.sleepMM.value.trim();
                
                tState.wakeTime = buildTimeStr(wHH, wMM, inputs.wakeUnit.value);
                tState.sleepTime = buildTimeStr(sHH, sMM, inputs.sleepUnit.value);
                
                await syncWakesleepToAWS();
                speakAmbient("Wake up and sleep time updated.");
                
                // Reset to today's date upon successful update
                currentViewDate = getTodayStr(); 
                renderWS(false);
            };
            headerRow.appendChild(actionBtn);

        } else {
            headerRow.appendChild(makeReadField('Date', formatDisplayDate(currentViewDate)));
            
            // Top Row: Read Data
            const inlineRow = document.createElement('div');
            Object.assign(inlineRow.style, { display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' });
            inlineRow.appendChild(makeReadField('Wake Time', tState.wakeTime));
            inlineRow.appendChild(makeReadField('Sleep Time', tState.sleepTime));
            contentArea.appendChild(inlineRow);
            
            // Bottom Row: Calculated Duration
            const durationRow = document.createElement('div');
            Object.assign(durationRow.style, { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' });
            durationRow.appendChild(makeReadField('Hours sleep', durationText, '#0ea5e9'));
            contentArea.appendChild(durationRow);

            const actionBtn = document.createElement('button');
            actionBtn.innerText = '[Edit]';
            Object.assign(actionBtn.style, {
                background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: 'auto'
            });

            actionBtn.onclick = () => renderWS(true);
            headerRow.appendChild(actionBtn);
        }
    };

    (async () => {
        try {
            const token = localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev';
            const res = await fetch(`/api/state/load?userId=${token}&appName=health_wakesleep`);
            if (res.ok) {
                const dbData = await res.json();
                if (dbData && dbData.state) wsLedger = dbData.state;
            }
        } catch (err) { console.warn('AWS Load failed:', err); }

        renderWS(false);
    })();

    return wsBlock;
};