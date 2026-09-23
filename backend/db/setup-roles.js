/**
 * ============================================================================
 * MODULE: /backend/db/setup-roles.js
 * 
 * UTILITY: RBAC Initialization & User Seeding Script
 * ACTION: Run this manually once in the terminal before booting server.js
 * ============================================================================
 * 
 * TAO-ROLES DICTIONARY & CHAIN OF COMMAND
 * 
 * [GODMODE / IMMUTABLE ADMINS]
 * - Tao           : The ultimate founder and system owner.
 * - TheOne        : Top-tier executive administrator. 
 * 
 * [EXECUTIVE LEADERSHIP]
 * - Senior-Master : Possesses unique, overarching roles. Oversees the Master tier.
 * - Master        : Manages a set of designated Entities.
 * 
 * [ENTITY ARCHITECTURE (SILOED PODS)]
 * - Entity (1, 2, 3)  : The organizational container. Managed by Masters. Contains HH-Hosts.
 * - HH-Host (1, 2, 3) : Manages a specific set of members (Staff, Speakers, Members) within their assigned Entity.
 * 
 * [ENTITY MEMBERSHIP]
 * - Speaker (1, 2, 3) : Broadcasters assigned to an HH-Host's Entity.
 * - Staff (1, 2, 3)   : Operations personnel assigned to an HH-Host's Entity.
 * - Members (1, 2, 3) : General users assigned to an HH-Host's Entity.
 * 
 * [BASELINE]
 * - Members           : Universal baseline role. Every Taouser inherently holds this.
 * ============================================================================
 */

require('dotenv').config(); 
const db = require('./db.js'); 

async function initializeRBAC() {
    console.log('[RBAC Setup] Initializing system roles and users...');

    try {
        // ====================================================================
        // SECTION 1: UPDATE USERS TABLE (TWO-TIERED SECURITY & DUAL-VAULT)
        // ====================================================================
        console.log('[RBAC Setup] 1. Verifying users table schema & security flags...');
        await db.pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS tao_roles TEXT[] DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS is_taouser BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS tao_password_hash VARCHAR(255);
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
        // SECTION 4: SEED THE HIERARCHICAL SYSTEM ROLES DICTIONARY
        // ====================================================================
        console.log('[RBAC Setup] 4. Seeding hierarchical dictionary...');
        const initialRoles = [
            'Tao', 'TheOne', 'Senior-Master', 'Master', 'Leader', 'Windows', 'Care-person',
            'Entity-1', 'Entity-2', 'Entity-3',
            'HH-Host-1', 'HH-Host-2', 'HH-Host-3',
            'Speaker-1', 'Speaker-2', 'Speaker-3',
            'Staff-1', 'Staff-2', 'Staff-3',
            'Members-1', 'Members-2', 'Members-3',
            'Members', 'Other'
        ];

        for (const role of initialRoles) {
            await db.pool.query(`
                INSERT INTO system_roles (role_name) 
                VALUES ($1) 
                ON CONFLICT (role_name) DO NOTHING;
            `, [role]);
        }

        // ====================================================================
        // SECTION 5: SEED THE 4 FOUNDING TAO-USERS (WITH BASELINE 'Members' ROLE)
        // ====================================================================
        console.log('[RBAC Setup] 5. Seeding pre-defined Tao-users...');

        // 5A. Seed Tao
        const checkTao = await db.pool.query(`SELECT id FROM users WHERE username = 'Tao'`);
        if (checkTao.rows.length === 0) {
            await db.pool.query(`
                INSERT INTO users (username, email, password_hash, designation, is_taouser, tao_roles, requires_password_change)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, ['Tao', 'founder@tao.local', '12345', 'Godmode', true, ['Tao', 'Members'], true]);
            console.log('[RBAC Setup] -> User Tao seeded successfully.');
        } else {
            console.log('[RBAC Setup] -> User Tao already exists. Skipping.');
        }

        // 5B. Seed TheOne
        const checkTheOne = await db.pool.query(`SELECT id FROM users WHERE username = 'TheOne'`);
        if (checkTheOne.rows.length === 0) {
            await db.pool.query(`
                INSERT INTO users (username, email, password_hash, designation, is_taouser, tao_roles, requires_password_change)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, ['TheOne', 'theone@tao.local', '12345', 'Godmode', true, ['TheOne', 'Members'], true]);
            console.log('[RBAC Setup] -> User TheOne seeded successfully.');
        } else {
            console.log('[RBAC Setup] -> User TheOne already exists. Skipping.');
        }

        // 5C. Seed Jingli (Assigned Senior-Master)
        const checkJingli = await db.pool.query(`SELECT id FROM users WHERE username = 'Jingli'`);
        if (checkJingli.rows.length === 0) {
            await db.pool.query(`
                INSERT INTO users (username, email, password_hash, designation, is_taouser, tao_roles, requires_password_change)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, ['Jingli', 'jingli@tao.local', '12345', 'Godmode', true, ['TheOne', 'Senior-Master', 'Members'], true]);
            console.log('[RBAC Setup] -> User Jingli seeded successfully.');
        } else {
            console.log('[RBAC Setup] -> User Jingli already exists. Skipping.');
        }

        // 5D. Seed Fred (Assigned to Staff-1 under Entity-1 as an example)
        const checkFred = await db.pool.query(`SELECT id FROM users WHERE username = 'Fred'`);
        if (checkFred.rows.length === 0) {
            await db.pool.query(`
                INSERT INTO users (username, email, password_hash, designation, is_taouser, tao_roles, requires_password_change)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, ['Fred', 'fred@tao.local', '12345', 'System', true, ['Entity-1', 'Staff-1', 'Members'], true]);
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