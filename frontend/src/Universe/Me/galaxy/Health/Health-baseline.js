/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/Health-baseline.js
 * 
 * DESCRIPTION: 
 * A decoupled Weight Baseline Component. Pulls static biological data from the 
 * Profile block to calculate Ideal Weight, BMI bounds, and Calorie targets. 
 * Renders full structural UI, features native dropdowns for goal setting, 
 * and auto-updates dynamically when metric/imperial units are toggled or 
 * biological profile stats change. Retains exact user targets upon editing.
 * ============================================================================
 */

// ============================================================================
// INTERNAL STATE & AWS SYNC
// ============================================================================
const baselineState = {
    startingDate: '', 
    targetWeightKg: 0,
    targetGoal: '',         // Stored as universal key: 'maintain', 'lose_1.0', etc.
    targetDailyCalories: 0, 
    hasCompletedOnboarding: false
};

let profileData = null; // Read-only anchor data from Health-profile

const GOAL_OPTIONS = [
    { id: 'maintain', offset: 0, imp: 'Maintain Weight', met: 'Maintain Weight' },
    { id: 'lose_0.5', offset: -250, imp: 'Lose 0.5 lb/wk', met: 'Lose 0.25 kg/wk' },
    { id: 'lose_1.0', offset: -500, imp: 'Lose 1.0 lb/wk', met: 'Lose 0.5 kg/wk' },
    { id: 'lose_2.0', offset: -1000, imp: 'Lose 2.0 lb/wk', met: 'Lose 1.0 kg/wk' },
    { id: 'gain_0.5', offset: 250, imp: 'Gain 0.5 lb/wk', met: 'Gain 0.25 kg/wk' },
    { id: 'gain_1.0', offset: 500, imp: 'Gain 1.0 lb/wk', met: 'Gain 0.5 kg/wk' }
];

// Helper to convert older saved strings to universal keys
const mapLegacyGoal = (goalStr) => {
    if (!goalStr) return 'maintain';
    // If it is already a valid key, return it immediately to prevent falling back to 'maintain'
    if (GOAL_OPTIONS.some(g => g.id === goalStr)) return goalStr; 
    
    const s = goalStr.toLowerCase();
    if (s.includes('0.5 lb') || s.includes('0.25 kg')) return s.includes('lose') ? 'lose_0.5' : 'gain_0.5';
    if (s.includes('1.0 lb') || s.includes('0.5 kg')) return s.includes('lose') ? 'lose_1.0' : 'gain_1.0';
    if (s.includes('2.0 lb') || s.includes('1.0 kg')) return 'lose_2.0';
    return 'maintain';
};

