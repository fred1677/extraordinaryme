// File: /backend/app-scanner.js

/**
 * ============================================================================
 * MODULE: /backend/app-scanner.js
 * 
 * FUNCTION: 
 * Hardware Integration Bridge (macOS specific). Scans the local machine's 
 * hard drive for installed applications and allows the web-based OS to 
 * execute terminal commands to launch them physically.
 * 
 * USAGE SYNTAX:
 * // In server.js:
 * const appScanner = require('./app-scanner');
 * app.use('/api/apps', appScanner);
 * 
 * // Frontend fetch example (Launch App):
 * fetch('/api/apps/launch', { 
 *    method: 'POST', 
 *    headers: { 'Content-Type': 'application/json' },
 *    body: JSON.stringify({ appName: "Calculator" }) 
 * });
 * ============================================================================
 * 
 * ARCHITECTURE DETAILS:
 * - Environment Dependency: This module relies on the macOS '/Applications' 
 *   directory structure and the 'open -a' terminal command. 
 * - Safety: server.js uses process.platform to ensure this file is only 
 *   loaded when running locally on macOS, preventing crashes on AWS (Linux).
 * ============================================================================
 */

const express = require('express');
const fs = require('fs');
const { execFile } = require('child_process');

const router = express.Router();

// 1. SCAN THE HARD DRIVE FOR APPS
router.get('/', (req, res) => {
    const appsDir = '/Applications';
    
    try {
        const files = fs.readdirSync(appsDir, { withFileTypes: true });
        
        // Filter for folders that end with .app and strip the extension for a clean name
        const apps = files
            .filter(dirent => dirent.isDirectory() && dirent.name.endsWith('.app'))
            .map(dirent => dirent.name.replace('.app', ''));
            
        res.json({ success: true, apps });
    } catch (error) {
        console.error('Error scanning applications:', error);
        res.status(500).json({ success: false, error: 'Failed to read /Applications' });
    }
});

// 2. FIRE THE LAUNCH COMMAND
router.post('/launch', (req, res) => {
    const { appName } = req.body;
    
    if (!appName) {
        return res.status(400).json({ success: false, error: 'App name required' });
    }

    // Securely executes: open -a "App Name"
    execFile('open', ['-a', appName], (error) => {
        if (error) {
            console.error(`Failed to launch ${appName}:`, error);
            return res.status(500).json({ success: false, error: 'Launch failed' });
        }
        res.json({ success: true, message: `${appName} launched!` });
    });
});

module.exports = router;