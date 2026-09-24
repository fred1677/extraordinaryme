/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/Health-exercise.js
 * 
 * DESCRIPTION: 
 * A decoupled Exercise Tracker utilizing a Universal Date Ledger.
 * Features a unified UI shell, an auto-saving text area, auto-timestamping, 
 * and a unified Chatbox date-change loop for historical logging.
 * ============================================================================
 */

var exerciseLedger = {}; 
// Structure: { "YYYY-MM-DD": { text: "...", timestamp: "..." } }

const getTodayStr = () => new Date().toISOString().split('T')[0];

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00'); 
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const syncExerciseToAWS = async () => {
    const payload = { 
        userId: localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev', 
        appName: 'health_exercise', 
        stateData: exerciseLedger 
    };
    try {
        await fetch('/api/state/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('[Health-exercise] AWS Cloud Ledger sync successful.');
    } catch (err) { console.error('[Health-exercise] AWS Sync Error:', err); }
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

export const createExerciseBlock = () => {
    let currentViewDate = getTodayStr();
    let saveTimeout = null;

    const saveIndicator = document.createElement('span');
    Object.assign(saveIndicator.style, { color: '#10b981', fontSize: '11px', fontWeight: 'normal', fontStyle: 'italic', marginLeft: 'auto' });

    const eBlock = document.createElement('div');
    Object.assign(eBlock.style, {
        backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
        padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px',
        fontFamily: 'sans-serif', fontSize: '13px', color: '#0f172a', marginBottom: '16px'
    });

    const headerRow = document.createElement('div');
    Object.assign(headerRow.style, { display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' });
    eBlock.appendChild(headerRow);

    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, {
        display: 'flex', flexDirection: 'column', gap: '12px',
        backgroundColor: '#ffffff', padding: '16px', border: '1px solid #cbd5e1', borderRadius: '6px'
    });
    eBlock.appendChild(contentArea);

    const triggerSave = () => {
        const now = new Date();
        saveIndicator.innerText = ` • System saved at ${now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' })}`;
        
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(syncExerciseToAWS, 1500);
    };

    const renderExercise = () => {
        headerRow.innerHTML = '';
        contentArea.innerHTML = '';

        if (!exerciseLedger[currentViewDate]) exerciseLedger[currentViewDate] = { text: '', timestamp: '' };
        const dayData = exerciseLedger[currentViewDate];

        // --- HEADER ---
        const prefix = document.createElement('strong');
        prefix.innerText = 'Daily Exercise Tracker: ';
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

            const confirm = await askChatbox(`Do you want to manage exercise for ${formatDisplayDate(newDate)}?`, { choices: ['Yes', 'No'], expand: true });

            if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
            window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: false } }));

            if (confirm.toLowerCase() === 'yes') {
                currentViewDate = newDate;
                renderExercise();
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
                renderExercise();
            };
            headerRow.appendChild(returnBtn);
        }

        headerRow.appendChild(saveIndicator);

        // --- CONTENT AREA ---
        const exText = document.createElement('textarea');
        Object.assign(exText.style, {
            width: '100%', height: '120px', padding: '12px', fontSize: '13px', backgroundColor: '#f8fafc', 
            fontFamily: 'sans-serif', border: '1px solid #cbd5e1', borderRadius: '4px', 
            resize: 'vertical', outline: 'none', boxSizing: 'border-box'
        });
        exText.placeholder = `Log your workout routines, steps, or physical activities here...`;
        exText.value = dayData.text || '';

        const timestampDisplay = document.createElement('div');
        Object.assign(timestampDisplay.style, { color: '#10b981', fontSize: '11px', fontStyle: 'italic', fontWeight: 'bold', textAlign: 'right', marginTop: '-4px' });
        timestampDisplay.innerText = dayData.timestamp ? `Updated: ${dayData.timestamp}` : '';

        exText.oninput = (e) => {
            const val = e.target.value;
            const nowStamp = new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
            
            dayData.text = val;
            
            if (val.trim() === '') {
                dayData.timestamp = '';
                timestampDisplay.innerText = '';
            } else {
                dayData.timestamp = nowStamp;
                timestampDisplay.innerText = `Updated: ${nowStamp}`;
            }
            triggerSave();
        };

        contentArea.appendChild(exText);
        contentArea.appendChild(timestampDisplay);
    };

    (async () => {
        try {
            const token = localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev';
            const res = await fetch(`/api/state/load?userId=${token}&appName=health_exercise`);
            if (res.ok) {
                const dbData = await res.json();
                if (dbData && dbData.state) exerciseLedger = dbData.state;
            }
        } catch (err) { console.warn('AWS Load failed:', err); }

        renderExercise();
    })();

    return eBlock;
};