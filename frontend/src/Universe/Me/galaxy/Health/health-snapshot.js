/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/Health-snapshot.js
 * 
 * DESCRIPTION:
 * Clinical-Grade Snapshot Engine.
 * DELEGATES window physics and Top Bar button injection strictly to the OS Window Manager.
 * ============================================================================
 */

import { getTodayStr } from '../check-today.js';
import { getBaseline } from './nutrition-baselines.js';

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

const parseBaselineNum = (str) => {
    if (!str) return 0;
    const match = str.replace(/,/g, '').match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
};

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

export async function executeSnapshot() {

    // --- 1. DATA GATHERING ---
    const token = localStorage.getItem('TAO_SESSION_TOKEN') || 'local-dev';
    const endpoints = ['health_profile', 'health_baseline', 'health_dailyweight', 'health_wakesleep', 'health_vitals', 'health_meals', 'health_exercise'];
    
    const responses = await Promise.all(endpoints.map(ep => fetch(`/api/state/load?userId=${token}&appName=${ep}`).catch(() => null)));
    const data = await Promise.all(responses.map(res => res && res.ok ? res.json() : { state: {} }));
    
    const [profDB, baseDB, weightDB, sleepDB, vitalsDB, mealsDB, exerciseDB] = data.map(d => d.state || {});
    
    const today = getTodayStr();
    let yesterdayDate = new Date(today + 'T00:00:00');
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    // --- 2. DATA PROCESSING ---
    const unitPref = profDB.unitPreference || 'Imperial';
    const age = profDB.age || 30;
    const sex = profDB.gender || 'Female';
    const rda = getBaseline(age, sex);

    const prevSleep = sleepDB[yesterday]?.sleepTime;
    const todayWake = sleepDB[today]?.wakeTime;
    const sleepMins = calculateSleepDuration(prevSleep, todayWake);
    const sleepText = sleepMins !== null ? `${Math.floor(sleepMins / 60)} hr ${sleepMins % 60} min` : 'Not tracked yet';

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

    const aggNut = {};
    const todayMeals = mealsDB[today]?.active || [];
    todayMeals.forEach(m => {
        if (!m.nutrition) return;
        Object.keys(m.nutrition).forEach(key => {
            if (!aggNut[key]) aggNut[key] = 0;
            aggNut[key] += (parseFloat(m.nutrition[key]) || 0);
        });
    });

    // --- 3. DELEGATE WINDOW CONSTRUCTION TO THE OS ---
    const contentArea = window.TAO_ENGINE.createWindow({
        id: 'tao-health-snapshot-win',
        title: 'Health - Snapshot',
        // 🚀 Matches Health.js exactly so it doesn't push past the screen bounds on mobile
        width: '65vw',
        height: '70vh',
        customButtons: [
            {
                label: 'Export PDF',
                onClick: async (e) => {
                    e.stopPropagation();
                    const btn = e.target;
                    btn.innerText = "Generating...";
                    
                    const tables = document.getElementById('tao-pdf-tables');
                    const expander = document.getElementById('tao-pdf-expander');
                    if(tables) tables.style.display = 'block'; 
                    if(expander) expander.style.display = 'none';  
        
                    const html2pdf = await loadPDFLibrary();
                    const content = document.getElementById('tao-pdf-content');
                    
                    const opt = {
                        margin:       0.5,
                        filename:     `Health_Snapshot_${today}.pdf`,
                        image:        { type: 'jpeg', quality: 0.98 },
                        html2canvas:  { scale: 2 },
                        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
                        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
                    };
        
                    await html2pdf().set(opt).from(content).save();
                    
                    btn.innerText = "Export PDF";
                    if(expander) expander.style.display = 'block'; 
                },
                style: { backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }
            }
        ]
    });

    if (!contentArea) return; 

    // --- 4. SCROLLABLE CONTENT AREA ---
    const content = document.createElement('div');
    content.id = 'tao-pdf-content';
    Object.assign(content.style, { 
        flex: '1', padding: '24px', overflowY: 'auto', 
        backgroundColor: '#ffffff', color: '#0f172a', fontFamily: 'sans-serif' 
    });

    const reportHeader = document.createElement('div');
    Object.assign(reportHeader.style, { 
        marginBottom: '24px', borderBottom: '2px solid #0f172a', paddingBottom: '12px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        pageBreakInside: 'avoid', breakInside: 'avoid', flexWrap: 'wrap', gap: '8px'
    });
    
    reportHeader.innerHTML = `
        <h2 style="margin:0; font-size:22px; color:#0f172a;">Daily Health Snapshot</h2>
        <span style="font-size:13px; color:#64748b;">${new Date(today + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
    `;
    content.appendChild(reportHeader);

    const makeSection = (title) => {
        const wrap = document.createElement('div');
        Object.assign(wrap.style, { marginBottom: '24px', pageBreakInside: 'avoid', breakInside: 'avoid' });
        wrap.innerHTML = `<h3 style="margin: 0 0 12px 0; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; color:#0ea5e9; font-size:15px; text-transform:uppercase;">${title}</h3>`;
        return wrap;
    };

    const secProfile = makeSection('1. Biological Profile & Anchors');
    secProfile.innerHTML += `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:13px; page-break-inside: avoid;">
            <div><strong>Name:</strong> ${profDB.firstName || 'User'} ${profDB.lastName || ''}</div>
            <div><strong>Demographic:</strong> ${age} yr old ${sex}</div>
            <div><strong>Starting Date:</strong> ${baseDB.startingDate || '--'}</div>
            <div><strong>Starting Weight:</strong> ${profDB.weightKg ? formatWeight(profDB.weightKg, unitPref) : '--'}</div>
            <div><strong>Target Weight:</strong> ${targetKg ? formatWeight(targetKg, unitPref) : '--'}</div>
            <div><strong>Current Goal:</strong> ${baseDB.targetGoal || 'Maintain'}</div>
        </div>
    `;
    content.appendChild(secProfile);

    const secStats = makeSection('2. Daily High-Level Stats');
    
    const vitalsActive = vitalsDB[today]?.active || [];
    const vitalsList = vitalsActive.length > 0 ? vitalsActive.map(v => {
        let vVal = v.type === 'Blood Pressure' ? `${v.value?.sys || '--'}/${v.value?.dia || '--'}` : v.value;
        return `<li style="margin-bottom:4px;"><strong>${v.type === 'Custom' ? v.customName : v.type}:</strong> ${vVal}</li>`;
    }).join('') : '<li>None tracked today</li>';

    const exText = exerciseDB[today]?.text || 'No exercise logged today.';

    secStats.innerHTML += `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:12px;">
            <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #e2e8f0; page-break-inside: avoid;">
                <h4 style="margin:0 0 8px 0; color:#0f172a; font-size:13px;">Weight & Sleep</h4>
                <div style="margin-bottom:4px;"><strong>Morning Weight:</strong><br/> ${lastMorningWeight ? formatWeight(lastMorningWeight, unitPref) : '(--)'}</div>
                <div style="margin-bottom:4px;"><strong>Diff from Yesterday:</strong><br/> ${diffText}</div>
                <div style="margin-bottom:8px;"><strong>Remaining to Target:</strong><br/> ${toTargetText}</div>
                <div style="margin-bottom:4px;"><strong>Hours Slept:</strong><br/> ${sleepText}</div>
            </div>
            <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #e2e8f0; page-break-inside: avoid;">
                <h4 style="margin:0 0 8px 0; color:#0f172a; font-size:13px;">Vitals & Exercise</h4>
                <ul style="margin:0 0 12px 0; padding-left:16px;">${vitalsList}</ul>
                <strong>Exercise:</strong> <div style="font-style:italic; margin-top:4px; white-space:pre-wrap;">${exText}</div>
            </div>
        </div>
    `;
    content.appendChild(secStats);

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

    Object.keys(rda.vitamins).forEach(k => checkNutrient(k.replace('_', ' '), aggNut[k] || 0, rda.vitamins[k]));
    Object.keys(rda.minerals).forEach(k => checkNutrient(k, aggNut[k] || 0, rda.minerals[k]));

    const defDisplay = deficiencyList.length > 0 ? deficiencyList.join(', ') : '<span style="color:#10b981;">All baseline targets met!</span>';

    secNutrition.innerHTML += `
        <div style="margin-bottom:16px; font-size:12px; display:grid; grid-template-columns:1fr; gap:12px; page-break-inside: avoid;">
            <div style="background:#fff7ed; padding:12px; border-left:4px solid #f97316; border-radius:4px;">
                <strong>Calorie Target (${targetCals} kcal):</strong> ${calStatus}
            </div>
            <div style="background:#fef2f2; padding:12px; border-left:4px solid #ef4444; border-radius:4px;">
                <strong>Deficiency Alert (Lacking Today):</strong><br/> ${defDisplay}
            </div>
        </div>
    `;

    const expandBtn = document.createElement('button');
    expandBtn.id = 'tao-pdf-expander';
    expandBtn.innerText = "▶ Expand Detailed Clinical Tables";
    Object.assign(expandBtn.style, { background:'none', border:'none', color:'#0ea5e9', cursor:'pointer', fontWeight:'bold', fontSize:'13px', padding:'0', marginBottom:'16px' });
    
    const tableWrap = document.createElement('div');
    tableWrap.id = 'tao-pdf-tables';
    tableWrap.style.display = 'none';

    const generateTable = (title, dataObj, aggData) => {
        let html = `
        <div style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 24px;">
            <h4 style="margin:0 0 8px 0;">${title}</h4>
            <table style="width:100%; table-layout: fixed; border-collapse:collapse; font-size:11px;">
                <tr style="background:#f1f5f9; text-align:left;">
                    <th style="width:25%; padding:6px; border:1px solid #cbd5e1;">Nutrient</th>
                    <th style="width:25%; padding:6px; border:1px solid #cbd5e1;">Target (RDA)</th>
                    <th style="width:20%; padding:6px; border:1px solid #cbd5e1;">Intake</th>
                    <th style="width:30%; padding:6px; border:1px solid #cbd5e1;">Status</th>
                </tr>`;
        
        Object.keys(dataObj).forEach(key => {
            const targetStr = dataObj[key];
            const targetNum = parseBaselineNum(targetStr);
            const intake = aggData[key] || aggData[key.toLowerCase()] || 0;
            const status = intake >= targetNum ? `<span style="color:#10b981; font-weight:bold;">[Met]</span>` : `<span style="color:#ef4444; font-weight:bold;">[Need ${(targetNum - intake).toFixed(1)}]</span>`;
            
            html += `<tr style="page-break-inside: avoid; break-inside: avoid;">
                <td style="padding:6px; border:1px solid #cbd5e1; word-wrap: break-word;">${key.replace('_', ' ')}</td>
                <td style="padding:6px; border:1px solid #cbd5e1;">${targetStr}</td>
                <td style="padding:6px; border:1px solid #cbd5e1;">${intake.toFixed(1)}</td>
                <td style="padding:6px; border:1px solid #cbd5e1;">${status}</td>
            </tr>`;
        });
        return html + `</table></div>`;
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

    contentArea.appendChild(content);
}