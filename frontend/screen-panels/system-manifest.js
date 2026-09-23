/**
 * ============================================================================
 * MODULE: /frontend/screen-panels/system-manifest.js
 * DESCRIPTION: The central registry for all System OS applications. 
 * system-desktop.js dynamically reads this file to generate the workspace.
 * ============================================================================
 */

export const systemManifest = [
    {
        appName: 'Ad Inventory',
        iconSvg: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffd700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="12" rx="2" ry="2"></rect><path d="M12 16v4"></path><path d="M8 20h8"></path></svg>`,
        modulePath: '../src/functions/a/manage-vendor-ad.js',
        initMethod: 'initAdManager'
    }
    // 🚀 IN THE FUTURE: Just drop new module configs here!
    // {
    //     appName: 'User Roles',
    //     iconSvg: `<svg>...</svg>`,
    //     modulePath: '../src/functions/u/manage-users.js',
    //     initMethod: 'initUserManager'
    // }
];