/**
 * ============================================================================
 * ROUTER: /backend/utils/ads.js
 * DESCRIPTION: API endpoints for the TAO OS Ad Server and Monetization Engine.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../db/db'); // Points up one level and into the db folder

// ==========================================
// 1. GET ALL ADS (Used by manage-vendor-ad.js and ad-bar.js)
// ==========================================
router.get('/', async (req, res) => {
    try {
        const result = await db.pool.query('SELECT * FROM ad_inventory ORDER BY created_at DESC');
        
        // Map the database snake_case columns back to the frontend UI's expected format
        const mappedAds = result.rows.map(ad => ({
            id: ad.id,
            campaign: ad.campaign,
            type: ad.type,
            text: ad.headline + (ad.subtext && ad.subtext.trim() ? ' ' + ad.subtext : ''), 
            link: ad.target_url,
            internal_content: ad.internal_page_content,
            backgroundColor: ad.bg_color,
            color: ad.text_color
        }));
        
        res.status(200).json(mappedAds);
    } catch (error) {
        console.error('[API] Error fetching ad inventory:', error.message);
        res.status(500).json({ error: 'Failed to fetch ad inventory' });
    }
});

// ==========================================
// 2. ADD NEW VENDOR AD (Hardened & Sanitized)
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { campaign, text, link, type, internal_content, backgroundColor, color } = req.body;
        
        // 🚀 STRICT SANITIZATION: Prevent 'undefined' values from crashing PostgreSQL
        const safeCampaign = campaign || 'Untitled Campaign';
        const safeText = String(text || 'Advertisement');
        const safeType = type || 'internal';
        const safeLink = link || null;
        const safeInternal = internal_content || null;
        const safeBg = backgroundColor || '#0f172a';
        const safeColor = color || '#38bdf8';
        
        // Split the frontend's single 'text' field into 'headline' (max 50) and 'subtext' (max 60)
        const headline = safeText.substring(0, 50);
        const subtext = safeText.length > 50 ? safeText.substring(50, 110) : ' ';
        
        const query = `
            INSERT INTO ad_inventory 
            (campaign, type, headline, subtext, target_url, bg_color, text_color, internal_page_content)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
        `;
        const values = [safeCampaign, safeType, headline, subtext, safeLink, safeBg, safeColor, safeInternal];
        
        const result = await db.pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        // 🚀 DEEP LOGGING: If it fails, print the exact PostgreSQL error to the server terminal
        console.error('\n[API CRITICAL ERROR] Failed to create new ad!');
        console.error('Payload received:', req.body);
        console.error('Database Rejection Reason:', error.message, '\n');
        res.status(500).json({ error: 'Failed to create new ad: ' + error.message });
    }
});

// ==========================================
// 3. DELETE VENDOR AD
// ==========================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.pool.query('DELETE FROM ad_inventory WHERE id = $1', [id]);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('[API] Error deleting ad:', error.message);
        res.status(500).json({ error: 'Failed to delete ad' });
    }
});

module.exports = router;