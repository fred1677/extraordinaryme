/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/Health-baseline.js
 * 
 * DESCRIPTION: 
 * A decoupled Weight Baseline Component. Pulls static biological data from the 
 * Profile block to calculate Ideal Weight, BMI bounds, and Calorie targets. 
 * Renders full structural UI with null placeholders if profile is empty.
 * Listens for 'tao-profile-updated' to dynamically recalculate on the fly.
 * ============================================================================
 */

// ============================================================================
// INTERNAL STATE & AWS SYNC
// ============================================================================
const baselineState = {
    startingDate: '', 
    targetWeightKg: 0,
    hasCompletedOnboarding: false
};

let profileData = null; // Read-only anchor data from Health-profile

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

// Calculates Ideal Weight (Min, Max, and Average of Robinson, Miller, Devine, Hamwi)
const calculateIdealWeightKg = (heightCm, gender) => {
    const inchesOver60 = Math.max(0, (heightCm / 2.54) - 60);
    const isMale = (gender || '').toLowerCase().startsWith('m');

    const robinson = isMale ? 52.0 + (1.9 * inchesOver60) : 49.0 + (1.7 * inchesOver60);
    const miller = isMale ? 56.2 + (1.41 * inchesOver60) : 53.1 + (1.36 * inchesOver60);
    const devine = isMale ? 50.0 + (2.3 * inchesOver60) : 45.5 + (2.3 * inchesOver60);
    const hamwi = isMale ? 48.0 + (2.7 * inchesOver60) : 45.5 + (2.2 * inchesOver60);

    const weights = [robinson, miller, devine, hamwi];
    const minKg = Math.min(...weights);
    const maxKg = Math.max(...weights);
    const avgKg = (robinson + miller + devine + hamwi) / 4;

    return { minKg, maxKg, avgKg };
};

// Calculates Healthy BMI bounds (18.5 - 25.0)
const calculateHealthyRangeKg = (heightCm) => {
    const heightM = heightCm / 100;
    const minKg = 18.5 * (heightM * heightM);
    const maxKg = 25.0 * (heightM * heightM);
    return { minKg, maxKg };
};

