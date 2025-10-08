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

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

if (!process.env.ADMIN_PASSWORD) {
  console.error('FATAL: ADMIN_PASSWORD environment variable is not set. Server cannot start.');
  process.exit(1);
}

const adminAuth = basicAuth({
  users: { 'admin': process.env.ADMIN_PASSWORD },
  challenge: true,
  realm: 'Lusapp Admin'
});

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });

app.use('/admin', adminAuth, express.static('server/public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve legal documents publicly (no auth required)
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy-policy.html'));
});

app.get('/terms-of-service', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms-of-service.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/messages', messagesRoutes(pool));

app.get('/api/races', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM races ORDER BY date ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching races:', error);
    res.status(500).json({ error: 'Failed to fetch races' });
  }
});

app.get('/api/races/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM races WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Race not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching race:', error);
    res.status(500).json({ error: 'Failed to fetch race' });
  }
});

app.post('/api/races', adminAuth, async (req, res) => {
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
      'INSERT INTO races (name, sport, sport_category, sport_subtype, city, country, continent, date, start_time, distance, description, participants) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [name, sport, sport_category || null, sport_subtype || null, city, country, continent, date, start_time || null, distance, description, participants || 0]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating race:', error);
    res.status(500).json({ error: 'Failed to create race' });
  }
});

app.put('/api/races/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sport, city, country, continent, date, start_time, distance, description, participants } = req.body;
    const result = await pool.query(
      'UPDATE races SET name = $1, sport = $2, city = $3, country = $4, continent = $5, date = $6, start_time = $7, distance = $8, description = $9, participants = $10 WHERE id = $11 RETURNING *',
      [name, sport, city, country, continent, date, start_time || null, distance, description, participants, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Race not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating race:', error);
    res.status(500).json({ error: 'Failed to update race' });
  }
});

app.delete('/api/races/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM races WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting race:', error);
    res.status(500).json({ error: 'Failed to delete race' });
  }
});

app.post('/api/races/csv-upload', adminAuth, upload.single('csvFile'), async (req, res) => {
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
                'INSERT INTO races (name, sport, sport_category, sport_subtype, city, country, continent, date, start_time, distance, description, participants) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
                [name, sport, sport_category, sport_subtype, city, country, continent, date, start_time, distance, description, participants]
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
