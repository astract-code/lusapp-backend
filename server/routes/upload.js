const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
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
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'lusapp/avatars',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ error: 'Failed to upload avatar to cloud storage' });
        }

        try {
          const avatarUrl = result.secure_url;
          
          const dbResult = await pool.query(
            'UPDATE users SET avatar = $1 WHERE id = $2 RETURNING avatar',
            [avatarUrl, req.user.userId]
          );

          if (dbResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
          }

          res.json({ 
            avatar: avatarUrl,
            message: 'Avatar uploaded successfully' 
          });
        } catch (dbError) {
          console.error('Database update error:', dbError);
          res.status(500).json({ error: 'Failed to update user avatar' });
        }
      }
    );

    uploadStream.end(req.file.buffer);

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

module.exports = router;
