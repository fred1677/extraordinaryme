// db/migrate.js
const fs = require('fs');
const path = require('path');
const db = require('./index');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running schema.sql against AWS RDS...');
    await db.query(sql);
    console.log(' Schema executed successfully!');
  } catch (err) {
    console.error(' Migration failed:', err.message);
  } finally {
    await db.pool.end();
  }
}

runMigration();