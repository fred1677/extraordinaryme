/**
 * ============================================================================
 * ROUTER: /backend/routes/ads.js
 * DESCRIPTION: API endpoints for the TAO OS Ad Server and Monetization Engine.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../db/db'); 

// ==========================================
// 1. GET RANDOM AD (Used by ad-bar.js)
// ==========================================
router.get('/random', async (req, res) => {
    try {
        const ad = await db.getRandomAd();
        res.status(200).json(ad || null);
    } catch (error) {
        console.error('[API] Error fetching random ad:', error.message);
        res.status(500).json({ error: 'Failed to fetch random ad' });
    }
});

// ==========================================
// 2. GET ALL ADS (Used by manage-vendor-ad.js)
// ==========================================
router.get('/', async (req, res) => {
    try {
        const ads = await db.getAllAds();
        res.status(200).json(ads);
    } catch (error) {
        console.error('[API] Error fetching ad inventory:', error.message);
        res.status(500).json({ error: 'Failed to fetch ad inventory' });
    }
});

// ==========================================
// 3. ADD NEW VENDOR AD
// ==========================================
router.post('/', async (req, res) => {
    try {
        const newAd = await db.addAd(req.body);
        res.status(201).json(newAd);
    } catch (error) {
        console.error('[API] Error creating ad:', error.message);
        res.status(500).json({ error: 'Failed to create new ad' });
    }
});

// ==========================================
// 4. UPDATE VENDOR AD
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const updatedAd = await db.updateAd(req.params.id, req.body);
        res.status(200).json(updatedAd);
    } catch (error) {
        console.error('[API] Error updating ad:', error.message);
        res.status(500).json({ error: 'Failed to update ad' });
    }
});

// ==========================================
// 5. DELETE VENDOR AD
// ==========================================
router.delete('/:id', async (req, res) => {
    try {
        const deletedAd = await db.deleteAd(req.params.id);
        res.status(200).json(deletedAd);
    } catch (error) {
        console.error('[API] Error deleting ad:', error.message);
        res.status(500).json({ error: 'Failed to delete ad' });
    }
});

module.exports = router;