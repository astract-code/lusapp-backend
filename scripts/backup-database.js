const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupDir = path.join(__dirname, '../backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
  
  try {
    console.log('🔄 Starting database backup...');
    
    // Get all table data
    const tables = ['users', 'races', 'posts', 'groups', 'group_members', 
                    'group_messages', 'group_gear_lists', 'group_gear_items',
                    'conversations', 'messages'];
    
    let backupSQL = `-- Database Backup ${timestamp}\n\n`;
    
    for (const table of tables) {
      console.log(`  📊 Backing up ${table}...`);
      
      // Get table structure
      const structureResult = await pool.query(`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      backupSQL += `\n-- Table: ${table}\n`;
      backupSQL += `-- Columns: ${structureResult.rows.map(r => r.column_name).join(', ')}\n`;
      
      // Get row count
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(countResult.rows[0].count);
      
      if (count > 0) {
        // Export data as INSERT statements
        const dataResult = await pool.query(`SELECT * FROM ${table}`);
        
        for (const row of dataResult.rows) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (Array.isArray(val)) return `ARRAY[${val.map(v => `'${v}'`).join(',')}]`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return val;
          });
          
          backupSQL += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        
        console.log(`  ✅ Backed up ${count} rows from ${table}`);
      } else {
        console.log(`  ⚠️  ${table} is empty, skipping...`);
      }
    }
    
    // Write backup file
    fs.writeFileSync(backupFile, backupSQL);
    
    const fileSizeKB = (fs.statSync(backupFile).size / 1024).toFixed(2);
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 File: ${backupFile}`);
    console.log(`📊 Size: ${fileSizeKB} KB`);
    
    // Clean up old backups (keep last 10)
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length > 10) {
      console.log('\n🧹 Cleaning up old backups...');
      files.slice(10).forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`  🗑️  Deleted: ${file.name}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

backupDatabase();
