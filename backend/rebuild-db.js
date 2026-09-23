// File: /backend/rebuild-db.js

/**
 * ============================================================================
 * SCRIPT: rebuild-db.js
 * 
 * FUNCTION: 
 * Reads the schema.sql blueprint and executes it against the AWS 
 * PostgreSQL host to rebuild the TAO OS database architecture.
 * ============================================================================
 */

require('dotenv').config(); 
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false } 
});

async function rebuildDatabase() {
    console.log('================================================');
    console.log('🏗️  INITIATING TAO OS DATABASE REBUILD');
    console.log('================================================');

    try {
        const schemaPath = path.join(__dirname, 'db', 'schema.sql');
        console.log(`[1/2] Reading schema blueprint from: ${schemaPath}`);
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log(`[2/2] Transmitting architectural payload to AWS...`);
        await pool.query(schemaSql);
        
        console.log('\n✅ SUCCESS: The database foundation has been successfully rebuilt.');

    } catch (error) {
        console.error('\n❌ FATAL ERROR: Database rebuild failed.');
        console.error(error.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

rebuildDatabase();