// Calculates Mifflin-St Jeor Sedentary Maintenance & Targets
const calculateCalorieTargets = (age, gender, heightCm, weightKg) => {
    const isMale = (gender || '').toLowerCase().startsWith('m');
    const safeAge = parseInt(age) || 30;
    
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * safeAge);
    bmr += isMale ? 5 : -161;
    
    const maintain = Math.round(bmr * 1.2); // Sedentary multiplier
    return {
        maintain,
        mild: maintain - 250,
        loss: maintain - 500,
        extreme: maintain - 1000
    };
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

        // Safe Fallbacks if profile is missing
        const pData = profileData || {};
        const hasBioData = pData.heightCm && pData.weightKg;
        const unitPref = pData.unitPreference || 'Imperial';

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

        // UI Grid for Calculated Data
        const calcGrid = document.createElement('div');
        Object.assign(calcGrid.style, {
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
            backgroundColor: '#ffffff', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px'
        });

        // Top Row Data (Editable vs Read-Only)
        if (isEditMode) {
            const inputs = {};
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

            inputs.startDate = makeInput(baselineState.startingDate || '', '110px');
            headerRow.appendChild(wrapContainer([makeLabel('Starting Date -'), inputs.startDate]));
            
            // Starting weight is anchored to the profile, read-only
            headerRow.appendChild(makeReadField('Starting Weight', hasBioData ? formatWeight(pData.weightKg, unitPref) : '--'));

            // Extract numeric value to edit target weight cleanly
            const currentTargetVal = baselineState.targetWeightKg ? (unitPref === 'Imperial' 
                ? (baselineState.targetWeightKg * 2.20462).toFixed(1) 
                : Number(baselineState.targetWeightKg).toFixed(1)) : '';
            
            inputs.targetWeight = makeInput(currentTargetVal, '60px');
            const targetWrap = wrapContainer([makeLabel('Target Weight -'), inputs.targetWeight]);
            const targetUnitLbl = document.createElement('span'); 
            targetUnitLbl.innerText = unitPref === 'Imperial' ? ' lbs' : ' kg'; 
            targetUnitLbl.style.marginLeft = '4px';
            targetWrap.appendChild(targetUnitLbl);
            headerRow.appendChild(targetWrap);

            const actionBtn = document.createElement('button');
            actionBtn.innerText = '[Update]';
            Object.assign(actionBtn.style, {
                background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: 'auto'
            });

            actionBtn.onclick = async () => {
                baselineState.startingDate = inputs.startDate.value.trim();
                baselineState.targetWeightKg = parseWeightToKg(inputs.targetWeight.value, unitPref);
                
                await syncBaselineToAWS();
                speakAmbient("Baseline confirmed. The fields have been updated.");
                renderBaseline(false);
            };
            headerRow.appendChild(actionBtn);

        } else {
            headerRow.appendChild(makeReadField('Starting Date', baselineState.startingDate || '--'));
            headerRow.appendChild(makeReadField('Starting Weight', hasBioData ? formatWeight(pData.weightKg, unitPref) : '--'));
            headerRow.appendChild(makeReadField('Target Weight', baselineState.targetWeightKg ? formatWeight(baselineState.targetWeightKg, unitPref) : '--', '#0ea5e9'));

            const actionBtn = document.createElement('button');
            actionBtn.innerText = '[Edit]';
            Object.assign(actionBtn.style, {
                background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: 'auto'
            });

            actionBtn.onclick = () => {
                speakAmbient("Please update your starting date or target weight and press update to confirm.");
                renderBaseline(true); 
            };
            headerRow.appendChild(actionBtn);
        }

        baselineBlock.appendChild(headerRow);

        // Calculate and Format Biological Data
        let idealWeightText = '(--)';
        let rangeText = '(--)';
        let calStrings = { maintain: '(--)', mild: '(--)', loss: '(--)', extreme: '(--)' };

        if (hasBioData) {
            const idealData = calculateIdealWeightKg(pData.heightCm, pData.gender);
            const { minKg, maxKg } = calculateHealthyRangeKg(pData.heightCm);
            const calories = calculateCalorieTargets(pData.age, pData.gender, pData.heightCm, pData.weightKg);

            const minIdealW = formatWeight(idealData.minKg, unitPref).replace(/ (lbs|kg)/, '');
            const maxIdealW = formatWeight(idealData.maxKg, unitPref);
            const avgIdealW = formatWeight(idealData.avgKg, unitPref);
            idealWeightText = `${minIdealW} - ${maxIdealW} (Avg: ${avgIdealW})`;

            rangeText = `${formatWeight(minKg, unitPref).replace(/ (lbs|kg)/, '')} - ${formatWeight(maxKg, unitPref)}`;

            calStrings = {
                maintain: `${calories.maintain} kcal`,
                mild: `${calories.mild} kcal`,
                loss: `${calories.loss} kcal`,
                extreme: `${calories.extreme} kcal`
            };
        }
        
        // Calculated Ideal/Healthy Weight Block
        const anchorsCol = document.createElement('div');
        anchorsCol.innerHTML = `
            <div style="font-weight:bold; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">Biological Anchors</div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#475569;">Ideal Weight:</span> <strong style="color:${hasBioData ? '#0f172a' : '#94a3b8'}">${idealWeightText}</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span style="color:#475569;">Healthy Weight Range:</span> <strong style="color:${hasBioData ? '#0f172a' : '#94a3b8'}">${rangeText}</strong>
            </div>
        `;

        // Calorie Targets
        const calsCol = document.createElement('div');
        calsCol.innerHTML = `
            <div style="font-weight:bold; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">Daily Calorie Targets (Sedentary)</div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#475569;">Maintain Weight:</span> <strong style="color:${hasBioData ? '#0f172a' : '#94a3b8'}">${calStrings.maintain}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#475569;">Mild Loss (0.5 lb/wk):</span> <strong style="color:${hasBioData ? '#0f172a' : '#94a3b8'}">${calStrings.mild}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#475569;">Weight Loss (1.0 lb/wk):</span> <strong style="color:${hasBioData ? '#0f172a' : '#94a3b8'}">${calStrings.loss}</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span style="color:#475569;">Extreme Loss (2.0 lb/wk):</span> <strong style="color:${hasBioData ? '#0f172a' : '#94a3b8'}">${calStrings.extreme}</strong>
            </div>
        `;

        calcGrid.appendChild(anchorsCol);
        calcGrid.appendChild(calsCol);
        baselineBlock.appendChild(calcGrid);
    };

    const runBaselineOnboarding = async () => {
        // Automatically crunch defaults
        baselineState.startingDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        // Set the default target to the calculated average of the 4 formulas
        baselineState.targetWeightKg = calculateIdealWeightKg(profileData.heightCm, profileData.gender).avgKg;
        baselineState.hasCompletedOnboarding = true;

        const unitPref = profileData.unitPreference || 'Imperial';
        const startW = formatWeight(profileData.weightKg, unitPref);
        const targetW = formatWeight(baselineState.targetWeightKg, unitPref);

        const chatWin = document.getElementById('tao-chatbox-window');
        if (chatWin && (chatWin.style.display === 'none' || chatWin.classList.contains('is-minimized'))) {
            if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
        }

        window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: true } }));

        const summaryMessage = `I have calculated your baseline. Your Starting Weight is ${startW}, and your recommended Target Weight is ${targetW}. Is this correct?`;
        
        const finalConfirmation = await askChatbox(summaryMessage, { choices: ['Yes', 'No'], expand: true });

        if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX(); 
        window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: false } }));

        await syncBaselineToAWS();

        if (finalConfirmation.toLowerCase() === 'yes') {
            renderBaseline(false); 
        } else {
            renderBaseline(true); 
            speakAmbient("Please update your starting date or target weight and press update to confirm.");
        }
    };

    // 🚀 INTERNAL BOOT SEQUENCE (Wrapped into a callable function)
    const bootBaseline = async () => {
        try {
            const token = localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev';
            
            // 1. Fetch read-only Profile Data required for calculations
            const profRes = await fetch(`/api/state/load?userId=${token}&appName=health_profile`);
            if (profRes.ok) {
                const profData = await profRes.json();
                if (profData && profData.state) profileData = profData.state;
            }

            // 2. Fetch the Baseline State
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

        // Check if onboarding needs to be triggered
        if (profileData && profileData.weightKg && !baselineState.hasCompletedOnboarding) {
            setTimeout(runBaselineOnboarding, 500); 
        }
    };

    // Listen for the custom event to recalculate whenever the profile updates
    window.addEventListener('tao-profile-updated', bootBaseline);

    // Initial load
    bootBaseline();

    // Synchronously returns the HTML layout structure
    return baselineBlock;
};