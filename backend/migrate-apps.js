// File: ~/extraordinaryme/backend/migrate-apps.js

require('dotenv').config();
const db = require('./db/db.js');

const query = `
INSERT INTO system_applications (app_name, icon_path, js_file_path, minimum_clearance)
VALUES 
    (
        'Profile', 
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>', 
        '../src/Universe/Me/galaxy/Profile/update-profile.js', 
        'Explorer'
    ),
    (
        'App Manager', 
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>', 
        '../src/Universe/Me/galaxy/System/AppManager.js', 
        'Master'
    ),
    (
        'Me', 
        '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>', 
        '../src/Universe/Me/Me.js', 
        'Explorer'
    ),
    (
        'Health', 
        '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>', 
        '../src/Universe/Me/galaxy/Health/health.js', 
        'Explorer'
    ),
    (
        'Messaging', 
        '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>', 
        '../src/functions/m/messaging.js', 
        'Explorer'
    ),
    (
        'Chatbox', 
        '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>', 
        'chatbox', 
        'Explorer'
    ),
    (
        'Ad Inventory', 
        '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffd700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="12" rx="2" ry="2"></rect><path d="M12 16v4"></path><path d="M8 20h8"></path></svg>', 
        '../src/functions/a/manage-vendor-ad.js', 
        'System'
    )
ON CONFLICT (app_name) DO UPDATE 
SET icon_path = EXCLUDED.icon_path, 
    js_file_path = EXCLUDED.js_file_path, 
    minimum_clearance = EXCLUDED.minimum_clearance;
`;

async function runMigration() {
    try {
        console.log('Migrating all core apps to AWS database...');
        await db.pool.query(query);
        console.log('Migration successful! Your desktop is fully populated.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();