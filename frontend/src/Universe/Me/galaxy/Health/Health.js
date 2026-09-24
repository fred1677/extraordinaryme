/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/Health.js
 * 
 * DESCRIPTION:
 * The primary Health application module. 
 * Acts as the structural View layout. Delegates ALL profile, tracking, and 
 * AWS saving logic entirely to external decoupled components.
 * ============================================================================
 */

import { createProfileBlock } from './Health-profile.js';
import { createBaselineBlock } from './Health-baseline.js';
import { createWakesleepBlock } from './Health-wakesleep.js';
import { createDailyweightBlock } from './Health-dailyweight.js';
import { createVitalsBlock } from './Health-vitals.js';
import { createMealBlock } from './Health-meal.js';
import { createExerciseBlock } from './Health-exercise.js'; // NEW IMPORT!

export const localDictionary = {
    name: "health",
    commands: ["log vital", "120/80", "lb", "lbs", "sleep time", "wake up"]
};

export async function initHealth(container) {
    const moduleName = "Health"; 
    const safeId = "health";
    
    if (!container && document.getElementById(`tao-${safeId}-window`)) {
        const existingWin = document.getElementById(`tao-${safeId}-window`);
        if (window.TAO_ENGINE?.bringToFront) window.TAO_ENGINE.bringToFront(existingWin);
        return;
    }

    let targetArea = container;
    let appWindow = null;

    if (!targetArea) {
        appWindow = document.createElement('div');
        appWindow.id = `tao-${safeId}-window`;
        appWindow.classList.add('tao-workspace-window', 'is-floating');
        
        Object.assign(appWindow.style, {
            position: 'fixed', top: '15%', left: '20%', width: '65vw', height: '70vh',
            minWidth: '360px', minHeight: '400px', backgroundColor: '#ffffff', 
            borderRadius: '12px', boxShadow: '0 15px 50px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', 
            pointerEvents: 'auto', zIndex: '21000'
        });

        if (window.TAO_ENGINE && window.TAO_ENGINE.decorateAppWindow) {
            window.TAO_ENGINE.decorateAppWindow(appWindow, moduleName);
        }
        targetArea = appWindow;
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
    const today = new Date();
    dateDisplay.innerText = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    Object.assign(dateDisplay.style, { color: '#64748b', fontSize: '13px', fontFamily: 'sans-serif', fontWeight: '500' });

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

    // ========================================================================
    // 🚀 MOUNT ALL DECOUPLED BLOCKS
    // ========================================================================
    contentArea.appendChild(createProfileBlock());
    contentArea.appendChild(createBaselineBlock());

    const blocks = [];
    const tabs = [];
    const tabNames = ['Wake/Sleep', 'Weight', 'Vitals', 'Meal', 'Exercise'];

    blocks.push(createWakesleepBlock());
    blocks.push(createDailyweightBlock());
    blocks.push(createVitalsBlock());
    blocks.push(createMealBlock());
    blocks.push(createExerciseBlock()); // Fully Decoupled Exercise Block Mounted!

    // ========================================================================
    // SCROLL NAVIGATION
    // ========================================================================
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

    if (appWindow) {
        appWindow.addEventListener('tao-help-clicked', async () => {
            try {
                const helpMod = await import('./health-help.js');
                if (helpMod.executeHelp) helpMod.executeHelp(appWindow);
            } catch (e) {}
        });
        appWindow.addEventListener('tao-snapshot-clicked', async () => {
            try {
                const snapMod = await import('./health-snapshot.js');
                if (snapMod.executeSnapshot) snapMod.executeSnapshot(appWindow);
            } catch (e) {}
        });
    }
}