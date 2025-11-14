const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function listBackups() {
  const backupDir = path.join(__dirname, '../backups');
  
  if (!fs.existsSync(backupDir)) {
    console.log('❌ No backups directory found');
    process.exit(1);
  }
  
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
    .map(f => ({
      name: f,
      path: path.join(backupDir, f),
      size: (fs.statSync(path.join(backupDir, f)).size / 1024).toFixed(2),
      date: fs.statSync(path.join(backupDir, f)).mtime
    }))
    .sort((a, b) => b.date - a.date);
  
  if (files.length === 0) {
    console.log('❌ No backup files found');
    process.exit(1);
  }
  
  console.log('\n📦 Available Backups:\n');
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name}`);
    console.log(`   Date: ${file.date.toLocaleString()}`);
    console.log(`   Size: ${file.size} KB\n`);
  });
  
  return files;
}

async function restoreDatabase(backupFile) {
  try {
    console.log('⚠️  WARNING: This will restore data from the backup.');
    console.log('⚠️  Existing data may be affected.\n');
    
    const sql = fs.readFileSync(backupFile, 'utf8');
    const statements = sql.split('\n').filter(line => 
      line.trim() && 
      !line.startsWith('--') && 
      line.includes('INSERT INTO')
    );
    
    console.log(`🔄 Restoring ${statements.length} records...`);
    
    for (const statement of statements) {
      await pool.query(statement);
    }
    
    console.log('✅ Database restored successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  }
}

async function main() {
  const files = await listBackups();
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Enter backup number to restore (or 0 to cancel): ', (answer) => {
    const index = parseInt(answer) - 1;
    
    if (answer === '0' || isNaN(index) || index < 0 || index >= files.length) {
      console.log('❌ Restore cancelled');
      rl.close();
      process.exit(0);
    }
    
    rl.close();
    restoreDatabase(files[index].path);
  });
}

main();
