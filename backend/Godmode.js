const fs = require('fs');
const bcrypt = require('bcrypt');
const { pool } = require('./db/db.js'); 

async function initializeSystem() {
    try {
        console.log('1. Transmitting blueprint to database...');
        
        // Path updated to look inside the 'db' folder where schema.sql lives
        const schema = fs.readFileSync('./db/schema.sql', 'utf8');
        await pool.query(schema);
        console.log('[SUCCESS] Database tables constructed!');

        console.log('2. Checking for Supreme user...');
        const checkQuery = 'SELECT id FROM users WHERE username = $1';
        const userCheck = await pool.query(checkQuery, ['Tao']);

        if (userCheck.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('12345', 10);
            const insertQuery = `
                INSERT INTO users (username, password_hash, designation) 
                VALUES ($1, $2, $3)
            `;
            await pool.query(insertQuery, ['Tao', hashedPassword, 'Godmode']);
            console.log('[SUCCESS] Supreme Godmode user "Tao" has been awakened.');
        } else {
            console.log('[NOTICE] Godmode user "Tao" is already active.');
        }
    } catch (err) {
        console.error('[SYSTEM ERROR]:', err.message);
    } finally {
        await pool.end(); 
    }
}

initializeSystem();