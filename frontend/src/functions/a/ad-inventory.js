/**
 * ============================================================================
 * MODULE: /frontend/src/functions/a/ad-inventory.js
 * DESCRIPTION: The centralized database for TAO OS free-tier advertisements.
 * ============================================================================
 */

export const adInventory = [
    // --- VENDOR PURCHASES ---
    {
        id: 'ven-001',
        campaign: 'AWS Cloud Hosting',
        type: 'external', // Opens in a new browser tab
        headline: 'Scale your backend with AWS.',
        subtext: 'Get $300 in free credits today.',
        targetUrl: 'https://aws.amazon.com',
        backgroundColor: '#232f3e',
        textColor: '#ff9900'
    },
    {
        id: 'ven-002',
        campaign: 'MongoDB Atlas',
        type: 'external',
        headline: 'MongoDB Atlas: The multi-cloud developer data platform.',
        subtext: 'Start building for free.',
        targetUrl: 'https://www.mongodb.com/atlas',
        backgroundColor: '#001e2b',
        textColor: '#00ed64'
    },
    // --- STANDARD / SYSTEM ADS (Fallback) ---
    {
        id: 'sys-001',
        campaign: 'TAO OS Pro Upgrade',
        type: 'internal', // Opens a private app screen inside the OS
        headline: 'Unlock Your Full Workspace.',
        subtext: 'Upgrade to TAO Pro to remove ads permanently.',
        targetUrl: 'tao-upgrade-screen', // Custom OS Event ID
        backgroundColor: '#050505',
        textColor: '#ffd700' // TAO Gold
    }
];