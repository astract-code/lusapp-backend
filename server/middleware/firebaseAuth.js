const admin = require('firebase-admin');

let firebaseAdmin;

try {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase credentials. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    }

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    firebaseAdmin = admin.app();
  }
} catch (error) {
  console.warn('⚠️  Firebase Admin initialization failed:', error.message);
  console.warn('⚠️  Will use client-side token verification as fallback');
}

async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    let decodedToken;
    
    if (firebaseAdmin && admin.apps.length > 0) {
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (adminError) {
        console.warn('Admin SDK verification failed, using fallback:', adminError.message);
        decodedToken = await verifyTokenClientSide(idToken);
      }
    } else {
      decodedToken = await verifyTokenClientSide(idToken);
    }

    req.user = {
      userId: decodedToken.userId || decodedToken.uid,
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function verifyTokenClientSide(idToken) {
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
          const jwt = require('jsonwebtoken');
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
    }).on('error', reject);
  });
}

module.exports = { verifyFirebaseToken, firebaseAdmin };
