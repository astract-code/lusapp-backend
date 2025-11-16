const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const { Pool } = require('pg');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const messagesRoutes = require('./routes/messages');
const groupsRoutes = require('./routes/groups');
const groupMessagesRoutes = require('./routes/groupMessages');
const gearListsRoutes = require('./routes/gearLists');
const postsRoutes = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize database schema on startup
async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    const initSQL = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
    await pool.query(initSQL);
    console.log('✓ Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    // Don't exit - tables might already exist
  }
}

// Run database initialization
initializeDatabase();

if (!process.env.ADMIN_PASSWORD) {
  console.error('FATAL: ADMIN_PASSWORD environment variable is not set. Server cannot start.');
  process.exit(1);
}

const adminAuth = basicAuth({
  users: { 'admin': process.env.ADMIN_PASSWORD },
  challenge: true,
  realm: 'Lusapp Admin'
});

// Middleware to disable CORS for admin endpoints (prevents CSRF attacks)
const noCors = (req, res, next) => {
  res.removeHeader('Access-Control-Allow-Origin');
  res.removeHeader('Access-Control-Allow-Methods');
  res.removeHeader('Access-Control-Allow-Headers');
  res.removeHeader('Access-Control-Allow-Credentials');
  next();
};

// CSRF protection middleware for admin endpoints
const csrfProtection = (req, res, next) => {
  // For state-changing methods, verify the request comes from our admin panel
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const origin = req.get('Origin');
    const referer = req.get('Referer');
    const host = req.get('Host');
    const protocol = req.protocol;
    const expectedOrigin = `${protocol}://${host}`;
    
    // Check Origin header first (most reliable for CORS requests)
    if (origin) {
      if (origin !== expectedOrigin) {
        console.warn(`CSRF attempt blocked: ${req.method} ${req.path} - Origin ${origin} != ${expectedOrigin}`);
        return res.status(403).json({ error: 'Forbidden: Invalid request origin' });
      }
    } 
    // Fall back to Referer header
    else if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
        
        // Verify exact origin match AND that path starts with /admin
        if (refererOrigin !== expectedOrigin || !refererUrl.pathname.startsWith('/admin')) {
          console.warn(`CSRF attempt blocked: ${req.method} ${req.path} - Referer ${refererOrigin}${refererUrl.pathname} invalid`);
          return res.status(403).json({ error: 'Forbidden: Invalid request source' });
        }
      } catch (e) {
        console.warn(`CSRF attempt blocked: ${req.method} ${req.path} - Invalid referer URL`);
        return res.status(403).json({ error: 'Forbidden: Invalid referer' });
      }
    }
    // No origin or referer - block request
    else {
      console.warn(`CSRF attempt blocked: ${req.method} ${req.path} - No origin or referer header`);
      return res.status(403).json({ error: 'Forbidden: Missing origin/referer' });
    }
  }
  next();
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });

// Serve static files (CSV templates) publicly - NO AUTH
app.use('/static', express.static(path.join(__dirname, 'static')));

app.use('/admin', adminAuth, express.static('server/public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve legal documents publicly (no auth required)
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy-policy.html'));
});

app.get('/terms-of-service', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms-of-service.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/messages', messagesRoutes(pool));
app.use('/api/groups', groupsRoutes(pool));
app.use('/api/groups', groupMessagesRoutes(pool));
app.use('/api/groups', gearListsRoutes(pool));
app.use('/api/posts', postsRoutes);

app.get('/api/races', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *, COALESCE(registered_users, ARRAY[]::text[]) as registered_users 
       FROM races 
       WHERE date >= CURRENT_DATE 
       AND approval_status = 'approved'
       ORDER BY date ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching races:', error);
    res.status(500).json({ error: 'Failed to fetch races' });
  }
});

// Admin endpoint: Get pending races for approval (MUST be before /api/races/:id)
app.get('/api/races/pending', noCors, csrfProtection, adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as created_by_name, u.email as created_by_email
       FROM races r
       LEFT JOIN users u ON r.created_by_user_id = u.id
       WHERE r.approval_status = 'pending'
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending races:', error);
    res.status(500).json({ error: 'Failed to fetch pending races' });
  }
});

