const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setupDatabase() {
  try {
    console.log('⚠️  WARNING: This will run database initialization SQL');
    console.log('⚠️  Only run this on a NEW/EMPTY database or you risk data loss!');
    
    // Check if database already has data
    const userCheck = await pool.query('SELECT COUNT(*) FROM users').catch(() => ({ rows: [{ count: '0' }] }));
    const userCount = parseInt(userCheck.rows[0].count);
    
    if (userCount > 0) {
      console.log(`\n❌ DANGER: Database already has ${userCount} users!`);
      console.log('❌ This script should NOT be run on an existing database.');
      console.log('💡 Use "npm run db:backup" to backup your data first.');
      console.log('💡 Or use Neon\'s point-in-time restore feature.');
      process.exit(1);
    }
    
    console.log('Setting up database schema...');
    
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
