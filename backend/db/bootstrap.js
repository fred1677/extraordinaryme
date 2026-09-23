// File: /backend/db/bootstrap.js

/**
 * ============================================================================
 * MODULE: /backend/db/bootstrap.js
 * 
 * FUNCTION: 
 * The Pre-Flight Safety Check for the backend engine. 
 * Pings the AWS PostgreSQL database before the Express server boots. Actively 
 * detects legacy schema corruption and auto-heals the database by dropping 
 * and rebuilding tables in strict relational order.
 * ============================================================================
 */

const db = require('./db.js');

async function bootstrapDatabase() {
    console.log('[Bootstrap] Initiating pre-flight AWS database check...');
    
    try {
        await db.pool.query('SELECT NOW() AS current_time');
        console.log('[Bootstrap] ✅ AWS Database connection verified.');

        console.log('[Bootstrap] Verifying structural integrity of system tables...');

        // ===============================================================
        // 1. SMART HEALER: Detect corrupted legacy tables on AWS
        // ===============================================================
        const tableCheck = await db.pool.query(`SELECT table_name FROM information_schema.tables WHERE table_name = 'users'`);
        const columnCheck = await db.pool.query(`SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id'`);
        
        const tableExists = tableCheck.rows.length > 0;
        const hasValidIdColumn = columnCheck.rows.length > 0 && columnCheck.rows[0].data_type === 'uuid';

        if (tableExists && !hasValidIdColumn) {
            console.log('[Bootstrap] ⚠️ Corrupted legacy schema detected (missing or invalid ID column).');
            console.log('[Bootstrap] 🧹 Initiating automatic database wipe and rebuild...');
            
            await db.pool.query(`
                DROP TABLE IF EXISTS system_logs CASCADE;
                DROP TABLE IF EXISTS user_modules CASCADE;
                DROP TABLE IF EXISTS users CASCADE;
            `);
            
            console.log('[Bootstrap] 🗑️ Legacy tables purged.');
        }

        // ===============================================================
        // 2. BUILD SCHEMA (Strict Relational Order)
        // ===============================================================
        const schemaQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                designation VARCHAR(50) DEFAULT 'Explorer',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_modules (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                taxonomy VARCHAR(50) DEFAULT 'object',
                ui_state JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS system_logs (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                module_name VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                log_type VARCHAR(20) DEFAULT 'info',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_system_logs_module ON system_logs(module_name);
            CREATE INDEX IF NOT EXISTS idx_system_logs_time ON system_logs(created_at DESC);
        `;
        
        await db.pool.query(schemaQuery);
        console.log('[Bootstrap] ✅ Structural integrity verified. OS Tables online.');
        
        return true; 
    } catch (error) {
        console.error('[Bootstrap] ❌ CRITICAL: Could not reach the AWS Database or heal schema.');
        console.error(`[Bootstrap] Error Details: ${error.message}`);
        
        // Throwing the error here tells server.js to abort the boot sequence
        throw error; 
    }
}

module.exports = bootstrapDatabase;