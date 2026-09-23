/**
 * ============================================================================
 * MODULE: /backend/db/setup-roles.js
 * 
 * UTILITY: RBAC Initialization & User Seeding Script
 * ACTION: Run this manually once in the terminal before booting server.js
 * ============================================================================
 * 
 * TAO-ROLES DICTIONARY (PLAIN ENGLISH GUIDE FOR LEADERSHIP)
 * 
 * This section defines what each role means so Jingli and the Senior-Masters 
 * know exactly what permissions they are granting when assigning these titles.
 * 
 * [GODMODE / IMMUTABLE ADMINS] - Has the power to change the system itself.
 * - Tao           : The ultimate founder and system owner. Absolute unrestricted access.
 * - TheOne        : Top-tier executive administrator. Has full Godmode access to see, edit, and assign anything.
 * 
 * [LEADERSHIP TIERS] - Has the power to manage people and system operations.
 * - Senior-Master : High-level leadership. Oversees major operations and can manage lower tiers.
 * - Master        : Mid-level leadership. Manages specific teams, departments, or broad initiatives.
 * - Leader        : Front-line leadership. Guides specific groups of members or smaller projects.
 * 
 * [OPERATIONAL & SPECIALIZED] - Has specific functional duties (can hold multiple at once).
 * - Windows       : Technical/Operational support. Manages digital interfaces, displays, or system monitoring.
 * - Care-person   : Member support. Focuses on user well-being, community health, and assistance.
 * - HH-Host       : Event management. Controls specific events, virtual meetings, or hosted spaces.
 * - Speaker       : Presenter/Broadcaster. Has permissions to publish content or speak to the community.
 * - Staff         : General operations. Handles day-to-day administrative and backend tasks.
 * 
 * [COMMUNITY & BASELINE] - Entry-level backend access.
 * - Members       : The standard approved community member. Has access to basic apps but no management power.
 * - Other         : A flexible, catch-all role for special guests, contractors, or temporary access.
 * 
 * ============================================================================
 */

require('dotenv').config(); 
const db = require('./db.js'); 

async function initializeRBAC() {
    console.log('[RBAC Setup] Initializing system roles and users...');

    try {
        // ====================================================================
        // SECTION 1: UPDATE USERS TABLE (TWO-TIERED SECURITY)
        // ====================================================================
        console.log('[RBAC Setup] 1. Verifying users table schema & security flags...');
        await db.pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS tao_roles TEXT[] DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS is_taouser BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT false;
        `);

        // ====================================================================
        // SECTION 2 & 3: BUILD DICTIONARY & ABILITIES TABLES
        // ====================================================================
        console.log('[RBAC Setup] 2. Building System Roles Dictionary...');
        await db.pool.query(`
            CREATE TABLE IF NOT EXISTS system_roles (
                role_name VARCHAR(50) PRIMARY KEY,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('[RBAC Setup] 3. Building System Abilities Matrix...');
        await db.pool.query(`
            CREATE TABLE IF NOT EXISTS system_abilities (
                id SERIAL PRIMARY KEY,
                role_name VARCHAR(50) REFERENCES system_roles(role_name) ON DELETE CASCADE,
                ability_name VARCHAR(100),
                UNIQUE(role_name, ability_name)
            );
        `);

        // ====================================================================
        // SECTION 4: SEED THE INITIAL SYSTEM ROLES DICTIONARY
        // ====================================================================
        console.log('[RBAC Setup] 4. Seeding initial dictionary...');
        const initialRoles = [
            'TheOne', 'Senior-Master', 'Master', 'Leader', 'Windows', 
            'Care-person', 'HH-Host', 'Speaker', 'Staff', 'Members', 'Other'
        ];

        for (const role of initialRoles) {
            await db.pool.query(`
                INSERT INTO system_roles (role_name) 
                VALUES ($1) 
                ON CONFLICT (role_name) DO NOTHING;
            `, [role]);
        }

        // ====================================================================
        // SECTION 5: SEED PRE-DEFINED TAO-USERS (JINGLI & FRED)
        // ====================================================================
        console.log('[RBAC Setup] 5. Seeding pre-defined Tao-users...');

        // 5A. Seed Jingli (Godmode clearance + is_taouser + 2 Roles)
        const checkJingli = await db.pool.query(`SELECT id FROM users WHERE username = 'Jingli'`);
        if (checkJingli.rows.length === 0) {
            await db.pool.query(`
                INSERT INTO users (username, email, password_hash, designation, is_taouser, tao_roles, requires_password_change)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'Jingli', 
                'jingli@tao.local', 
                '12345',            // Legacy temporary password
                'Godmode',          // Frontend Tier: Godmode
                true,               // Backend Access: Granted (Taouser)
                ['TheOne', 'Senior-Master'], // Backend Roles
                true                // Force password change on next UI login
            ]);
            console.log('[RBAC Setup] -> User Jingli seeded successfully.');
        } else {
            console.log('[RBAC Setup] -> User Jingli already exists. Skipping.');
        }

        // 5B. Seed Fred (System clearance + is_taouser + 1 Role)
        const checkFred = await db.pool.query(`SELECT id FROM users WHERE username = 'Fred'`);
        if (checkFred.rows.length === 0) {
            await db.pool.query(`
                INSERT INTO users (username, email, password_hash, designation, is_taouser, tao_roles, requires_password_change)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'Fred', 
                'fred@tao.local',   
                '12345',            // Legacy temporary password
                'System',           // Frontend Tier: System Admin
                true,               // Backend Access: Granted (Taouser)
                ['Staff'],          // Backend Roles
                true                // Force password change on next UI login
            ]);
            console.log('[RBAC Setup] -> User Fred seeded successfully.');
        } else {
            console.log('[RBAC Setup] -> User Fred already exists. Skipping.');
        }

        console.log('[RBAC Setup] ✔️ RBAC Architecture is online. Safe to boot server.js.');

    } catch (err) {
        console.error('[RBAC Setup Error]:', err.message);
    } finally {
        await db.pool.end(); 
    }
}

initializeRBAC();