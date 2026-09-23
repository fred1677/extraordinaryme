// backend/utils/storageRouter.js

const path = require('path');
const fs = require('fs');
const { pool } = require('../db/db');

// Define the base local storage directory
const STORAGE_BASE = path.join(__dirname, '../storage');

/**
 * Determines the target local directory based on file size and active database thresholds
 * @param {number} fileSizeBytes - The size of the incoming file in bytes
 * @returns {string} - The absolute path to the target local folder
 */
const getStorageDestination = async (fileSizeBytes) => {
    try {
        // Fetch active thresholds live from RDS
        const res = await pool.query(
            "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('host_1_max_bytes', 'host_2_max_bytes', 'host_3_max_bytes')"
        );
        
        const limits = {};
        res.rows.forEach(row => {
            limits[row.setting_key] = Number(row.setting_value);
        });

        const HOST_1_MAX = limits['host_1_max_bytes'] || 102400;     // Default 100 KB
        const HOST_2_MAX = limits['host_2_max_bytes'] || 1048576;    // Default 1 MB
        const HOST_3_MAX = limits['host_3_max_bytes'] || 10485760;   // Default 10 MB

        let targetFolder;
        if (fileSizeBytes <= HOST_1_MAX) {
            targetFolder = 'host_1';
        } else if (fileSizeBytes <= HOST_2_MAX) {
            targetFolder = 'host_2';
        } else {
            targetFolder = 'host_3';
        }

        const finalPath = path.join(STORAGE_BASE, targetFolder);
        
        // Automatically create the directory if it doesn't exist yet
        if (!fs.existsSync(finalPath)) {
            fs.mkdirSync(finalPath, { recursive: true });
        }

        return finalPath;
    } catch (err) {
        console.error('Database threshold fetch failed, falling back to host_3 local path:', err.message);
        const fallbackPath = path.join(STORAGE_BASE, 'host_3');
        if (!fs.existsSync(fallbackPath)) {
            fs.mkdirSync(fallbackPath, { recursive: true });
        }
        return fallbackPath;
    }
};

module.exports = { getStorageDestination };