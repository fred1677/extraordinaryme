/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/Health-snapshot.js
 * 
 * DESCRIPTION:
 * Clinical-Grade Snapshot Engine. Aggregates decoupled ledgers, audits 
 * daily nutrition against demographic baselines, and generates a PDF dossier.
 * ============================================================================
 */

// FIX: Pointing one directory up to the 'galaxy' folder
import { getTodayStr } from '../check-today.js';
import { getBaseline } from './nutrition-baselines.js';

// Helper: Dynamically load html2pdf only when requested
const loadPDFLibrary = () => {
    return new Promise((resolve) => {
        if (window.html2pdf) return resolve(window.html2pdf);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve(window.html2pdf);
        document.head.appendChild(script);
    });
};

const formatWeight = (kg, unit) => {
    if (!kg) return '';
    return unit === 'Imperial' ? `${(kg * 2.20462).toFixed(1)} lbs` : `${Number(kg).toFixed(1)} kg`;
};

// Math Helper: Extract first number from baseline string (e.g. "1,000 mg" -> 1000, "19 - 34 g" -> 19)
const parseBaselineNum = (str) => {
    if (!str) return 0;
    const match = str.replace(/,/g, '').match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
};

// Math Helper: Sleep duration
const timeToMinutes = (timeStr) => {
    if (!timeStr || timeStr === 'Skipped') return null;
    const parts = timeStr.split(' ');
    if (parts.length < 2) return null;
    let [hh, mm] = parts[0].split(':').map(Number);
    if (isNaN(hh) || isNaN(mm)) return null;
    if (parts[1] === 'PM' && hh !== 12) hh += 12;
    if (parts[1] === 'AM' && hh === 12) hh = 0;
    return (hh * 60) + mm;
};

const calculateSleepDuration = (sleepStr, wakeStr) => {
    const sleep = timeToMinutes(sleepStr);
    const wake = timeToMinutes(wakeStr);
    if (sleep === null || wake === null) return null;
    let duration = sleep > wake ? (1440 - sleep) + wake : wake - sleep;
    return duration;
};