// Download all races as CSV (MUST be before /api/races/:id)
app.get('/api/races/csv-download', noCors, csrfProtection, adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM races ORDER BY date ASC');
    const races = result.rows;

    if (races.length === 0) {
      return res.status(404).json({ error: 'No races found' });
    }

    // CSV headers
    const headers = Object.keys(races[0]).join(',');
    const rows = races.map(race => 
      Object.values(race).map(val => {
        // Escape quotes and wrap in quotes if contains comma or quote
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ).join('\n');

    const csv = `${headers}\n${rows}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=races.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
});

app.get('/api/races/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT *, COALESCE(registered_users, ARRAY[]::text[]) as registered_users FROM races WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Race not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching race:', error);
    res.status(500).json({ error: 'Failed to fetch race' });
  }
});

app.post('/api/races', noCors, csrfProtection, adminAuth, async (req, res) => {
  try {
    const { name, sport, sport_category, sport_subtype, city, country, continent, date, start_time, distance, description, participants } = req.body;
    
    // Check for duplicates: same name + date + sport/distance
    // Use IS NOT DISTINCT FROM for NULL-safe comparison
    const duplicateCheck = await pool.query(
      `SELECT * FROM races 
       WHERE LOWER(name) = LOWER($1) 
       AND date = $2 
       AND (
         (sport_category IS NOT DISTINCT FROM $3 AND sport_subtype IS NOT DISTINCT FROM $4)
         OR (sport_category IS NULL AND sport_subtype IS NULL AND sport IS NOT DISTINCT FROM $5)
       )`,
      [name, date, sport_category || null, sport_subtype || null, sport || null]
    );
    
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Duplicate race detected',
        message: `A race with the same name, date, and sport/distance already exists: "${name}" on ${date}`,
        existingRace: duplicateCheck.rows[0]
      });
    }
    
    const result = await pool.query(
      'INSERT INTO races (name, sport, sport_category, sport_subtype, city, country, continent, date, start_time, distance, description, participants, approval_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [name, sport, sport_category || null, sport_subtype || null, city, country, continent, date, start_time || null, distance, description, participants || 0, 'approved']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating race:', error);
    res.status(500).json({ error: 'Failed to create race' });
  }
});

// User-friendly race creation endpoint (Firebase auth)
const { verifyFirebaseToken: verifyToken } = require('./middleware/firebaseAuth');

app.post('/api/races/user-create', verifyToken, async (req, res) => {
  try {
    const { name, sport, sport_category, sport_subtype, city, country, continent, date, start_time, distance, description, participants } = req.body;
    
    console.log('📝 [USER RACE CREATE] ===== START =====');
    console.log('📝 [USER RACE CREATE] Request from user:', req.user.email, '(ID:', req.user.userId, ')');
    console.log('📝 [USER RACE CREATE] Full payload:', JSON.stringify({ 
      name, sport, sport_category, sport_subtype, city, country, continent, date, 
      start_time, distance, description, participants 
    }, null, 2));
    
    if (!name || !date) {
      console.log('❌ [USER RACE CREATE] Validation failed: Missing name or date');
      return res.status(400).json({ error: 'Name and date are required' });
    }
    
    // Check for duplicates: same name + date + sport/distance
    console.log('🔍 [USER RACE CREATE] Checking for duplicates...');
    const duplicateCheck = await pool.query(
      `SELECT * FROM races 
       WHERE LOWER(name) = LOWER($1) 
       AND date = $2 
       AND (
         (sport_category IS NOT DISTINCT FROM $3 AND sport_subtype IS NOT DISTINCT FROM $4)
         OR (sport_category IS NULL AND sport_subtype IS NULL AND sport IS NOT DISTINCT FROM $5)
       )`,
      [name, date, sport_category || null, sport_subtype || null, sport || null]
    );
    
    if (duplicateCheck.rows.length > 0) {
      console.log('⚠️  [USER RACE CREATE] Duplicate detected:', duplicateCheck.rows[0].id, duplicateCheck.rows[0].name);
      return res.status(400).json({ 
        error: 'Duplicate race detected',
        message: `A race with the same name, date, and sport already exists: "${name}" on ${date}`,
        existingRace: duplicateCheck.rows[0]
      });
    }
    
    console.log('💾 [USER RACE CREATE] Inserting race into database...');
    const insertParams = [name, sport, sport_category || null, sport_subtype || null, city, country, continent, date, start_time || null, distance, description, participants || 0, 'pending', req.user.userId];
    console.log('💾 [USER RACE CREATE] Insert params:', JSON.stringify(insertParams));
    
    const result = await pool.query(
      'INSERT INTO races (name, sport, sport_category, sport_subtype, city, country, continent, date, start_time, distance, description, participants, approval_status, created_by_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
      insertParams
    );
    
    console.log('✅ [USER RACE CREATE] SUCCESS! Race created:');
    console.log('   - ID:', result.rows[0].id);
    console.log('   - Name:', result.rows[0].name);
    console.log('   - Approval Status:', result.rows[0].approval_status);
    console.log('   - Created By User ID:', result.rows[0].created_by_user_id);
    console.log('   - Created At:', result.rows[0].created_at);
    console.log('📝 [USER RACE CREATE] ===== END =====');
    
    res.json({ 
      success: true,
      race: result.rows[0],
      message: 'Race submitted successfully! Waiting for admin approval to avoid duplicates.'
    });
  } catch (error) {
    console.error('❌ [USER RACE CREATE] ERROR:', error.message);
    console.error('❌ [USER RACE CREATE] Stack:', error.stack);
    console.log('📝 [USER RACE CREATE] ===== END (ERROR) =====');
    res.status(500).json({ error: 'Failed to create race' });
  }
});

app.put('/api/races/:id', noCors, csrfProtection, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sport, sport_category, sport_subtype, city, country, continent, date, start_time, distance, description, participants } = req.body;
    
    console.log(`📝 [ADMIN RACE UPDATE] Updating race ${id} by ${req.auth.user || 'admin'}`);
    
    const result = await pool.query(
      'UPDATE races SET name = $1, sport = $2, sport_category = $3, sport_subtype = $4, city = $5, country = $6, continent = $7, date = $8, start_time = $9, distance = $10, description = $11, participants = $12 WHERE id = $13 RETURNING *',
      [name, sport || null, sport_category || null, sport_subtype || null, city, country, continent, date, start_time || null, distance, description, participants || 0, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Race not found' });
    }
    
    console.log(`✅ [ADMIN RACE UPDATE] Race ${id} updated successfully`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating race:', error);
    res.status(500).json({ error: 'Failed to update race' });
  }
});

app.delete('/api/races/:id', noCors, csrfProtection, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM races WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting race:', error);
    res.status(500).json({ error: 'Failed to delete race' });
  }
});

// Admin endpoint: Approve a race
app.post('/api/races/:id/approve', noCors, csrfProtection, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE races 
       SET approval_status = 'approved', 
           reviewed_by = $1, 
           reviewed_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [req.auth.user || 'admin', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Race not found' });
    }
    
    console.log(`✅ Race ${id} approved by ${req.auth.user || 'admin'}`);
    res.json({ success: true, race: result.rows[0] });
  } catch (error) {
    console.error('Error approving race:', error);
    res.status(500).json({ error: 'Failed to approve race' });
  }
});

// Admin endpoint: Reject a race
app.post('/api/races/:id/reject', noCors, csrfProtection, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await pool.query(
      `UPDATE races 
       SET approval_status = 'rejected', 
           reviewed_by = $1, 
           reviewed_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [req.auth.user || 'admin', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Race not found' });
    }
    
    console.log(`❌ Race ${id} rejected by ${req.auth.user || 'admin'}${reason ? `: ${reason}` : ''}`);
    res.json({ success: true, race: result.rows[0] });
  } catch (error) {
    console.error('Error rejecting race:', error);
    res.status(500).json({ error: 'Failed to reject race' });
  }
});

