/**
 * ============================================================================
 * MODULE: /frontend/screen-panels/desktop-manifest.js
 * 
 * THE UNIVERSAL APPLICATION REGISTRY
 * 
 * 1. Architecture Overview
 *    - Acts as the central nervous system for all GUI applications within TAO OS.
 *    - Maps human-readable app names to their physical file paths and initialization 
 *      methods.
 * ============================================================================
 */

export const desktopManifest = [
    // ==========================================
    // CONSUMER LEVEL APPLICATIONS
    // ==========================================
    {
        appName: 'Me',
        iconSvg: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>`,
        modulePath: '../src/Universe/Me/Me.js',
        initMethod: 'runMe',
        windowFrame: true 
    },
    {
        appName: 'Health',
        iconSvg: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
        modulePath: '../src/Universe/Me/galaxy/Health/Health.js',
        initMethod: 'initHealth',
        windowFrame: true 
    },
    {
        appName: 'Messaging',
        iconSvg: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
        modulePath: '../src/functions/m/messaging.js',
        initMethod: 'initMessaging',
        windowFrame: true
    },
    {
        appName: 'Chatbox',
        iconSvg: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
        modulePath: 'chatbox', // Intercepted by home-screen.js
        initMethod: 'none',    // Intercepted by home-screen.js
        windowFrame: false     // Chatbox uses its own frame in index.js
    },
    
    // ==========================================
    // SYSTEM / ADMIN LEVEL APPLICATIONS
    // ==========================================
    {
        appName: 'Ad Inventory',
        iconSvg: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffd700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="12" rx="2" ry="2"></rect><path d="M12 16v4"></path><path d="M8 20h8"></path></svg>`,
        modulePath: '../src/functions/a/manage-vendor-ad.js',
        initMethod: 'initAdManager',
        windowFrame: true 
    }
];