/**
 * ============================================================================
 * MODULE: /backend/routes/Mnguser-backend.js
 * 
 * API ROUTER: User Account & OS Clearance Management
 * ACTION: Allows System/Godmode admins to create users, change OS designations, 
 * and force password resets.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../db/db.js');

// ============================================================================
// ZERO-TRUST GATEKEEPER MIDDLEWARE
// ============================================================================
async function requireUserManager(req, res, next) {
    const requesterId = req.headers['x-user-id'] || req.body.requesterId || req.query.requesterId; 

    if (!requesterId) return res.status(401).json({ success: false, error: 'Authentication required.' });

    try {
        const query = `SELECT designation FROM users WHERE id = $1`;
        const result = await db.pool.query(query, [requesterId]);

        if (result.rows.length === 0) return res.status(403).json({ success: false, error: 'User not found.' });

        const user = result.rows[0];
        // Only Godmode and System designations can manage core OS users
        if (user.designation === 'Godmode' || user.designation === 'System') {
            next(); 
        } else {
            return res.status(403).json({ success: false, error: 'Access Denied: Insufficient OS privileges.' });
        }
    } catch (err) {
        console.error('[User Gatekeeper Error]:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
}

router.use(requireUserManager);

// ============================================================================
// ENDPOINT: GET ALL USERS
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT id, username, email, designation, is_taouser, requires_password_change, created_at 
            FROM users 
            ORDER BY created_at DESC;
        `;
        const result = await db.pool.query(query);
        res.status(200).json({ success: true, users: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================================
// ENDPOINT: CREATE NEW USER
// ============================================================================
router.post('/', async (req, res) => {
    const { username, email, password, designation, requirePassChange } = req.body;
    try {
        const query = `
            INSERT INTO users (username, email, password_hash, designation, requires_password_change)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, designation;
        `;
        const result = await db.pool.query(query, [username, email, password, designation || 'Explorer', !!requirePassChange]);
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('[Create User Error]:', err.message);
        res.status(400).json({ success: false, error: 'Username or email may already exist.' });
    }
});

// ============================================================================
// ENDPOINT: UPDATE USER OS CLEARANCE (Designation)
// ============================================================================
router.put('/:userId/clearance', async (req, res) => {
    const { userId } = req.params;
    const { designation } = req.body;
    
    try {
        const query = `
            UPDATE users 
            SET designation = COALESCE($1, designation)
            WHERE id = $2
            RETURNING id, username, designation;
        `;
        
        const result = await db.pool.query(query, [designation, userId]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Target user not found.' });

        res.status(200).json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to update user clearance.' });
    }
});

// ============================================================================
// ENDPOINT: RESET PASSWORD & FORCE CHANGE
// ============================================================================
router.put('/:userId/password', async (req, res) => {
    const { userId } = req.params;
    const { newPassword, requirePassChange } = req.body;
    
    try {
        const query = `
            UPDATE users 
            SET password_hash = $1, requires_password_change = $2
            WHERE id = $3
            RETURNING id, username;
        `;
        
        const result = await db.pool.query(query, [newPassword, !!requirePassChange, userId]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Target user not found.' });

        res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to reset password.' });
    }
});

module.exports = router;