app.post('/api/races/csv-upload', noCors, csrfProtection, adminAuth, upload.single('csvFile'), async (req, res) => {
  try {
    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let imported = 0;
        let skipped = 0;
        const duplicates = [];
        
        for (const row of results) {
          try {
            const name = row.name || row.eventName || row['Event Name'];
            const sport = row.sport || row.sportType || row['Sport Type'] || 'Other';
            const sport_category = row.sport_category || row.sportCategory || null;
            const sport_subtype = row.sport_subtype || row.sportSubtype || null;
            const city = row.city || row.location;
            const country = row.country;
            const continent = row.continent;
            const date = row.date;
            const start_time = row.start_time || row.startTime || row['Start Time'] || null;
            const distance = row.distance;
            const description = row.description || '';
            const participants = parseInt(row.participants) || 0;

            if (name && date) {
              // Check for duplicates before inserting
              // Use IS NOT DISTINCT FROM for NULL-safe comparison
              const duplicateCheck = await pool.query(
                `SELECT * FROM races 
                 WHERE LOWER(name) = LOWER($1) 
                 AND date = $2 
                 AND (
                   (sport_category IS NOT DISTINCT FROM $3 AND sport_subtype IS NOT DISTINCT FROM $4)
                   OR (sport_category IS NULL AND sport_subtype IS NULL AND sport IS NOT DISTINCT FROM $5)
                 )`,
                [name, date, sport_category || null, sport_subtype || null, sport || null]
              );
              
              if (duplicateCheck.rows.length > 0) {
                duplicates.push(`${name} on ${date}`);
                skipped++;
                continue;
              }
              
              await pool.query(
                'INSERT INTO races (name, sport, sport_category, sport_subtype, city, country, continent, date, start_time, distance, description, participants, approval_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
                [name, sport, sport_category, sport_subtype, city, country, continent, date, start_time, distance, description, participants, 'approved']
              );
              imported++;
            }
          } catch (error) {
            console.error('Error importing row:', error);
            skipped++;
          }
        }

        fs.unlinkSync(filePath);
        res.json({ 
          success: true, 
          imported, 
          skipped,
          total: results.length,
          duplicates: duplicates.length > 0 ? duplicates : undefined
        });
      });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    res.status(500).json({ error: 'Failed to upload CSV' });
  }
});

