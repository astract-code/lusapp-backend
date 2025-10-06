const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    const sql = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Database setup complete!');
    
    const result = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`📊 Current users: ${result.rows[0].count}`);
    
    const racesResult = await pool.query('SELECT COUNT(*) FROM races');
    console.log(`📊 Current races: ${racesResult.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
