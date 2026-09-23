// File: /frontend/src/functions/system/get-highest-user-layer.js

/**
 * ============================================================================
 * MODULE: /frontend/src/functions/system/get-highest-user-layer.js
 * 
 * FUNCTION: 
 * Manages the Z-index bucketing system for Layer 2 (User Workspace). 
 * Calculates persistent layer slots, mathematically isolates sub-windows to 
 * prevent collisions, and dynamically swaps active applications to the Front Stage.
 * ============================================================================
 * 
 * ARCHITECTURE UPDATE (SSOT Dynamic Math):
 * - Ignorant Module: This file no longer hardcodes any Z-index limits (e.g., 20000).
 * - Configuration Driven: Dynamically pulls its boundaries (Z_BASE, FRONT_STAGE_BASE, 
 *   SLOTS_MAX, and SLOT_SIZE) directly from window.TAO_USER_CONFIG.
 * - Infinite Scaling: If you change the OS base layer to 100,000 in the config, 
 *   this entire bucketing system updates its tracking instantly.
 * ============================================================================
 */

import { bulldoze } from './bulldoze.js';
import { writeSystemLog } from './write-system-message-log.js';

// Global state tracks fixed slots for the session
window.TAO_WINDOW_MANAGER = window.TAO_WINDOW_MANAGER || {
    appBuckets: {} // Maps active modules to their current slot
};

// Unified Selector matches windowmanager.js exactly
const OS_WINDOW_SELECTOR = '.tao-window, .tao-workspace-window, [id^="float-win-"], [id^="editor-win-"], #tao-manageobject-panel';

export function getHighestUserLayer(moduleName, isSubWindow = false, userId = 'unknown') {
    const wm = window.TAO_WINDOW_MANAGER;
    
    // >>> THE FIX: Dynamically load Single Source of Truth (with safe fallbacks)
    const conf = window.TAO_USER_CONFIG || { 
        Z_BASE: 20000, FRONT_STAGE_BASE: 29900, SLOTS_MAX: 98, SLOT_SIZE: 100 
    };
    
    const FRONT_STAGE_SLOT = conf.SLOTS_MAX + 1; // e.g., 99
    const FRONT_STAGE_CEILING = conf.FRONT_STAGE_BASE + conf.SLOT_SIZE;

    // ==========================================
    // 1. LAUNCHING A NEW APP (Steal the Front Stage)
    // ==========================================
    if (!wm.appBuckets[moduleName]) {
        let emptySlot = 1;
        const occupiedSlots = Object.values(wm.appBuckets);
        while (occupiedSlots.includes(emptySlot) && emptySlot <= conf.SLOTS_MAX) {
            emptySlot++;
        }

        // Demote whatever is currently in the Front Stage slot
        for (const [name, slot] of Object.entries(wm.appBuckets)) {
            if (slot === FRONT_STAGE_SLOT) {
                wm.appBuckets[name] = emptySlot;
                
                const activeWindows = document.querySelectorAll(OS_WINDOW_SELECTOR);
                activeWindows.forEach(win => {
                    const z = parseInt(window.getComputedStyle(win).zIndex, 10);
                    if (!isNaN(z) && z >= conf.FRONT_STAGE_BASE && z < FRONT_STAGE_CEILING) {
                        const offset = z - conf.FRONT_STAGE_BASE; 
                        win.style.zIndex = conf.Z_BASE + (emptySlot * conf.SLOT_SIZE) + offset;
                    }
                });
                break; 
            }
        }
        
        wm.appBuckets[moduleName] = FRONT_STAGE_SLOT;
    }

    const currentSlot = wm.appBuckets[moduleName];
    const slotBaseZIndex = conf.Z_BASE + (currentSlot * conf.SLOT_SIZE); 

    // ==========================================
    // 2. MAIN WINDOW EXECUTION
    // ==========================================
    if (!isSubWindow) {
        bulldoze([parseFloat(`2.${currentSlot.toString().padStart(2, '0')}`)], userId);
        
        const conceptualLayer = `2.${currentSlot.toString().padStart(2, '0')}.00`;
        
        writeSystemLog(userId, moduleName, `Assigned Main Window to Layer ${conceptualLayer} (Z-Index: ${slotBaseZIndex})`, 'info');
        
        return {
            conceptualLayer: conceptualLayer,
            zIndex: slotBaseZIndex
        };
    }

    // ==========================================
    // 3. SUB-WINDOW EXECUTION
    // ==========================================
    let highestZ = slotBaseZIndex;
    const activeWindows = document.querySelectorAll(OS_WINDOW_SELECTOR);

    activeWindows.forEach(win => {
        const z = parseInt(window.getComputedStyle(win).zIndex, 10);
        if (!isNaN(z) && z >= slotBaseZIndex && z < slotBaseZIndex + conf.SLOT_SIZE) {
            if (z > highestZ) highestZ = z;
        }
    });

    let newZIndex = highestZ + 1;
    let popupNumber = newZIndex - slotBaseZIndex;

    // Overflow Clamp based on dynamic slot size
    if (popupNumber >= conf.SLOT_SIZE - 1) {
        console.warn(`[WindowManager] Module ${moduleName} reached max sub-window limit. Cap applied.`);
        popupNumber = conf.SLOT_SIZE - 1;
        newZIndex = slotBaseZIndex + (conf.SLOT_SIZE - 1);
    }

    const conceptualSubLayer = `2.${currentSlot.toString().padStart(2, '0')}.${popupNumber.toString().padStart(2, '0')}`;

    writeSystemLog(userId, moduleName, `Assigned Sub-Window to Layer ${conceptualSubLayer} (Z-Index: ${newZIndex})`, 'info');

    return {
        conceptualLayer: conceptualSubLayer,
        zIndex: newZIndex
    };
}