const { authMiddleware } = require('./middleware/authMiddleware');
const { verifyFirebaseToken } = require('./middleware/firebaseAuth');

app.post('/api/races/:raceId/join', verifyFirebaseToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const raceId = parseInt(req.params.raceId, 10);
    const firebaseUid = req.user.firebaseUid;
    
    console.log(`[RACE JOIN] Firebase user ${firebaseUid} joining race ${raceId}`);
    
    if (isNaN(raceId)) {
      return res.status(400).json({ error: 'Invalid race ID' });
    }
    
    await client.query('BEGIN');
    
    // Get database user ID from Firebase UID
    const userResult = await client.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    const userId = userResult.rows[0].id;
    console.log(`[RACE JOIN] Database user ID: ${userId}`);
    
    // Get race details
    const raceCheck = await client.query(
      'SELECT id, name, sport_category, sport, city, country FROM races WHERE id = $1',
      [raceId]
    );
    if (raceCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Race not found' });
    }
    const race = raceCheck.rows[0];
    console.log(`[RACE JOIN] Found race: ${race.name}`);
    
    // Add user to joined_races
    await client.query(
      `UPDATE users 
       SET joined_races = ARRAY(SELECT DISTINCT unnest(COALESCE(joined_races, ARRAY[]::text[]) || ARRAY[$1::text]))
       WHERE id = $2`,
      [raceId.toString(), userId]
    );
    
    // Add user to race registered_users
    await client.query(
      `UPDATE races 
       SET registered_users = ARRAY(SELECT DISTINCT unnest(COALESCE(registered_users, ARRAY[]::text[]) || ARRAY[$1::text]))
       WHERE id = $2`,
      [userId.toString(), raceId]
    );
    
    // Create or get race group (race-safe with unique constraint)
    // Race groups are created by the first person who joins
    let groupId;
    try {
      console.log(`[RACE JOIN] Creating/fetching race group for race ${raceId}`);
      // Try to create race group
      const groupResult = await client.query(
        `INSERT INTO groups (name, sport_type, city, country, description, race_id, created_by, member_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
         ON CONFLICT (race_id) WHERE race_id IS NOT NULL DO NOTHING
         RETURNING id`,
        [
          `${race.name} - Participants`,
          race.sport_category || race.sport,
          race.city,
          race.country,
          `Official chat for all ${race.name} participants. Connect with fellow athletes!`,
          raceId,
          userId
        ]
      );
      
      if (groupResult.rows.length > 0) {
        groupId = groupResult.rows[0].id;
        console.log(`[RACE JOIN] Created new race group with ID ${groupId}`);
      } else {
        // Group already exists, fetch it
        const existingGroup = await client.query(
          'SELECT id FROM groups WHERE race_id = $1',
          [raceId]
        );
        groupId = existingGroup.rows[0].id;
        console.log(`[RACE JOIN] Found existing race group with ID ${groupId}`);
      }
    } catch (error) {
      console.log(`[RACE JOIN] Error creating group, fetching existing:`, error.message);
      // If unique constraint fails, fetch existing group
      const existingGroup = await client.query(
        'SELECT id FROM groups WHERE race_id = $1',
        [raceId]
      );
      groupId = existingGroup.rows[0].id;
      console.log(`[RACE JOIN] Found existing race group (after error) with ID ${groupId}`);
    }
    
    // Add user to race group (if not already a member)
    console.log(`[RACE JOIN] Adding user ${userId} to group ${groupId}`);
    await client.query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [groupId, userId]
    );
    
    // Update group member count
    await client.query(
      `UPDATE groups 
       SET member_count = (SELECT COUNT(*) FROM group_members WHERE group_id = $1)
       WHERE id = $1`,
      [groupId]
    );
    
    const result = await client.query(
      'SELECT joined_races FROM users WHERE id = $1',
      [userId]
    );
    
    await client.query('COMMIT');
    console.log(`[RACE JOIN] Success! User ${userId} added to race ${raceId} and group ${groupId}`);
    
    res.json({
      success: true,
      joinedRaces: result.rows[0].joined_races || [],
      groupId: groupId
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Join race error:', error);
    res.status(500).json({ error: 'Failed to join race' });
  } finally {
    client.release();
  }
});

