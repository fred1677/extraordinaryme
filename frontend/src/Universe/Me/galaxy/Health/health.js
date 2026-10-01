/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/health.js
 * 
 * DESCRIPTION:
 * The primary Health application module. 
 * Acts as the structural View layout. Delegates ALL profile, tracking, and 
 * AWS saving logic entirely to external decoupled components.
 * ============================================================================
 */

import { getTodayStr } from '../check-today.js';
import { createProfileBlock } from './health-profile.js';
import { createBaselineBlock } from './health-baseline.js';
import { createWakesleepBlock } from './health-wakesleep.js';
import { createDailyweightBlock } from './health-dailyweight.js';
import { createVitalsBlock } from './health-vitals.js';
import { createMealBlock } from './health-meal.js';
import { createExerciseBlock } from './health-exercise.js';

export const localDictionary = {
    name: "health",
    commands: ["log vital", "120/80", "lb", "lbs", "sleep time", "wake up"]
};

const formatHeaderDate = (ymdStr) => {
    const [y, m, d] = ymdStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export async function initHealth(container) {
    const moduleName = "Health"; 
    const safeId = "health";

    let targetArea = container;

    // 🚀 DELEGATE ENTIRELY TO THE OS SINGLE SOURCE OF TRUTH
    if (!targetArea) {
        targetArea = window.TAO_ENGINE.createWindow({
            id: `tao-${safeId}-window`,
            title: moduleName,
            width: '65vw',
            height: '70vh'
        });
        if (!targetArea) return; 
    }

    const appCanvas = document.createElement('div');
    Object.assign(appCanvas.style, {
        flex: '1', width: '100%', height: '100%', backgroundColor: '#ffffff',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '0' 
    });

    const headerArea = document.createElement('div');
    Object.assign(headerArea.style, { 
        padding: '16px 32px 12px 32px', flexShrink: '0', backgroundColor: '#ffffff',
        display: 'flex', justifyContent: 'flex-end'
    });
    
    const dateDisplay = document.createElement('span');
    dateDisplay.innerText = formatHeaderDate(getTodayStr());
    Object.assign(dateDisplay.style, { color: '#64748b', fontSize: '13px', fontFamily: 'sans-serif', fontWeight: '500' });

    window.addEventListener('tao-midnight-rollover', (e) => {
        if (e.detail?.newDate) dateDisplay.innerText = formatHeaderDate(e.detail.newDate);
    });

    headerArea.appendChild(dateDisplay);

    const tabBar = document.createElement('div');
    Object.assign(tabBar.style, {
        display: 'flex', gap: '24px', padding: '0 32px', borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff', flexShrink: '0', overflowX: 'auto', scrollbarWidth: 'none'
    });
    tabBar.innerHTML = `<style>#${safeId}-tabs::-webkit-scrollbar { display: none; }</style>`;
    tabBar.id = `${safeId}-tabs`;

    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, {
        flex: '1', padding: '24px 32px 48px 32px', overflowY: 'auto', minHeight: '0', height: '100%',
        scrollBehavior: 'smooth', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative'
    });

    contentArea.appendChild(createProfileBlock());
    contentArea.appendChild(createBaselineBlock());

    const blocks = [];
    const tabs = [];
    const tabNames = ['Wake/Sleep', 'Weight', 'Vitals', 'Meal', 'Exercise'];

    blocks.push(createWakesleepBlock());
    blocks.push(createDailyweightBlock());
    blocks.push(createVitalsBlock());
    blocks.push(createMealBlock());
    blocks.push(createExerciseBlock());

    blocks.forEach((block, index) => {
        contentArea.appendChild(block);
        
        const tab = document.createElement('div');
        tab.innerText = tabNames[index];
        Object.assign(tab.style, {
            padding: '12px 0', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif',
            color: index === 0 ? '#0284c7' : '#64748b', borderBottom: index === 0 ? '3px solid #0284c7' : '3px solid transparent',
            whiteSpace: 'nowrap', transition: 'all 0.2s ease'
        });

        tab.onclick = () => {
            contentArea.scrollTo({ top: block.offsetTop - 24, behavior: 'smooth' });
            tabs.forEach(t => { t.style.color = '#64748b'; t.style.borderBottomColor = 'transparent'; });
            tab.style.color = '#0284c7'; tab.style.borderBottomColor = '#0284c7';
        };
        tabs.push(tab);
        tabBar.appendChild(tab);
    });

    contentArea.addEventListener('scroll', () => {
        let currentBlock = 0;
        const scrollPos = contentArea.scrollTop;
        blocks.forEach((block, index) => { if (block.offsetTop - 100 <= scrollPos) currentBlock = index; });
        tabs.forEach((tab, index) => {
            if (index === currentBlock) { tab.style.color = '#0284c7'; tab.style.borderBottomColor = '#0284c7'; } 
            else { tab.style.color = '#64748b'; tab.style.borderBottomColor = 'transparent'; }
        });
    });

    appCanvas.appendChild(headerArea);
    appCanvas.appendChild(tabBar);
    appCanvas.appendChild(contentArea);
    targetArea.appendChild(appCanvas);

    if (!window.TAO_HEALTH_SIGNALS_BOUND) {
        window.addEventListener('tao-global-help-clicked', async (e) => {
            if (e.detail && e.detail.appName.toLowerCase() === 'health') {
                try {
                    // 🚀 Strictly lowercase import
                    const helpMod = await import('./health-help.js');
                    if (helpMod && helpMod.executeHelp) helpMod.executeHelp(e.detail.windowRef || targetArea);
                } catch (err) {
                    console.error('[Health] Failed to load Help module:', err);
                }
            }
        });

        window.addEventListener('tao-global-snapshot-clicked', async (e) => {
            if (e.detail && e.detail.appName.toLowerCase() === 'health') {
                try {
                    // 🚀 Strictly lowercase import
                    const snapMod = await import('./health-snapshot.js');
                    if (snapMod && snapMod.executeSnapshot) snapMod.executeSnapshot(e.detail.windowRef || targetArea);
                } catch (err) {
                    console.error('[Health] Failed to load Snapshot module:', err);
                }
            }
        });
        window.TAO_HEALTH_SIGNALS_BOUND = true;
    }
}