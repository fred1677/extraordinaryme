// File: /backend/routes/system.js

/**
 * ============================================================================
 * SYSTEM ROUTER (The Database-Driven Desktop API)
 * ============================================================================
 * Handles core OS-level requests. Its primary job is serving the dynamic 
 * App Registry to the frontend home screen based on the user's OS designation 
 * and RBAC clearance.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../db/db.js');

// Establish the TAO OS hierarchy (Higher number = higher clearance)
const CLEARANCE_LEVELS = {
    'Explorer': 0,
    'Members': 1,
    'Staff': 2,
    'Speaker': 3,
    'HH-Host': 4,
    'Entity': 5,
    'Leader': 6,
    'Master': 7,
    'Senior-Master': 8,
    'TheOne': 9,
    'Tao': 10,
    'System': 99,
    'Godmode': 100
};

/**
 * GET /api/system/apps
 * Fetches all active applications the requesting user is authorized to see.
 */
router.get('/apps', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required.' });
        }

        const userQuery = await db.pool.query('SELECT tao_roles, designation FROM users WHERE id = $1', [userId]);
        
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        const { tao_roles, designation } = userQuery.rows[0];
        const userRoles = tao_roles || ['Members'];

        const appsQuery = await db.pool.query('SELECT * FROM system_applications WHERE is_active = true ORDER BY id ASC');
        
        if (designation === 'System' || designation === 'Godmode') {
            return res.status(200).json({ success: true, apps: appsQuery.rows });
        }

        let maxUserLevel = 1; 

        userRoles.forEach(role => {
            const normalizedCategory = role.replace(/-\d+$/, '');
            if (CLEARANCE_LEVELS[role] > maxUserLevel) {
                maxUserLevel = CLEARANCE_LEVELS[role];
            } else if (CLEARANCE_LEVELS[normalizedCategory] > maxUserLevel) {
                maxUserLevel = CLEARANCE_LEVELS[normalizedCategory];
            }
        });

        const authorizedApps = appsQuery.rows.filter(app => {
            const requiredLevel = CLEARANCE_LEVELS[app.minimum_clearance] || 1;
            return maxUserLevel >= requiredLevel;
        });

        res.status(200).json({ success: true, apps: authorizedApps });

    } catch (error) {
        console.error('[System Router Error]:', error.message);
        res.status(500).json({ success: false, error: 'Failed to load system applications.' });
    }
});

/**
 * GET /api/system/icons
 * Fetches all available icons from the registry for the App Manager dropdown
 */
router.get('/icons', async (req, res) => {
    try {
        const result = await db.pool.query('SELECT icon_name, svg_string FROM system_icons ORDER BY icon_name ASC');
        res.json({ success: true, icons: result.rows });
    } catch (error) {
        console.error('[System API] Fetch Icons Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch icon registry.' });
    }
});

/**
 * POST /api/system/icons
 * Allows high-clearance administrators to upload new SVG icons to the registry.
 */
router.post('/icons', async (req, res) => {
    try {
        const { iconName, svgString } = req.body;

        if (!iconName || !svgString) {
            return res.status(400).json({ success: false, error: 'Missing icon name or SVG string.' });
        }

        const query = `
            INSERT INTO system_icons (icon_name, svg_string)
            VALUES ($1, $2)
            RETURNING icon_name;
        `;
        
        await db.pool.query(query, [iconName, svgString]);
        
        res.status(201).json({ success: true, message: 'Icon successfully registered.' });

    } catch (error) {
        console.error('[System Router POST Icon Error]:', error.message);
        if (error.code === '23505') {
            return res.status(409).json({ success: false, error: 'An icon with this name already exists.' });
        }
        res.status(500).json({ success: false, error: 'Failed to register icon to database.' });
    }
});

/**
 * POST /api/system/apps
 * Allows high-clearance administrators to register new desktop applications.
 */
router.post('/apps', async (req, res) => {
    try {
        const { appName, iconPath, jsFilePath, minimumClearance } = req.body;

        if (!appName || !iconPath || !jsFilePath) {
            return res.status(400).json({ success: false, error: 'Missing required application fields.' });
        }

        const query = `
            INSERT INTO system_applications (app_name, icon_path, js_file_path, minimum_clearance)
            VALUES ($1, $2, $3, $4)
            RETURNING id, app_name;
        `;
        const values = [appName, iconPath, jsFilePath, minimumClearance || 'Members'];

        const result = await db.pool.query(query, values);
        
        res.status(201).json({ success: true, app: result.rows[0] });

    } catch (error) {
        console.error('[System Router POST Error]:', error.message);
        if (error.code === '23505') {
            return res.status(409).json({ success: false, error: 'An application with this name already exists.' });
        }
        res.status(500).json({ success: false, error: 'Failed to register application.' });
    }
});

/**
 * PUT /api/system/apps/:appName
 * Allows authorized admin users to update an existing application's settings 
 * (like clearance, icon, or path) directly from the GUI.
 */
router.put('/apps/:appName', async (req, res) => {
    const { appName } = req.params;
    const { iconPath, jsFilePath, minimumClearance } = req.body;
    
    if (!iconPath || !jsFilePath || !minimumClearance) {
        return res.status(400).json({ success: false, error: 'Missing required update fields.' });
    }

    try {
        const query = `
            UPDATE system_applications 
            SET icon_path = $1, js_file_path = $2, minimum_clearance = $3 
            WHERE app_name = $4
        `;
        await db.pool.query(query, [iconPath, jsFilePath, minimumClearance, appName]);
        
        res.status(200).json({ success: true, message: `Application ${appName} updated successfully.` });
    } catch (err) {
        console.error(`[System Router] Update Error for ${appName}:`, err.message);
        res.status(500).json({ success: false, error: 'Failed to update database registry.' });
    }
});

module.exports = router;