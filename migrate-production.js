const { Pool } = require('pg');

const RENDER_DATABASE_URL = 'YOUR_RENDER_DATABASE_URL_HERE';

async function runMigration() {
  console.log('🔄 Connecting to Render production database...');
  
  const pool = new Pool({
    connectionString: RENDER_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully!\n');

    console.log('🔄 Running migration: Adding registered_users column to races table...');
    await pool.query(`
      ALTER TABLE races ADD COLUMN IF NOT EXISTS registered_users TEXT[] DEFAULT '{}';
    `);
    console.log('✅ Migration completed successfully!\n');

    console.log('🔄 Verifying migration...');
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'races' AND column_name = 'registered_users';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verified: registered_users column exists');
      console.log(`   Type: ${result.rows[0].data_type}`);
    } else {
      console.log('❌ Warning: Could not verify column creation');
    }

    console.log('\n🎉 Migration complete! Your production database is ready.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