export async function executeSnapshot(parentWindow) {
    if (!parentWindow || parentWindow.querySelector('.tao-health-snapshot-overlay')) return;

    // --- 1. UI: Flash Effect & Overlay ---
    const flash = document.createElement('div');
    Object.assign(flash.style, {
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: '#ffffff', zIndex: '100000', pointerEvents: 'none', transition: 'opacity 0.4s ease-out'
    });
    parentWindow.appendChild(flash);
    setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 400); }, 50);

    const overlay = document.createElement('div');
    overlay.classList.add('tao-health-snapshot-overlay');
    Object.assign(overlay.style, {
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '99999', 
        padding: '24px', boxSizing: 'border-box'
    });
    
    // --- 2. DATA GATHERING ---
    const token = localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev';
    const endpoints = ['health_profile', 'health_baseline', 'health_dailyweight', 'health_wakesleep', 'health_vitals', 'health_meals', 'health_exercise'];
    
    // Fetch all ledgers concurrently
    const responses = await Promise.all(endpoints.map(ep => fetch(`/api/state/load?userId=${token}&appName=${ep}`).catch(() => null)));
    const data = await Promise.all(responses.map(res => res && res.ok ? res.json() : { state: {} }));
    
    const [profDB, baseDB, weightDB, sleepDB, vitalsDB, mealsDB, exerciseDB] = data.map(d => d.state || {});
    
    const today = getTodayStr();
    let yesterdayDate = new Date(today + 'T00:00:00');
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    // --- 3. DATA PROCESSING ---
    const unitPref = profDB.unitPreference || 'Imperial';
    const age = profDB.age || 30;
    const sex = profDB.gender || 'Female';
    const rda = getBaseline(age, sex);

    // Sleep Math
    const prevSleep = sleepDB[yesterday]?.sleepTime;
    const todayWake = sleepDB[today]?.wakeTime;
    const sleepMins = calculateSleepDuration(prevSleep, todayWake);
    const sleepText = sleepMins !== null ? `${Math.floor(sleepMins / 60)} hr ${sleepMins % 60} min` : 'Not tracked yet';

    // Weight Math: Find Last Known Morning Weight
    let lastMorningWeight = null;
    let weightLookupDate = today;
    for (let i = 0; i < 7; i++) {
        if (weightDB[weightLookupDate]?.morningWeightKg) {
            lastMorningWeight = weightDB[weightLookupDate].morningWeightKg;
            break;
        }
        let d = new Date(weightLookupDate + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        weightLookupDate = d.toISOString().split('T')[0];
    }
    
    const yestWeight = weightDB[yesterday]?.morningWeightKg;
    const diffText = (lastMorningWeight && yestWeight) ? 
        (lastMorningWeight > yestWeight ? `+${formatWeight(lastMorningWeight - yestWeight, unitPref)}` : `${formatWeight(lastMorningWeight - yestWeight, unitPref)}`) : 'No prev data';
    
    const targetKg = baseDB.targetWeightKg;
    const toTargetText = (!lastMorningWeight || !targetKg) ? "(Not tracked yet)" : formatWeight(Math.abs(lastMorningWeight - targetKg), unitPref);

    // Nutrition Aggregation
    const aggNut = {};
    const todayMeals = mealsDB[today]?.active || [];
    todayMeals.forEach(m => {
        if (!m.nutrition) return;
        Object.keys(m.nutrition).forEach(key => {
            if (!aggNut[key]) aggNut[key] = 0;
            aggNut[key] += (parseFloat(m.nutrition[key]) || 0);
        });
    });

    // --- 4. MODAL UI CONSTRUCTION ---
    const modal = document.createElement('div');
    Object.assign(modal.style, {
        backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '850px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
    });

    // Header Area
    const header = document.createElement('div');
    Object.assign(header.style, {
        padding: '20px 24px', backgroundColor: '#0f172a', color: '#ffffff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: '0'
    });
    header.innerHTML = `<div>
        <h2 style="margin:0; font-size:20px; font-family:sans-serif;">Daily Health Dossier</h2>
        <span style="font-size:13px; color:#94a3b8;">${new Date(today + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
    </div>`;

    const btnWrap = document.createElement('div');
    btnWrap.style.display = 'flex'; btnWrap.style.gap = '12px';
    
    const pdfBtn = document.createElement('button');
    pdfBtn.innerText = "Export PDF";
    Object.assign(pdfBtn.style, { backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' });
    
    const closeBtn = document.createElement('button');
    closeBtn.innerText = "Close";
    Object.assign(closeBtn.style, { backgroundColor: '#334155', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' });
    closeBtn.onclick = () => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 200); };
    
    btnWrap.append(pdfBtn, closeBtn);
    header.appendChild(btnWrap);

    // Scrollable Content
    const content = document.createElement('div');
    content.id = 'tao-pdf-content';
    Object.assign(content.style, { padding: '32px', overflowY: 'auto', backgroundColor: '#ffffff', color: '#0f172a', fontFamily: 'sans-serif' });

    const makeSection = (title) => {
        const wrap = document.createElement('div');
        wrap.style.marginBottom = '24px';
        wrap.innerHTML = `<h3 style="margin: 0 0 12px 0; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; color:#0ea5e9; font-size:16px; text-transform:uppercase;">${title}</h3>`;
        return wrap;
    };

    // SECTION 1: Profile & Baseline
    const secProfile = makeSection('1. Biological Profile & Anchors');
    secProfile.innerHTML += `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:13px;">
            <div><strong>Name:</strong> ${profDB.firstName || 'User'} ${profDB.lastName || ''}</div>
            <div><strong>Demographic:</strong> ${age} yr old ${sex}</div>
            <div><strong>Starting Date:</strong> ${baseDB.startingDate || '--'}</div>
            <div><strong>Starting Weight:</strong> ${profDB.weightKg ? formatWeight(profDB.weightKg, unitPref) : '--'}</div>
            <div><strong>Target Weight:</strong> ${targetKg ? formatWeight(targetKg, unitPref) : '--'}</div>
            <div><strong>Current Goal:</strong> ${baseDB.targetGoal || 'Maintain'}</div>
        </div>
    `;
    content.appendChild(secProfile);

    // SECTION 2: Daily Stats
    const secStats = makeSection('2. Daily High-Level Stats');
    
    const vitalsActive = vitalsDB[today]?.active || [];
    const vitalsList = vitalsActive.length > 0 ? vitalsActive.map(v => {
        let vVal = v.type === 'Blood Pressure' ? `${v.value?.sys || '--'}/${v.value?.dia || '--'}` : v.value;
        return `<li><strong>${v.type === 'Custom' ? v.customName : v.type}:</strong> ${vVal}</li>`;
    }).join('') : '<li>None tracked today</li>';

    const exText = exerciseDB[today]?.text || 'No exercise logged today.';

    secStats.innerHTML += `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; font-size:13px;">
            <div style="background:#f8fafc; padding:16px; border-radius:8px; border:1px solid #e2e8f0;">
                <h4 style="margin:0 0 8px 0; color:#0f172a;">Weight & Sleep</h4>
                <div style="margin-bottom:4px;"><strong>Morning Weight:</strong> ${lastMorningWeight ? formatWeight(lastMorningWeight, unitPref) : '(--)'}</div>
                <div style="margin-bottom:4px;"><strong>Diff from Yesterday:</strong> ${diffText}</div>
                <div style="margin-bottom:12px;"><strong>Remaining to Target:</strong> ${toTargetText}</div>
                <div style="margin-bottom:4px;"><strong>Hours Slept:</strong> ${sleepText}</div>
            </div>
            <div style="background:#f8fafc; padding:16px; border-radius:8px; border:1px solid #e2e8f0;">
                <h4 style="margin:0 0 8px 0; color:#0f172a;">Vitals & Exercise</h4>
                <ul style="margin:0 0 12px 0; padding-left:20px;">${vitalsList}</ul>
                <strong>Exercise:</strong> <div style="font-style:italic; margin-top:4px; white-space:pre-wrap;">${exText}</div>
            </div>
        </div>
    `;
    content.appendChild(secStats);

    // SECTION 3: Deficiencies & Macros
    const secNutrition = makeSection('3. Clinical Nutritional Audit');
    
    const targetCals = baseDB.targetDailyCalories || parseBaselineNum(rda.macros.Calories);
    const consumedCals = aggNut['Calories'] || aggNut['calories'] || 0;
    const calDiff = consumedCals - targetCals;
    const calStatus = calDiff > 0 ? `<span style="color:#ef4444; font-weight:bold;">Over by ${Math.abs(calDiff).toFixed(0)} kcal</span>` : `<span style="color:#10b981; font-weight:bold;">Under by ${Math.abs(calDiff).toFixed(0)} kcal</span>`;

    const deficiencyList = [];
    const checkNutrient = (name, consumed, targetStr) => {
        const targetNum = parseBaselineNum(targetStr);
        if (consumed < targetNum) deficiencyList.push(`<strong>${name}</strong> (Need ${Math.abs(targetNum - consumed).toFixed(1)} more)`);
    };

    // Calculate Deficiencies against RDA
    Object.keys(rda.vitamins).forEach(k => checkNutrient(k.replace('_', ' '), aggNut[k] || 0, rda.vitamins[k]));
    Object.keys(rda.minerals).forEach(k => checkNutrient(k, aggNut[k] || 0, rda.minerals[k]));

    const defDisplay = deficiencyList.length > 0 ? deficiencyList.join(', ') : '<span style="color:#10b981;">All baseline targets met!</span>';

    secNutrition.innerHTML += `
        <div style="margin-bottom:16px; font-size:13px; display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div style="background:#fff7ed; padding:12px; border-left:4px solid #f97316; border-radius:4px;">
                <strong>Calorie Target (${targetCals} kcal):</strong> ${calStatus}
            </div>
            <div style="background:#fef2f2; padding:12px; border-left:4px solid #ef4444; border-radius:4px;">
                <strong>Deficiency Alert (Lacking Today):</strong><br/> ${defDisplay}
            </div>
        </div>
    `;

    // EXPANDABLE DETAILED TABLES
    const expandBtn = document.createElement('button');
    expandBtn.innerText = "▶ Expand Detailed Clinical Tables";
    Object.assign(expandBtn.style, { background:'none', border:'none', color:'#0ea5e9', cursor:'pointer', fontWeight:'bold', fontSize:'13px', padding:'0', marginBottom:'16px' });
    
    const tableWrap = document.createElement('div');
    tableWrap.style.display = 'none'; // Hidden by default

    const generateTable = (title, dataObj, aggData) => {
        let html = `<h4 style="margin:16px 0 8px 0;">${title}</h4><table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:16px;">
        <tr style="background:#f1f5f9; text-align:left;"><th style="padding:8px; border:1px solid #cbd5e1;">Nutrient</th><th style="padding:8px; border:1px solid #cbd5e1;">Target (RDA)</th><th style="padding:8px; border:1px solid #cbd5e1;">Intake</th><th style="padding:8px; border:1px solid #cbd5e1;">Status</th></tr>`;
        
        Object.keys(dataObj).forEach(key => {
            const targetStr = dataObj[key];
            const targetNum = parseBaselineNum(targetStr);
            const intake = aggData[key] || aggData[key.toLowerCase()] || 0;
            const status = intake >= targetNum ? `<span style="color:#10b981; font-weight:bold;">[Met]</span>` : `<span style="color:#ef4444; font-weight:bold;">[Need ${(targetNum - intake).toFixed(1)}]</span>`;
            
            html += `<tr><td style="padding:8px; border:1px solid #cbd5e1;">${key.replace('_', ' ')}</td><td style="padding:8px; border:1px solid #cbd5e1;">${targetStr}</td><td style="padding:8px; border:1px solid #cbd5e1;">${intake.toFixed(1)}</td><td style="padding:8px; border:1px solid #cbd5e1;">${status}</td></tr>`;
        });
        return html + `</table>`;
    };

    tableWrap.innerHTML += generateTable('Macronutrients', rda.macros, aggNut);
    tableWrap.innerHTML += generateTable('Essential Vitamins', rda.vitamins, aggNut);
    tableWrap.innerHTML += generateTable('Essential Minerals', rda.minerals, aggNut);

    expandBtn.onclick = () => {
        const isHidden = tableWrap.style.display === 'none';
        tableWrap.style.display = isHidden ? 'block' : 'none';
        expandBtn.innerText = isHidden ? "▼ Hide Detailed Clinical Tables" : "▶ Expand Detailed Clinical Tables";
    };

    secNutrition.appendChild(expandBtn);
    secNutrition.appendChild(tableWrap);
    content.appendChild(secNutrition);

    // --- 5. PDF EXPORT LOGIC ---
    pdfBtn.onclick = async () => {
        pdfBtn.innerText = "Generating PDF...";
        tableWrap.style.display = 'block'; // Force expand for PDF
        expandBtn.style.display = 'none';  // Hide the button from the PDF

        const html2pdf = await loadPDFLibrary();
        
        const opt = {
            margin:       0.5,
            filename:     `Health_Dossier_${today}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(content).save();
        
        pdfBtn.innerText = "Export PDF";
        expandBtn.style.display = 'block'; // Restore UI
    };

    modal.appendChild(header);
    modal.appendChild(content);
    overlay.appendChild(modal);
    parentWindow.appendChild(overlay);
    
    // Fade in
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => overlay.style.opacity = '1', 10);
}