app.post('/api/races/:raceId/leave', verifyFirebaseToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const raceId = parseInt(req.params.raceId, 10);
    const firebaseUid = req.user.firebaseUid;
    
    if (isNaN(raceId)) {
      return res.status(400).json({ error: 'Invalid race ID' });
    }
    
    await client.query('BEGIN');
    
    // Get database user ID from Firebase UID
    const userResult = await client.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    const userId = userResult.rows[0].id;
    
    await client.query(
      `UPDATE users 
       SET joined_races = array_remove(joined_races, $1)
       WHERE id = $2`,
      [raceId.toString(), userId]
    );
    
    await client.query(
      `UPDATE races 
       SET registered_users = array_remove(registered_users, $1)
       WHERE id = $2`,
      [userId.toString(), raceId]
    );
    
    const result = await client.query(
      'SELECT joined_races FROM users WHERE id = $1',
      [userId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      joinedRaces: result.rows[0].joined_races || []
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Leave race error:', error);
    res.status(500).json({ error: 'Failed to leave race' });
  } finally {
    client.release();
  }
});

app.post('/api/races/:raceId/complete', verifyFirebaseToken, async (req, res) => {
  try {
    const raceId = parseInt(req.params.raceId, 10);
    const firebaseUid = req.user.firebaseUid;
    
    if (isNaN(raceId)) {
      return res.status(400).json({ error: 'Invalid race ID' });
    }
    
    // Get database user ID from Firebase UID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userId = userResult.rows[0].id;
    
    const raceCheck = await pool.query('SELECT id FROM races WHERE id = $1', [raceId]);
    if (raceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Race not found' });
    }
    
    await pool.query(
      `UPDATE users 
       SET completed_races = ARRAY(SELECT DISTINCT unnest(COALESCE(completed_races, ARRAY[]::text[]) || ARRAY[$1::text]))
       WHERE id = $2`,
      [raceId.toString(), userId]
    );
    
    const result = await pool.query(
      'SELECT completed_races FROM users WHERE id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      completedRaces: result.rows[0].completed_races || []
    });
    
  } catch (error) {
    console.error('Complete race error:', error);
    res.status(500).json({ error: 'Failed to complete race' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
