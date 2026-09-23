/**
 * ============================================================================
 * UTILITY: /frontend/checkdb.js
 * ACTION: Run `node checkdb.js` from the terminal to instantly verify AWS data.
 * ============================================================================
 */
const path = require('path');

// 1. Tell the script to look up one folder to find your secure .env passwords
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// 2. Safely borrow the backend's existing AWS database connection
const db = require('../backend/db/db.js');

async function verifyAWS() {
    try {
        console.log('\n📡 [Frontend CLI] Bypassing browser... Querying live AWS Database directly...\n');
        
        // 🚀 UPDATED QUERY: Pulls EVERY user (Taousers and regular Explorers)
        const result = await db.pool.query(`
            SELECT id, username, designation, is_taouser, requires_password_change, tao_roles 
            FROM users;
        `);
        
        if (result.rows.length === 0) {
            console.log('⚠️ No users found in the AWS Database.');
        } else {
            // Prints a beautifully formatted table right in your terminal
            console.table(result.rows);
        }
        
        console.log('\n✔️ Query complete.\n');
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
    } finally {
        // Close the connection so your terminal process exits cleanly
        await db.pool.end();
    }
}

verifyAWS();