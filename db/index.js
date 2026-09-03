// db/index.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'extraordinaryme-db.c2fikys4iukh.us-east-1.rds.amazonaws.com',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'extraordinaryme',
  user: process.env.DB_USER || 'fred1677',
  password: process.env.DB_PASSWORD || 'Flss$0910',
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('Connected to AWS RDS PostgreSQL pool');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};