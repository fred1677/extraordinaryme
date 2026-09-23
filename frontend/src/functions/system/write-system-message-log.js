// File: /frontend/src/functions/system/write-system-message-log.js

/**
 * ============================================================================
 * MODULE: /frontend/src/functions/system/write-system-message-log.js
 * 
 * FUNCTION: 
 * Universal system logger (The Transmitter). Formats and silently transmits 
 * application and system events without interfering with the UI thread.
 * 1. Broadcasts a local TAO_LIVE_LOG event for zero-latency UI monitoring.
 * 2. Transmits the payload to the backend API for permanent AWS storage.
 * 
 * USAGE SYNTAX:
 * import { writeSystemLog } from './write-system-message-log.js';
 * 
 * writeSystemLog('userId', 'moduleName', 'Your message here', 'info|warning|error');
 * ============================================================================
 * 
 * ARCHITECTURE DETAILS:
 * - Fire & Forget: Uses asynchronous fetch without awaiting the response to ensure 
 *   network latency never blocks or slows down the user's OS experience.
 * ============================================================================
 */
export function writeSystemLog(userId, moduleName, message, type = 'info') {
    if (!userId || !moduleName || !message) {
        console.warn('[Logger] Missing required fields. Log aborted.');
        return;
    }

    // 1. Broadcast locally to the Live Console (Zero-Latency)
    const logEvent = new CustomEvent('TAO_LIVE_LOG', { 
        detail: { 
            userId: userId, 
            moduleName: moduleName, 
            message: message, 
            type: type, 
            timestamp: new Date().toLocaleTimeString() 
        } 
    });
    window.dispatchEvent(logEvent);

    // 2. Fire & Forget background transmission to AWS via Express
    fetch('/api/system/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            module: moduleName, 
            message: message, 
            type: type, 
            userId: userId 
        })
    }).catch(err => {
        // Silently catch network errors so the user's UI never crashes
        console.error(`[Logger Failed] ${moduleName}:`, err);
    });
}