export function bringModuleToFront(moduleName, userId = 'unknown') {
    const wm = window.TAO_WINDOW_MANAGER;
    const clickedSlot = wm.appBuckets[moduleName];
    
    // Load config dynamically
    const conf = window.TAO_USER_CONFIG || { 
        Z_BASE: 20000, FRONT_STAGE_BASE: 29900, SLOTS_MAX: 98, SLOT_SIZE: 100 
    };
    const FRONT_STAGE_SLOT = conf.SLOTS_MAX + 1;
    const FRONT_STAGE_CEILING = conf.FRONT_STAGE_BASE + conf.SLOT_SIZE;

    // Ignore if already Front Stage or not tracked
    if (!clickedSlot || clickedSlot === FRONT_STAGE_SLOT) return;

    let moduleInSlot99 = null;
    for (const [name, slot] of Object.entries(wm.appBuckets)) {
        if (slot === FRONT_STAGE_SLOT) {
            moduleInSlot99 = name;
            break;
        }
    }

    // 1. Swap slots in memory
    wm.appBuckets[moduleName] = FRONT_STAGE_SLOT;
    if (moduleInSlot99) {
        wm.appBuckets[moduleInSlot99] = clickedSlot;
    }

    // 2. Execute physical DOM swap
    const activeWindows = document.querySelectorAll(OS_WINDOW_SELECTOR);
    let windowsMoved = 0;
    
    activeWindows.forEach(win => {
        const z = parseInt(window.getComputedStyle(win).zIndex, 10);
        if (isNaN(z)) return;

        // Elevate clicked module to Front Stage
        if (z >= conf.Z_BASE + (clickedSlot * conf.SLOT_SIZE) && z < conf.Z_BASE + (clickedSlot * conf.SLOT_SIZE) + conf.SLOT_SIZE) {
            const offset = z - (conf.Z_BASE + (clickedSlot * conf.SLOT_SIZE));
            win.style.zIndex = conf.FRONT_STAGE_BASE + offset;
            windowsMoved++;
        }
        // Demote previous active module to the vacated slot
        else if (moduleInSlot99 && z >= conf.FRONT_STAGE_BASE && z < FRONT_STAGE_CEILING) {
            const offset = z - conf.FRONT_STAGE_BASE;
            win.style.zIndex = conf.Z_BASE + (clickedSlot * conf.SLOT_SIZE) + offset;
            windowsMoved++;
        }
    });

    writeSystemLog(userId, moduleName, `Swapped to Front Stage (Slot ${FRONT_STAGE_SLOT}). Demoted [${moduleInSlot99}] to Slot ${clickedSlot}. Moved ${windowsMoved} windows.`, 'info');
}