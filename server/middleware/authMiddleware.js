const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

if (!process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable is not set. Server cannot start.');
  process.exit(1);
}

const JWT_SECRET = process.env.SESSION_SECRET;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Original middleware for backend JWTs only
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Combined middleware that accepts both Firebase tokens AND backend JWTs
const combinedAuthMiddleware = async (req, res, next) => {
  console.log('[COMBINED AUTH] Starting authentication...');
  
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // First, try to verify as a backend JWT (for social auth users)
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('[COMBINED AUTH] Backend JWT verified for user ID:', decoded.userId);
      
      // Backend JWTs have userId directly
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        socialProvider: decoded.socialProvider,
      };
      return next();
    } catch (backendJwtError) {
      // Not a backend JWT, try Firebase token
      console.log('[COMBINED AUTH] Not a backend JWT, trying Firebase verification...');
    }
    
    // Try Firebase token verification
    try {
      const decodedFirebase = await verifyFirebaseTokenInternal(token);
      // Firebase JWT uses 'sub' for user ID, or 'user_id' field
      const firebaseUid = decodedFirebase.sub || decodedFirebase.user_id || decodedFirebase.uid;
      console.log('[COMBINED AUTH] Firebase token verified for:', decodedFirebase.email, 'UID:', firebaseUid);
      
      // Look up database user ID from Firebase UID
      const userResult = await pool.query(
        'SELECT id FROM users WHERE firebase_uid = $1',
        [firebaseUid]
      );
      
      if (userResult.rows.length === 0) {
        console.error('[COMBINED AUTH] No database user found for Firebase UID:', firebaseUid);
        return res.status(404).json({ error: 'User not found in database' });
      }
      
      const dbUserId = userResult.rows[0].id;
      console.log('[COMBINED AUTH] Database user ID:', dbUserId);
      
      req.user = {
        userId: dbUserId,
        firebaseUid: firebaseUid,
        email: decodedFirebase.email,
        emailVerified: decodedFirebase.email_verified,
      };
      return next();
    } catch (firebaseError) {
      console.error('[COMBINED AUTH] Firebase verification also failed:', firebaseError.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
  } catch (error) {
    console.error('[COMBINED AUTH] Unexpected error:', error.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Internal Firebase token verification
async function verifyFirebaseTokenInternal(idToken) {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const url = `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`;
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const certs = JSON.parse(data);
          
          let decoded = null;
          let lastError = null;
          
          for (const cert of Object.values(certs)) {
            try {
              decoded = jwt.verify(idToken, cert, {
                algorithms: ['RS256'],
                audience: process.env.FIREBASE_PROJECT_ID,
                issuer: `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID}`,
              });
              break;
            } catch (err) {
              lastError = err;
            }
          }
          
          if (decoded) {
            resolve(decoded);
          } else {
            reject(lastError || new Error('Token verification failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

module.exports = { authMiddleware, combinedAuthMiddleware, JWT_SECRET };
