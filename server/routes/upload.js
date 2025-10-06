const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const uploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
    }
  }
});

router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    console.log('Avatar upload request received');
    console.log('User ID:', req.user?.userId);
    console.log('File:', req.file ? req.file.filename : 'No file');
    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    console.log('Avatar URL:', avatarUrl);
    
    const result = await pool.query(
      'UPDATE users SET avatar = $1 WHERE id = $2 RETURNING avatar',
      [avatarUrl, req.user.userId]
    );

    console.log('Database update result:', result.rows);

    if (result.rows.length === 0) {
      fs.unlinkSync(req.file.path);
      console.error('User not found:', req.user.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const responseData = { 
      avatar: avatarUrl,
      message: 'Avatar uploaded successfully' 
    };
    console.log('Sending response:', responseData);
    res.json(responseData);

  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar', details: error.message });
  }
});

module.exports = router;
