const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg');
const { combinedAuthMiddleware } = require('../middleware/authMiddleware');

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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log('[AVATAR UPLOAD] File filter - name:', file.originalname, 'type:', file.mimetype);
    const allowedTypes = /jpeg|jpg|png|gif|heic|heif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = file.mimetype.startsWith('image/');
    
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      console.log('[AVATAR UPLOAD] File rejected - not an image');
      cb(new Error('Only image files are allowed'));
    }
  }
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.log('[AVATAR UPLOAD] Multer error:', err.code, err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    console.log('[AVATAR UPLOAD] Upload error:', err.message);
    return res.status(400).json({ error: err.message });
  }
  next();
};

router.post('/avatar', combinedAuthMiddleware, upload.single('avatar'), handleMulterError, async (req, res) => {
  console.log('[AVATAR UPLOAD] Request received for user:', req.user?.userId);
  console.log('[AVATAR UPLOAD] File received:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'NO FILE');
  
  try {
    if (!req.file) {
      console.log('[AVATAR UPLOAD] No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('[AVATAR UPLOAD] Starting Cloudinary upload...');
    
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
          console.error('[AVATAR UPLOAD] Cloudinary error:', error.message || error);
          return res.status(500).json({ error: 'Failed to upload avatar to cloud storage' });
        }

        console.log('[AVATAR UPLOAD] Cloudinary success:', result.secure_url);

        try {
          const avatarUrl = result.secure_url;
          
          const dbResult = await pool.query(
            'UPDATE users SET avatar = $1 WHERE id = $2 RETURNING avatar',
            [avatarUrl, req.user.userId]
          );

          if (dbResult.rows.length === 0) {
            console.log('[AVATAR UPLOAD] User not found in database:', req.user.userId);
            return res.status(404).json({ error: 'User not found' });
          }

          console.log('[AVATAR UPLOAD] Database updated successfully for user:', req.user.userId);
          res.json({ 
            avatar: avatarUrl,
            message: 'Avatar uploaded successfully' 
          });
        } catch (dbError) {
          console.error('[AVATAR UPLOAD] Database error:', dbError.message);
          res.status(500).json({ error: 'Failed to update user avatar' });
        }
      }
    );

    uploadStream.end(req.file.buffer);

  } catch (error) {
    console.error('[AVATAR UPLOAD] Error:', error.message);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

module.exports = router;
