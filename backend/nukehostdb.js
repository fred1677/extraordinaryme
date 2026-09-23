// File: /backend/nukehostdb.js

/**
 * ============================================================================
 * SCRIPT: nukehostdb.js
 * 
 * FUNCTION: 
 * Purely destructive "Blind Wipe". Drops the entire public schema to obliterate 
 * all known and unknown tables, functions, and triggers from the AWS PostgreSQL 
 * database, leaving a clean slate.
 * ============================================================================
 */

require('dotenv').config(); 
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false } 
});

async function nukeDatabase() {
    console.log('================================================');
    console.log('☢️  INITIATING BLIND TAO OS DATABASE NUKE (WIPE ALL)');
    console.log('================================================');

    try {
        console.log(`[1/2] Dropping public schema to obliterate all database contents...`);
        const dropQuery = `
            DROP SCHEMA public CASCADE;
            CREATE SCHEMA public;
            GRANT ALL ON SCHEMA public TO public;
        `;
        await pool.query(dropQuery);
        
        console.log(`[2/2] Matrix wiped. Public schema rebuilt.`);
        console.log('\n✅ SUCCESS: The database is completely clean and empty.');

    } catch (error) {
        console.error('\n❌ FATAL ERROR: Nuke execution failed.');
        console.error(error.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

nukeDatabase();