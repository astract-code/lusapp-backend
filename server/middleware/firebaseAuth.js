const admin = require('firebase-admin');

let firebaseAdmin;

try {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // DIAGNOSTIC LOGGING
    console.log('🔍 [FIREBASE DEBUG] Checking environment variables...');
    console.log('🔍 FIREBASE_PROJECT_ID:', projectId ? `Set (${projectId})` : 'MISSING');
    console.log('🔍 FIREBASE_CLIENT_EMAIL:', clientEmail ? `Set (${clientEmail.substring(0, 20)}...)` : 'MISSING');
    console.log('🔍 FIREBASE_PRIVATE_KEY type:', typeof privateKey);
    console.log('🔍 FIREBASE_PRIVATE_KEY length:', privateKey ? privateKey.length : 0);
    console.log('🔍 FIREBASE_PRIVATE_KEY starts with:', privateKey ? privateKey.substring(0, 30) : 'MISSING');
    console.log('🔍 FIREBASE_PRIVATE_KEY ends with:', privateKey ? privateKey.substring(privateKey.length - 30) : 'MISSING');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase credentials. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    }

    const processedKey = privateKey.replace(/\\n/g, '\n');
    console.log('🔍 After \\n replacement, starts with:', processedKey.substring(0, 30));

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: processedKey,
      }),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    firebaseAdmin = admin.app();
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  console.error('❌ Full error stack:', error.stack);
  console.warn('⚠️  Will use client-side token verification as fallback');
}

async function verifyFirebaseToken(req, res, next) {
  console.log('🔍 [TOKEN VERIFY] Starting token verification...');
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [TOKEN VERIFY] No authorization header or invalid format');
      return res.status(401).json({ error: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('🔍 [TOKEN VERIFY] Token received, length:', idToken.length);

    let decodedToken;
    
    if (firebaseAdmin && admin.apps.length > 0) {
      console.log('🔍 [TOKEN VERIFY] Using Firebase Admin SDK verification');
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log('✅ [TOKEN VERIFY] Admin SDK verification successful');
      } catch (adminError) {
        console.warn('⚠️  [TOKEN VERIFY] Admin SDK verification failed:', adminError.message);
        console.log('🔍 [TOKEN VERIFY] Falling back to client-side verification');
        decodedToken = await verifyTokenClientSide(idToken);
      }
    } else {
      console.log('🔍 [TOKEN VERIFY] Firebase Admin not initialized, using client-side verification');
      decodedToken = await verifyTokenClientSide(idToken);
    }

    console.log('✅ [TOKEN VERIFY] Token decoded successfully for user:', decodedToken.email);

    req.user = {
      userId: decodedToken.userId || decodedToken.uid,
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    console.error('❌ [TOKEN VERIFY] Token verification error:', error.message);
    console.error('❌ [TOKEN VERIFY] Full error:', error.stack);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function verifyTokenClientSide(idToken) {
  console.log('🔍 [CLIENT VERIFY] Starting client-side token verification');
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
          console.log('🔍 [CLIENT VERIFY] Retrieved', Object.keys(certs).length, 'certificates');
          
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
            console.log('✅ [CLIENT VERIFY] Token verified successfully for:', decoded.email);
            resolve(decoded);
          } else {
            console.error('❌ [CLIENT VERIFY] All certificates failed, last error:', lastError?.message);
            reject(lastError || new Error('Token verification failed'));
          }
        } catch (error) {
          console.error('❌ [CLIENT VERIFY] Error parsing certs or verifying:', error.message);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('❌ [CLIENT VERIFY] HTTPS request error:', error.message);
      reject(error);
    });
  });
}

module.exports = { verifyFirebaseToken, firebaseAdmin };
