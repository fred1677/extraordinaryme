/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/check-today.js
 * 
 * DESCRIPTION: 
 * The Global Timekeeper for the TAO Workspace. 
 * Establishes the authoritative "Today" string (YYYY-MM-DD) based on local time.
 * Sets a background countdown to exactly 12:00:00 AM and broadcasts a 
 * system-wide 'tao-midnight-rollover' event to wipe/rollover all active apps.
 * ============================================================================
 */

// 1. Helper: Generates a strict YYYY-MM-DD string using LOCAL time, not UTC.
const generateLocalYMD = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// 2. The Master State
let masterDate = generateLocalYMD(new Date());
let rolloverTimer = null;

// 3. The Countdown Engine
const scheduleNextRollover = () => {
    const now = new Date();
    // Calculate exactly 12:00:00 AM for the NEXT day
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    
    // Find the difference in milliseconds
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Clear any existing timer just in case
    if (rolloverTimer) clearTimeout(rolloverTimer);

    console.log(`[Timekeeper] Syncing OS Clock. Midnight rollover in ${Math.round(msUntilMidnight / 60000)} minutes.`);

    // Set the trigger
    rolloverTimer = setTimeout(() => {
        // Midnight has arrived! Update the master date.
        masterDate = generateLocalYMD(new Date());
        console.log(`[Timekeeper] 🕛 Midnight reached. New master date is ${masterDate}`);

        // Broadcast the event to the entire TAO Galaxy
        window.dispatchEvent(new CustomEvent('tao-midnight-rollover', {
            detail: { newDate: masterDate }
        }));

        // Immediately schedule the countdown for tomorrow night
        scheduleNextRollover();
        
    }, msUntilMidnight);
};

// Start the clock immediately when this file is loaded into the workspace
scheduleNextRollover();

/**
 * EXPORTS
 * Apps like Health, Finance, and Productivity will import this to ask: "What is today?"
 */
export const getTodayStr = () => masterDate;

// (Optional Dev Tool) Un-comment this and trigger it in the console if you ever need to test midnight wiping without waiting.
export const forceRolloverForTesting = () => {
    console.warn('[Timekeeper] ⚠️ MANUAL ROLLOVER TRIGGERED');
    const future = new Date();
    future.setDate(future.getDate() + 1);
    masterDate = generateLocalYMD(future);
    window.dispatchEvent(new CustomEvent('tao-midnight-rollover', { detail: { newDate: masterDate } }));
};