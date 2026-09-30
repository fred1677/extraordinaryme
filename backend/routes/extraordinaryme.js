// File: /backend/routes/extraordinaryme.js

/**
 * ============================================================================
 * THE UNIVERSAL CLOUD ROUTER
 * ============================================================================
 * Handles dynamic POST (uploads) and GET (downloads) to Amazon S3.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../db/db.js'); 

// Import BOTH the upload and download tools
const { uploadUserPayload, downloadUserPayload } = require('../utils/s3-uploader.js'); 

console.log('[System] Universal S3 Router (extraordinaryme) mounted.');

/**
 * UNIVERSAL POST ROUTE (SAVE TO S3)
 * URL Format: /api/extraordinaryme/:moduleName/:subModule
 */
router.post('/:moduleName/:subModule', async (req, res) => {
    try {
        const { moduleName, subModule } = req.params; 
        const { userId, payloadData, logDate } = req.body; 

        if (!userId || !payloadData) {
            return res.status(400).json({ success: false, error: 'Missing userId or payloadData' });
        }

        const s3Prefix = `${moduleName}/${subModule}`;
        const timestamp = logDate || new Date().toISOString().split('T')[0];
        const fileName = `${timestamp}.json`; 
        
        const fileContent = JSON.stringify(payloadData);

        const s3ObjectKey = await uploadUserPayload(
            userId, 
            s3Prefix, 
            fileName, 
            fileContent, 
            'application/json'
        );

        const query = `
            INSERT INTO user_metrics (user_id, metric_name, s3_object_key, log_date)
            VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP))
            RETURNING id, s3_object_key;
        `;
        
        const values = [userId, s3Prefix, s3ObjectKey, logDate || null];
        const result = await db.pool.query(query, values);

        res.status(200).json({ 
            success: true, 
            message: `Payload secured in S3 under /${s3Prefix}`,
            data: result.rows[0]
        });

    } catch (error) {
        console.error(`[Universal Router Error - POST]:`, error.message);
        res.status(500).json({ success: false, error: 'Failed to route payload to AWS.' });
    }
});


/**
 * UNIVERSAL GET ROUTE (LOAD FROM S3)
 * URL Format: /api/extraordinaryme/:moduleName/:subModule?userId=123&date=YYYY-MM-DD
 */
router.get('/:moduleName/:subModule', async (req, res) => {
    try {
        const { moduleName, subModule } = req.params;
        const { userId, date } = req.query; // GET routes use query parameters, not a body

        if (!userId || !date) {
            return res.status(400).json({ success: false, error: 'Missing userId or date query parameter' });
        }

        const s3Prefix = `${moduleName}/${subModule}`;
        const fileName = `${date}.json`;

        // Tell the S3 tool to fetch the file
        const payload = await downloadUserPayload(userId, s3Prefix, fileName);

        // If the tool returns null, the file doesn't exist yet for this date.
        // We return an empty object {} so the frontend renders a blank slate instead of crashing.
        if (!payload) {
            return res.status(200).json({});
        }

        // If data is found, send it directly to the frontend!
        res.status(200).json(payload);

    } catch (error) {
        console.error(`[Universal Router Error - GET]:`, error.message);
        res.status(500).json({ success: false, error: 'Failed to retrieve payload from AWS.' });
    }
});

module.exports = router;