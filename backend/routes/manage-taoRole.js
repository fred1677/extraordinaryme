/**
 * ============================================================================
 * MODULE: /backend/routes/manage-taoRole.js
 * 
 * API ROUTER: Dynamic Role & Ability Management
 * ACTION: Handles all CRUD operations for the system_roles dictionary.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../db/db.js'); // Adjust path to your database pool

// ============================================================================
// ZERO-TRUST GATEKEEPER MIDDLEWARE
// ============================================================================
// intercepts every request to ensure the user is authorized to manage roles.
async function requireRoleManager(req, res, next) {
    // In a real app, you extract this from the secure session token.
    // For now, we assume the frontend passes the requester's user ID in the headers.
    const requesterId = req.headers['x-user-id']; 

    if (!requesterId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    try {
        // Check if user is Godmode OR has the 'CAN_MANAGE_ROLES' ability
        const query = `
            SELECT u.designation, array_agg(a.ability_name) as abilities
            FROM users u
            LEFT JOIN system_abilities a ON a.role_name = ANY(u.tao_roles)
            WHERE u.id = $1
            GROUP BY u.id
        `;
        const result = await db.pool.query(query, [requesterId]);

        if (result.rows.length === 0) {
            return res.status(403).json({ success: false, error: 'User not found.' });
        }

        const user = result.rows[0];
        const hasDelegatedPower = user.abilities && user.abilities.includes('CAN_MANAGE_ROLES');

        if (user.designation === 'Godmode' || hasDelegatedPower) {
            next(); // Access Granted. Proceed to the requested endpoint.
        } else {
            return res.status(403).json({ success: false, error: 'Access Denied: Insufficient privileges.' });
        }
    } catch (err) {
        console.error('[Gatekeeper Error]:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
}

// Apply the gatekeeper to ALL routes in this file
router.use(requireRoleManager);

// ============================================================================
// ENDPOINT: GET ALL ROLES & THEIR ABILITIES
// Used by the frontend UI to display the dictionary and checkboxes.
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT r.role_name, r.description, 
                   COALESCE(json_agg(a.ability_name) FILTER (WHERE a.ability_name IS NOT NULL), '[]') as abilities
            FROM system_roles r
            LEFT JOIN system_abilities a ON r.role_name = a.role_name
            GROUP BY r.role_name;
        `;
        const result = await db.pool.query(query);
        res.status(200).json({ success: true, roles: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================================
// ENDPOINT: CREATE A NEW ROLE (E.g., "Event-Manager")
// ============================================================================
router.post('/', async (req, res) => {
    const { role_name, description } = req.body;
    try {
        const query = `INSERT INTO system_roles (role_name, description) VALUES ($1, $2) RETURNING *`;
        const result = await db.pool.query(query, [role_name, description]);
        res.status(201).json({ success: true, role: result.rows[0] });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Role may already exist or invalid input.' });
    }
});

// ============================================================================
// ENDPOINT: ATTACH AN ABILITY TO A ROLE (E.g., "CAN_ACCESS_HEALTH_APP")
// ============================================================================
router.post('/abilities', async (req, res) => {
    const { role_name, ability_name } = req.body;
    try {
        const query = `INSERT INTO system_abilities (role_name, ability_name) VALUES ($1, $2) RETURNING *`;
        const result = await db.pool.query(query, [role_name, ability_name]);
        res.status(201).json({ success: true, ability: result.rows[0] });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Ability already attached or invalid role.' });
    }
});

// ============================================================================
// ENDPOINT: REMOVE AN ABILITY FROM A ROLE
// ============================================================================
router.delete('/abilities', async (req, res) => {
    const { role_name, ability_name } = req.body;
    try {
        const query = `DELETE FROM system_abilities WHERE role_name = $1 AND ability_name = $2`;
        await db.pool.query(query, [role_name, ability_name]);
        res.status(200).json({ success: true, message: 'Ability revoked.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================================
// ENDPOINT: DELETE A ROLE ENTIRELY
// ============================================================================
router.delete('/:role_name', async (req, res) => {
    const { role_name } = req.params;
    try {
        // ON DELETE CASCADE in the DB schema will automatically delete linked abilities
        const query = `DELETE FROM system_roles WHERE role_name = $1`;
        await db.pool.query(query, [role_name]);
        res.status(200).json({ success: true, message: `Role ${role_name} deleted.` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;