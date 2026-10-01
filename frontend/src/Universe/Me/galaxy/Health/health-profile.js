/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/Health-profile.js
 * 
 * DESCRIPTION: 
 * A fully decoupled, self-contained Profile Component. 
 * Manages its own state, AWS Load/Sync, Chatbox Onboarding, and UI Rendering.
 * Broadcasts 'tao-profile-updated' so dependent blocks dynamically re-render.
 * ============================================================================
 */

// ============================================================================
// INTERNAL STATE & AWS SYNC
// ============================================================================
const profileState = {
    name: window.TAO_USER_CONFIG?.username || 'Explorer',
    age: '',
    gender: '',
    unitPreference: '', 
    heightCm: 0, 
    weightKg: 0  
};

const syncProfileToAWS = async () => {
    const payload = { 
        userId: localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev', 
        appName: 'health_profile', // Dedicated database storage box
        stateData: profileState 
    };
    
    try {
        await fetch('/api/state/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('[Health-profile] AWS Cloud sync successful.');
    } catch (err) { 
        console.error('[Health-profile] AWS Sync Error:', err); 
    }
};

// ============================================================================
// CONVERSION & PARSING HELPERS 
// ============================================================================
const parseHeightToCm = (input, unit) => {
    if (!input) return 0;
    if (unit === 'Imperial') {
        const match = String(input).match(/(\d+)\s*(?:'|ft|feet|f)?\s*([\d.]*)\s*(?:"|in|inches|i)?/i);
        if (match) {
            const ft = parseInt(match[1]) || 0;
            const inch = parseFloat(match[2]) || 0;
            return (ft * 30.48) + (inch * 2.54);
        }
    }
    return parseFloat(String(input).replace(/[^\d.]/g, '')) || 0;
};

const parseWeightToKg = (input, unit) => {
    if (!input) return 0;
    const val = parseFloat(String(input).replace(/[^\d.]/g, '')) || 0;
    return unit === 'Imperial' ? val * 0.453592 : val;
};

const getDisplayHeight = (cm, unit) => {
    if (!cm) return unit === 'Imperial' ? { ft: '', in: '' } : { cm: '' };
    if (unit === 'Imperial') {
        const totalInches = cm / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inch = totalInches % 12;
        return { ft, in: Number(inch.toFixed(1)) };
    }
    return { cm: Number(cm.toFixed(1)) };
};

const getDisplayWeight = (kg, unit) => {
    if (!kg) return '';
    return unit === 'Imperial' ? Number((kg * 2.20462).toFixed(1)) : Number(kg.toFixed(1));
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
export const createProfileBlock = () => {
    const profileBlock = document.createElement('div');
    Object.assign(profileBlock.style, {
        backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
        padding: '16px 24px', display: 'flex', alignItems: 'center', flexWrap: 'wrap',
        fontFamily: 'sans-serif', fontSize: '13px', color: '#0f172a', marginBottom: '8px', flexShrink: '0'
    });

    const renderProfile = (isEditMode) => {
        profileBlock.innerHTML = ''; 

        const prefix = document.createElement('strong');
        prefix.innerText = 'Profile: ';
        prefix.style.marginRight = '8px';
        profileBlock.appendChild(prefix);

        const makeReadField = (labelText, valText) => {
            const wrap = document.createElement('div');
            Object.assign(wrap.style, { display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', marginRight: '16px', marginBottom: '4px' });
            const lbl = document.createElement('span');
            lbl.innerText = labelText + " -";
            Object.assign(lbl.style, { color: '#475569', fontWeight: '500', marginRight: '6px' });
            const val = document.createElement('span');
            val.innerText = `(${valText || ' '})`;
            Object.assign(val.style, { color: valText ? '#0f172a' : '#94a3b8', fontWeight: 'bold' });
            wrap.appendChild(lbl); wrap.appendChild(val);
            return wrap;
        };

        if (isEditMode) {
            const inputs = {};
            const isMetric = profileState.unitPreference === 'Metric';

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

            // Inputs mapping
            inputs.name = makeInput(profileState.name || '', '90px');
            profileBlock.appendChild(wrapContainer([makeLabel('Name -'), inputs.name]));

            inputs.age = makeInput(profileState.age || '', '40px');
            profileBlock.appendChild(wrapContainer([makeLabel('Age -'), inputs.age]));

            const genderSel = document.createElement('select');
            ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'].forEach(g => {
                const opt = document.createElement('option');
                opt.value = g; opt.innerText = g;
                const current = (profileState.gender || '').toLowerCase();
                if (current === g.toLowerCase() || (current === 'm' && g === 'Male') || (current === 'f' && g === 'Female')) opt.selected = true;
                genderSel.appendChild(opt);
            });
            Object.assign(genderSel.style, { padding: '4px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', cursor: 'pointer' });
            inputs.gender = genderSel;
            profileBlock.appendChild(wrapContainer([makeLabel('Gender -'), inputs.gender]));

            const unitSel = document.createElement('select');
            ['Imperial', 'Metric'].forEach(u => {
                const opt = document.createElement('option');
                opt.value = u; opt.innerText = u;
                if ((profileState.unitPreference || 'Imperial') === u) opt.selected = true;
                unitSel.appendChild(opt);
            });
            Object.assign(unitSel.style, { padding: '4px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', cursor: 'pointer' });
            inputs.unitPreference = unitSel;
            profileBlock.appendChild(wrapContainer([makeLabel('Units -'), inputs.unitPreference]));

            const heightWrap = document.createElement('div');
            Object.assign(heightWrap.style, { display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', marginRight: '16px', marginBottom: '4px' });
            heightWrap.appendChild(makeLabel('Height -'));
            
            const dispHeight = getDisplayHeight(profileState.heightCm, profileState.unitPreference);
            if (isMetric) {
                inputs.heightCm = makeInput(dispHeight.cm, '60px'); 
                heightWrap.appendChild(inputs.heightCm);
                const cmLbl = document.createElement('span'); cmLbl.innerText = ' cm'; cmLbl.style.marginLeft = '4px';
                heightWrap.appendChild(cmLbl);
            } else {
                inputs.heightFt = makeInput(dispHeight.ft, '30px');
                heightWrap.appendChild(inputs.heightFt);
                const ftLbl = document.createElement('span'); ftLbl.innerText = ' ft'; Object.assign(ftLbl.style, { marginLeft: '4px', marginRight: '6px' });
                heightWrap.appendChild(ftLbl);
                inputs.heightIn = makeInput(dispHeight.in, '40px'); 
                heightWrap.appendChild(inputs.heightIn);
                const inLbl = document.createElement('span'); inLbl.innerText = ' in'; inLbl.style.marginLeft = '4px';
                heightWrap.appendChild(inLbl);
            }
            profileBlock.appendChild(heightWrap);

            const dispWeight = getDisplayWeight(profileState.weightKg, profileState.unitPreference);
            inputs.weight = makeInput(dispWeight, '55px'); 
            const weightWrap = wrapContainer([makeLabel('Weight -'), inputs.weight]);
            const weightLbl = document.createElement('span'); weightLbl.innerText = isMetric ? ' kg' : ' lbs'; weightLbl.style.marginLeft = '4px';
            weightWrap.appendChild(weightLbl);
            profileBlock.appendChild(weightWrap);

            unitSel.onchange = () => {
                profileState.name = inputs.name.value.trim();
                profileState.age = inputs.age.value.trim();
                profileState.gender = inputs.gender.value;
                if (profileState.unitPreference === 'Imperial') {
                    profileState.heightCm = ((parseFloat(inputs.heightFt.value) || 0) * 30.48) + ((parseFloat(inputs.heightIn.value) || 0) * 2.54);
                    profileState.weightKg = (parseFloat(inputs.weight.value) || 0) * 0.453592;
                } else {
                    profileState.heightCm = parseFloat(inputs.heightCm.value) || 0;
                    profileState.weightKg = parseFloat(inputs.weight.value) || 0;
                }
                profileState.unitPreference = unitSel.value;
                renderProfile(true); 
            };

            const actionBtn = document.createElement('button');
            actionBtn.innerText = '[Update]';
            Object.assign(actionBtn.style, {
                background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: 'auto', marginBottom: '4px'
            });

            actionBtn.onclick = async () => {
                let nameChanged = (inputs.name.value.trim() !== profileState.name);
                profileState.name = inputs.name.value.trim();
                profileState.age = inputs.age.value.trim();
                profileState.gender = inputs.gender.value;
                
                if (profileState.unitPreference === 'Imperial') {
                    profileState.heightCm = ((parseFloat(inputs.heightFt.value) || 0) * 30.48) + ((parseFloat(inputs.heightIn.value) || 0) * 2.54);
                    profileState.weightKg = (parseFloat(inputs.weight.value) || 0) * 0.453592;
                } else {
                    profileState.heightCm = parseFloat(inputs.heightCm.value) || 0;
                    profileState.weightKg = parseFloat(inputs.weight.value) || 0;
                }
                
                if (nameChanged && window.TAO_USER_CONFIG) window.TAO_USER_CONFIG.username = profileState.name;
                
                await syncProfileToAWS();
                window.dispatchEvent(new CustomEvent('tao-profile-updated')); 
                speakAmbient("Profile confirmed. The fields have been updated.");
                renderProfile(false);
            };
            profileBlock.appendChild(actionBtn);

        } else {
            const p = profileState;
            const isMetric = p.unitPreference === 'Metric';
            
            profileBlock.appendChild(makeReadField('Name', p.name));
            profileBlock.appendChild(makeReadField('Age', p.age));
            profileBlock.appendChild(makeReadField('Gender', p.gender));
            profileBlock.appendChild(makeReadField('Units', p.unitPreference || 'Imperial'));
            
            let hVal = '';
            if (p.heightCm) {
                if (isMetric) hVal = `${Number(p.heightCm).toFixed(1)} cm`;
                else {
                    const imp = getDisplayHeight(p.heightCm, 'Imperial');
                    hVal = `${imp.ft} ft ${Number(imp.in).toFixed(1)} in`;
                }
            }
            profileBlock.appendChild(makeReadField('Height', hVal));
            
            let wVal = '';
            if (p.weightKg) {
                if (isMetric) wVal = `${Number(p.weightKg).toFixed(1)} kg`;
                else wVal = `${Number(getDisplayWeight(p.weightKg, 'Imperial')).toFixed(1)} lbs`;
            }
            profileBlock.appendChild(makeReadField('Weight', wVal));

            const actionBtn = document.createElement('button');
            actionBtn.innerText = '[Edit]';
            Object.assign(actionBtn.style, {
                background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '13px', padding: '0', marginLeft: 'auto', marginBottom: '4px'
            });

            actionBtn.onclick = () => {
                speakAmbient("Please update the fields you want and press update to confirm.");
                renderProfile(true); 
            };
            profileBlock.appendChild(actionBtn);
        }
    };

    const runProfileOnboarding = async () => {
        const p = profileState;
        const chatWin = document.getElementById('tao-chatbox-window');
        if (chatWin && (chatWin.style.display === 'none' || chatWin.classList.contains('is-minimized'))) {
            if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
        }

        window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: true } }));

        const age = await askChatbox(`Hi ${p.name || 'Explorer'}, what is your age?`, { waitForInput: true });
        const gender = await askChatbox(`What is your gender?`, { waitForInput: true });
        const units = await askChatbox(`For the next few fields, do you want to enter Metric or Imperial format?`, { choices: ['Imperial', 'Metric'] });
        
        const isMetric = units.toLowerCase() === 'metric';
        const hPrompt = isMetric ? `What is your height in centimeters?` : `What is your height in feet and inches? (e.g. 5 feet 7.5)`;
        const rawHeight = await askChatbox(hPrompt, { waitForInput: true });
        
        const wPrompt = isMetric ? `What is your current weight in kg?` : `What is your current weight in lbs?`;
        const rawWeight = await askChatbox(wPrompt, { waitForInput: true });

        const pref = isMetric ? 'Metric' : 'Imperial';
        const heightCm = parseHeightToCm(rawHeight, pref);
        const weightKg = parseWeightToKg(rawWeight, pref);

        const dispH = isMetric ? `${Number(heightCm).toFixed(1)} cm` : `${getDisplayHeight(heightCm, 'Imperial').ft} ft ${Number(getDisplayHeight(heightCm, 'Imperial').in).toFixed(1)} in`;
        const dispW = isMetric ? `${Number(weightKg).toFixed(1)} kg` : `${Number(getDisplayWeight(weightKg, 'Imperial')).toFixed(1)} lbs`;

        const summaryMessage = `Got it. Your profile:\nAge: ${age}\nGender: ${gender}\nUnits: ${pref}\nHeight: ${dispH}\nWeight: ${dispW}\n\nIs this correct?`;
        
        const finalConfirmation = await askChatbox(summaryMessage, { choices: ['Yes', 'No'], expand: true });

        if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX(); 
        window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: false } }));

        profileState.age = age;
        profileState.gender = gender;
        profileState.unitPreference = pref;
        profileState.heightCm = heightCm;
        profileState.weightKg = weightKg;

        await syncProfileToAWS();

        if (finalConfirmation.toLowerCase() === 'yes') {
            window.dispatchEvent(new CustomEvent('tao-profile-updated')); 
            renderProfile(false); 
        } else {
            renderProfile(true); 
            speakAmbient("Please update the incorrect fields and press update to confirm.");
        }
    };

    // 🚀 INTERNAL BOOT SEQUENCE: Fetch data, render, and check onboarding immediately
    (async () => {
        try {
            const token = localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev';
            const res = await fetch(`/api/state/load?userId=${token}&appName=health_profile`);
            if (res.ok) {
                const dbData = await res.json();
                if (dbData && dbData.state) {
                    Object.assign(profileState, dbData.state);
                }
            }
        } catch (err) {
            console.warn('[Health-profile] Initial AWS Load skipped or failed:', err);
        }

        renderProfile(false);

        // Check if vital profile data is missing to trigger onboarding
        if (!profileState.age || (!profileState.heightCm && !profileState.weightKg) || !profileState.gender || !profileState.unitPreference) {
            setTimeout(runProfileOnboarding, 500); 
        }
    })();

    // Synchronously returns the HTML layout structure so Health.js can immediately mount it
    return profileBlock;
};