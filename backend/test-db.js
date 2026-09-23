// test-db.js
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false 
  }
});

const testDatabasePush = async () => {
  try {
    console.log('Initiating AWS PostgreSQL connection...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        test_message TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const result = await client.query(
      'INSERT INTO connection_test(test_message) VALUES($1) RETURNING *',
      ['System test successful from extraordinaryme backend']
    );
    
    console.log('✅ Data pushed to AWS successfully:', result.rows[0]);
    
  } catch (err) {
    console.error('❌ Connection or query failed:', err.message);
  } finally {
    await client.end();
  }
};

testDatabasePush();
