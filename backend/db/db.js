// File: /backend/db/db.js

/**
 * ============================================================================
 * MODULE: /backend/db/db.js
 * 
 * FUNCTION: 
 * The core database interface for TAO OS. 
 * ============================================================================
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false } 
});

// ==========================================
// UTILITY: STRICT UUID VALIDATOR
// ==========================================
const SYSTEM_UUID = '00000000-0000-0000-0000-000000000000';
const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const sanitizeUserId = (id) => (id && isValidUUID(id)) ? id : SYSTEM_UUID;

/**
 * ============================================================================
 * UNIVERSAL SYSTEM LOGGER
 * ============================================================================
 */
const createSystemLog = async (logData) => {
    const validUserId = sanitizeUserId(logData.userId || logData.user_id);
    const modName = logData.moduleName || logData.module_name || 'system_fallback';
    const msg = logData.message || 'No message provided';
    const type = logData.type || 'info';

    const query = `
        INSERT INTO system_logs (user_id, module_name, message, log_type) 
        VALUES ($1, $2, $3, $4)
    `;
    
    try {
        await pool.query(query, [validUserId, modName, msg, type]);
    } catch (err) {
        console.error('[DB Logger Error]:', err.message);
    }
};

/**
 * ============================================================================
 * THE FORGE: DYNAMIC OBJECT CREATOR
 * ============================================================================
 */
const createTaoObject = async (blueprint) => {
    const query = `
        INSERT INTO user_modules (owner_id, parent_id, node_type, name, ui_state)
        VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    
    const validCreatorId = sanitizeUserId(blueprint.creatorId);

    const uiStatePayload = {
        ...blueprint.ui_state,
        classification: blueprint.classification,
        description: blueprint.description,
        creator_clearance: blueprint.creatorClearance,
        status: blueprint.status
    };

    try {
        const res = await pool.query(query, [
            validCreatorId, 
            null, 
            blueprint.taxonomy,
            blueprint.name,
            uiStatePayload
        ]);
        return res.rows[0];
    } catch (err) {
        console.error('[DB Forge Error] Failed to create object:', err.message);
        throw err; 
    }
};

/**
 * ============================================================================
 * VISIBILITY ENGINE: ACCESS CONTROL
 * ============================================================================
 */
const getVisibleObjects = async (userId) => {
    const validUserId = sanitizeUserId(userId);

    const query = `
        SELECT * FROM user_modules 
        WHERE 
            owner_id = $1 
            OR 
            (owner_id = '00000000-0000-0000-0000-000000000000' AND ui_state->>'classification' = 'Public')
        ORDER BY name ASC
    `;

    try {
        const res = await pool.query(query, [validUserId]);
        return res.rows;
    } catch (err) {
        console.error('[DB Visibility Error] Failed to fetch objects:', err.message);
        throw err;
    }
};

/**
 * ============================================================================
 * THE AD ENGINE: INVENTORY MANAGEMENT
 * ============================================================================
 */
const getRandomAd = async () => {
    // Selects a single random ad on every load to rotate vendor exposure
    const query = 'SELECT * FROM ad_inventory ORDER BY RANDOM() LIMIT 1';
    try {
        const res = await pool.query(query);
        return res.rows[0];
    } catch (err) {
        console.error('[DB Ad Engine Error] Failed to fetch random ad:', err.message);
        throw err;
    }
};

const getAllAds = async () => {
    const query = 'SELECT * FROM ad_inventory ORDER BY created_at DESC';
    try {
        const res = await pool.query(query);
        return res.rows;
    } catch (err) {
        console.error('[DB Ad Engine Error] Failed to fetch all ads:', err.message);
        throw err;
    }
};

const addAd = async (payload) => {
    const query = `
        INSERT INTO ad_inventory (campaign, type, headline, subtext, target_url, bg_color, text_color, internal_page_content)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `;
    try {
        const res = await pool.query(query, [
            payload.campaign, payload.type, payload.headline, payload.subtext, 
            payload.target_url, payload.bg_color, payload.text_color, payload.internal_page_content
        ]);
        return res.rows[0];
    } catch (err) {
        console.error('[DB Ad Engine Error] Failed to insert ad:', err.message);
        throw err;
    }
};

const updateAd = async (adId, payload) => {
    const query = `
        UPDATE ad_inventory 
        SET campaign = $1, type = $2, headline = $3, subtext = $4, 
            target_url = $5, bg_color = $6, text_color = $7, internal_page_content = $8
        WHERE id = $9 RETURNING *
    `;
    try {
        const res = await pool.query(query, [
            payload.campaign, payload.type, payload.headline, payload.subtext, 
            payload.target_url, payload.bg_color, payload.text_color, payload.internal_page_content,
            adId
        ]);
        return res.rows[0];
    } catch (err) {
        console.error('[DB Ad Engine Error] Failed to update ad:', err.message);
        throw err;
    }
};

const deleteAd = async (adId) => {
    const query = 'DELETE FROM ad_inventory WHERE id = $1 RETURNING *';
    try {
        const res = await pool.query(query, [adId]);
        return res.rows[0];
    } catch (err) {
        console.error('[DB Ad Engine Error] Failed to delete ad:', err.message);
        throw err;
    }
};

module.exports = {
    pool,
    createSystemLog,
    createTaoObject,
    getVisibleObjects,
    getRandomAd,
    getAllAds,
    addAd,
    updateAd,
    deleteAd
};