const syncBaselineToAWS = async () => {
    const payload = { 
        userId: localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev', 
        appName: 'health_baseline', 
        stateData: baselineState 
    };
    
    try {
        await fetch('/api/state/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('[Health-baseline] AWS Cloud sync successful.');
    } catch (err) { 
        console.error('[Health-baseline] AWS Sync Error:', err); 
    }
};

// ============================================================================
// CONVERSION & MATH HELPERS 
// ============================================================================
const formatWeight = (kg, unit) => {
    if (!kg) return '';
    return unit === 'Imperial' ? `${(kg * 2.20462).toFixed(1)} lbs` : `${Number(kg).toFixed(1)} kg`;
};

const parseWeightToKg = (input, unit) => {
    if (!input) return 0;
    const val = parseFloat(String(input).replace(/[^\d.]/g, '')) || 0;
    return unit === 'Imperial' ? val * 0.453592 : val;
};

const calculateIdealWeightKg = (heightCm, gender) => {
    const inchesOver60 = Math.max(0, (heightCm / 2.54) - 60);
    const isMale = (gender || '').toLowerCase().startsWith('m');

    const robinson = isMale ? 52.0 + (1.9 * inchesOver60) : 49.0 + (1.7 * inchesOver60);
    const miller = isMale ? 56.2 + (1.41 * inchesOver60) : 53.1 + (1.36 * inchesOver60);
    const devine = isMale ? 50.0 + (2.3 * inchesOver60) : 45.5 + (2.3 * inchesOver60);
    const hamwi = isMale ? 48.0 + (2.7 * inchesOver60) : 45.5 + (2.2 * inchesOver60);

    const weights = [robinson, miller, devine, hamwi];
    return { minKg: Math.min(...weights), maxKg: Math.max(...weights), avgKg: (robinson + miller + devine + hamwi) / 4 };
};

const calculateHealthyRangeKg = (heightCm) => {
    const heightM = heightCm / 100;
    return { minKg: 18.5 * (heightM * heightM), maxKg: 25.0 * (heightM * heightM) };
};

const calculateTargetCalories = (age, gender, heightCm, weightKg, goalOffset) => {
    const isMale = (gender || '').toLowerCase().startsWith('m');
    const safeAge = parseInt(age) || 30;
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * safeAge);
    bmr += isMale ? 5 : -161;
    const maintain = Math.round(bmr * 1.2); 
    return Math.max(1000, maintain + goalOffset); // Safety floor of 1000 kcal
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

// ============================================================================
// COMPONENT FACTORY
// ============================================================================
export const createBaselineBlock = () => {
    const baselineBlock = document.createElement('div');
    Object.assign(baselineBlock.style, {
        backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
        padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px',
        fontFamily: 'sans-serif', fontSize: '13px', color: '#0f172a', marginBottom: '16px'
    });

    const renderBaseline = (isEditMode) => {
        baselineBlock.innerHTML = ''; 

        const pData = profileData || {};
        const hasBioData = pData.heightCm && pData.weightKg;
        const unitPref = pData.unitPreference || 'Imperial';
        
        // Ensure legacy goals are mapped correctly to universal keys
        baselineState.targetGoal = mapLegacyGoal(baselineState.targetGoal);

        // --- TOP HEADER ---
        const headerRow = document.createElement('div');
        Object.assign(headerRow.style, { display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' });
        
        const prefix = document.createElement('strong');
        prefix.innerText = 'Weight Baseline: ';
        prefix.style.marginRight = '16px';
        headerRow.appendChild(prefix);

        const makeReadField = (labelText, valText, hlColor = '#0f172a') => {
            const wrap = document.createElement('div');
            Object.assign(wrap.style, { display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', marginRight: '16px', marginBottom: '4px' });
            const lbl = document.createElement('span');
            lbl.innerText = labelText + " -";
            Object.assign(lbl.style, { color: '#475569', fontWeight: '500', marginRight: '6px' });
            const val = document.createElement('span');
            
            if (!valText || valText === '--') {
                val.innerText = '(--)';
                Object.assign(val.style, { color: '#94a3b8', fontWeight: 'bold' });
            } else {
                val.innerText = `(${valText})`;
                Object.assign(val.style, { color: hlColor, fontWeight: 'bold' });
            }
            
            wrap.appendChild(lbl); wrap.appendChild(val);
            return wrap;
        };

        const wrapContainer = (children) => {
            const wrap = document.createElement('div');
            Object.assign(wrap.style, { display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', marginRight: '16px', marginBottom: '4px' });
            children.forEach(c => wrap.appendChild(c));
            return wrap;
        };

        const makeLabel = (text) => {
            const lbl = document.createElement('span');
            lbl.innerText = text;
            Object.assign(lbl.style, { color: '#475569', fontWeight: '500', marginRight: '6px' });
            return lbl;
        };

        const makeInput = (val, width) => {
            const inp = document.createElement('input');
            inp.type = 'text'; inp.value = val;
            Object.assign(inp.style, { width: width, padding: '4px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' });
            return inp;
        };

        // Header Population
        const dateInput = makeInput(baselineState.startingDate || '', '110px');
        if (isEditMode) {
            headerRow.appendChild(wrapContainer([makeLabel('Starting Date -'), dateInput]));
            headerRow.appendChild(makeReadField('Starting Weight', hasBioData ? formatWeight(pData.weightKg, unitPref) : '--'));
            
            const actionBtn = document.createElement('button');
            actionBtn.innerText = '[Update]';
            Object.assign(actionBtn.style, { background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: 'auto' });
            
            headerRow.appendChild(actionBtn);
            
        } else {
            headerRow.appendChild(makeReadField('Starting Date', baselineState.startingDate || '--'));
            headerRow.appendChild(makeReadField('Starting Weight', hasBioData ? formatWeight(pData.weightKg, unitPref) : '--'));
            
            const actionBtn = document.createElement('button');
            actionBtn.innerText = '[Edit]';
            Object.assign(actionBtn.style, { background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: 'auto' });
            actionBtn.onclick = () => renderBaseline(true);
            headerRow.appendChild(actionBtn);
        }

        baselineBlock.appendChild(headerRow);

        // --- GRID SECTION ---
        const calcGrid = document.createElement('div');
        Object.assign(calcGrid.style, {
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
            backgroundColor: '#ffffff', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px'
        });

        // 1. Biological Anchors
        let idealWeightText = '(--)';
        let rangeText = '(--)';

        if (hasBioData) {
            const idealData = calculateIdealWeightKg(pData.heightCm, pData.gender);
            const { minKg, maxKg } = calculateHealthyRangeKg(pData.heightCm);

            const minIdealW = formatWeight(idealData.minKg, unitPref).replace(/ (lbs|kg)/, '');
            const maxIdealW = formatWeight(idealData.maxKg, unitPref);
            const avgIdealW = formatWeight(idealData.avgKg, unitPref);
            idealWeightText = `${minIdealW} - ${maxIdealW} (Avg: ${avgIdealW})`;

            rangeText = `${formatWeight(minKg, unitPref).replace(/ (lbs|kg)/, '')} - ${formatWeight(maxKg, unitPref)}`;
        }
        
        const anchorsCol = document.createElement('div');
        anchorsCol.innerHTML = `
            <div style="font-weight:bold; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">Biological Anchors</div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#475569;">Ideal Weight:</span> <strong style="color:${hasBioData ? '#0f172a' : '#94a3b8'}">${idealWeightText}</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span style="color:#475569;">Healthy Weight Range:</span> <strong style="color:${hasBioData ? '#0f172a' : '#94a3b8'}">${rangeText}</strong>
            </div>
        `;

        // 2. Current Goal & Targets
        const calsCol = document.createElement('div');
        const calsHeader = document.createElement('div');
        calsHeader.innerText = 'Current Goal & Targets';
        Object.assign(calsHeader.style, { fontWeight: 'bold', margin: '0 0 12px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', color: '#0ea5e9' });
        calsCol.appendChild(calsHeader);

        // Inputs required for Edit Mode saving
        let targetWeightInput, goalSelect, dynCalText;

        if (isEditMode) {
            // Edit Target Weight
            const targetWrap = document.createElement('div');
            Object.assign(targetWrap.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' });
            targetWrap.appendChild(makeLabel('Target Weight:'));
            
            const currentTargetVal = baselineState.targetWeightKg ? (unitPref === 'Imperial' ? (baselineState.targetWeightKg * 2.20462).toFixed(1) : Number(baselineState.targetWeightKg).toFixed(1)) : '';
            targetWeightInput = makeInput(currentTargetVal, '60px');
            targetWeightInput.style.textAlign = 'right';
            
            const tInpWrap = document.createElement('div');
            Object.assign(tInpWrap.style, { display: 'flex', alignItems: 'center' });
            tInpWrap.appendChild(targetWeightInput);
            
            // Cleanly create the label DOM element to prevent innerHTML string recreation from destroying the input reference
            const unitLblNode = document.createElement('span');
            unitLblNode.innerText = unitPref === 'Imperial' ? 'lbs' : 'kg';
            Object.assign(unitLblNode.style, { marginLeft: '6px', color: '#0f172a', fontSize: '13px', fontWeight: 'bold' });
            tInpWrap.appendChild(unitLblNode);
            
            targetWrap.appendChild(tInpWrap);
            calsCol.appendChild(targetWrap);

            // Edit Selected Goal
            const goalWrap = document.createElement('div');
            Object.assign(goalWrap.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' });
            goalWrap.appendChild(makeLabel('Selected Goal:'));
            
            goalSelect = document.createElement('select');
            Object.assign(goalSelect.style, { padding: '4px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', cursor: 'pointer' });
            
            GOAL_OPTIONS.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.id;
                o.innerText = unitPref === 'Imperial' ? opt.imp : opt.met;
                if (baselineState.targetGoal === opt.id) o.selected = true;
                goalSelect.appendChild(o);
            });
            goalWrap.appendChild(goalSelect);
            calsCol.appendChild(goalWrap);

            // Dynamic Calories Readout
            const calWrap = document.createElement('div');
            Object.assign(calWrap.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
            calWrap.appendChild(makeLabel('Target Daily Calories:'));
            
            dynCalText = document.createElement('strong');
            Object.assign(dynCalText.style, { color: '#0ea5e9' });
            dynCalText.innerText = baselineState.targetDailyCalories ? `${baselineState.targetDailyCalories} kcal` : '(--)';
            
            goalSelect.onchange = () => {
                if (hasBioData) {
                    const selGoal = GOAL_OPTIONS.find(g => g.id === goalSelect.value);
                    const newCals = calculateTargetCalories(pData.age, pData.gender, pData.heightCm, pData.weightKg, selGoal.offset);
                    dynCalText.innerText = `${newCals} kcal`;
                }
            };

            calWrap.appendChild(dynCalText);
            calsCol.appendChild(calWrap);

            // Attach Update Logic
            const updateBtn = headerRow.querySelector('button');
            updateBtn.onclick = async () => {
                baselineState.startingDate = dateInput.value.trim();
                
                // Read exact value from preserved input DOM element
                baselineState.targetWeightKg = parseWeightToKg(targetWeightInput.value, unitPref);
                
                const selGoalObj = GOAL_OPTIONS.find(g => g.id === goalSelect.value) || GOAL_OPTIONS[0];
                baselineState.targetGoal = selGoalObj.id;
                
                if (hasBioData) {
                    baselineState.targetDailyCalories = calculateTargetCalories(pData.age, pData.gender, pData.heightCm, pData.weightKg, selGoalObj.offset);
                }
                
                await syncBaselineToAWS();
                speakAmbient("Baseline updated.");
                renderBaseline(false);
            };

        } else {
            // Read-Only Goal Block
            const tWeightDisplay = baselineState.targetWeightKg ? formatWeight(baselineState.targetWeightKg, unitPref) : '(--)';
            const activeGoalObj = GOAL_OPTIONS.find(g => g.id === baselineState.targetGoal) || GOAL_OPTIONS[0];
            const displayGoalString = unitPref === 'Imperial' ? activeGoalObj.imp : activeGoalObj.met;

            calsCol.innerHTML += `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="color:#475569;">Target Weight:</span> <strong style="color:${baselineState.targetWeightKg ? '#0f172a' : '#94a3b8'}">${tWeightDisplay}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="color:#475569;">Selected Goal:</span> <strong style="color:${baselineState.targetGoal ? '#0f172a' : '#94a3b8'}">${baselineState.targetGoal ? displayGoalString : '(--)'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:#475569;">Target Daily Calories:</span> <strong style="color:${baselineState.targetDailyCalories ? '#0ea5e9' : '#94a3b8'}">${baselineState.targetDailyCalories ? `${baselineState.targetDailyCalories} kcal` : '(--)'}</strong>
                </div>
            `;
        }

        calcGrid.appendChild(anchorsCol);
        calcGrid.appendChild(calsCol);
        baselineBlock.appendChild(calcGrid);
    };

    const runBaselineOnboarding = async () => {
        const unitPref = (profileData && profileData.unitPreference) ? profileData.unitPreference : 'Imperial';
        
        baselineState.startingDate = baselineState.startingDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        if (!baselineState.targetWeightKg) {
            baselineState.targetWeightKg = calculateIdealWeightKg(profileData.heightCm, profileData.gender).avgKg;
        }

        const startW = formatWeight(profileData.weightKg, unitPref);
        const targetW = formatWeight(baselineState.targetWeightKg, unitPref);

        const chatWin = document.getElementById('tao-chatbox-window');
        if (chatWin && (chatWin.style.display === 'none' || chatWin.classList.contains('is-minimized'))) {
            if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
        }
        window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: true } }));

        // Step 1: Confirm Weights
        const summaryMessage = `Your Starting Weight is ${startW}, and your Target Weight is ${targetW}. Is this correct?`;
        const finalConfirmation = await askChatbox(summaryMessage, { choices: ['Yes', 'No'], expand: true });
        
        if (finalConfirmation.toLowerCase() === 'no') {
            if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX(); 
            window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: false } }));
            renderBaseline(true);
            speakAmbient("Please update your baseline values manually.");
            return;
        }

        // Step 2: Establish Weekly Goal (Using Universal Keys)
        const choiceMap = unitPref === 'Imperial' 
            ? { 'Maintain': 'maintain', 'Lose 0.5 lb/wk': 'lose_0.5', 'Lose 1.0 lb/wk': 'lose_1.0', 'Lose 2.0 lb/wk': 'lose_2.0', 'Gain 0.5 lb/wk': 'gain_0.5', 'Gain 1.0 lb/wk': 'gain_1.0' }
            : { 'Maintain': 'maintain', 'Lose 0.25 kg/wk': 'lose_0.5', 'Lose 0.5 kg/wk': 'lose_1.0', 'Lose 1.0 kg/wk': 'lose_2.0', 'Gain 0.25 kg/wk': 'gain_0.5', 'Gain 0.5 kg/wk': 'gain_1.0' };

        const chosenString = await askChatbox("What is your specific weekly goal?", { choices: Object.keys(choiceMap), expand: true });
        
        const selectedKey = choiceMap[chosenString] || 'maintain';
        const selGoalObj = GOAL_OPTIONS.find(g => g.id === selectedKey);

        baselineState.targetGoal = selectedKey;
        baselineState.targetDailyCalories = calculateTargetCalories(profileData.age, profileData.gender, profileData.heightCm, profileData.weightKg, selGoalObj.offset);
        baselineState.hasCompletedOnboarding = true;

        if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX(); 
        window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: false } }));

        await syncBaselineToAWS();
        renderBaseline(false);
    };

    const bootBaseline = async () => {
        try {
            const token = localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev';
            
            const profRes = await fetch(`/api/state/load?userId=${token}&appName=health_profile`);
            if (profRes.ok) {
                const profData = await profRes.json();
                if (profData && profData.state) profileData = profData.state;
            }

            const baseRes = await fetch(`/api/state/load?userId=${token}&appName=health_baseline`);
            if (baseRes.ok) {
                const dbData = await baseRes.json();
                if (dbData && dbData.state) {
                    Object.assign(baselineState, dbData.state);
                }
            }
        } catch (err) {
            console.warn('[Health-baseline] Initial AWS Load skipped or failed:', err);
        }

        renderBaseline(false);

        if (profileData && profileData.weightKg) {
            if (!baselineState.hasCompletedOnboarding || !baselineState.targetGoal) {
                setTimeout(() => runBaselineOnboarding(), 500); 
            }
        }
    };

    // Listen for Profile Updates (Unit toggles, biological changes)
    window.addEventListener('tao-profile-updated', async (e) => {
        if (e.detail && e.detail.profile) {
            profileData = e.detail.profile;
            if (baselineState.targetGoal && profileData.weightKg) {
                const activeGoalObj = GOAL_OPTIONS.find(g => g.id === baselineState.targetGoal) || GOAL_OPTIONS[0];
                baselineState.targetDailyCalories = calculateTargetCalories(profileData.age, profileData.gender, profileData.heightCm, profileData.weightKg, activeGoalObj.offset);
                syncBaselineToAWS(); 
            }
            renderBaseline(false);
        } else {
            await bootBaseline();
        }
    });

    bootBaseline();

    return baselineBlock;
};