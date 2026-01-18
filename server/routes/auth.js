const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { authMiddleware, JWT_SECRET } = require('../middleware/authMiddleware');
const { verifyFirebaseToken, verifyFirebaseTokenOnly } = require('../middleware/firebaseAuth');

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const getFullAvatarUrl = (req, avatarPath) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}${avatarPath}`;
};

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, location, bio, favoriteSport } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, location, bio, favorite_sport) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, name, location, bio, favorite_sport, avatar, total_races, created_at`,
      [email, passwordHash, name, location || 'Unknown', bio || '', favoriteSport || '']
    );
    
    const user = result.rows[0];
    
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        location: user.location,
        bio: user.bio,
        favoriteSport: user.favorite_sport,
        avatar: getFullAvatarUrl(req, user.avatar),
        totalRaces: user.total_races,
        joinedRaces: [],
        completedRaces: [],
        following: [],
        followers: []
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const result = await pool.query(
      `SELECT id, email, password_hash, name, location, bio, favorite_sport, avatar, 
              total_races, joined_races, completed_races, following, followers 
       FROM users WHERE email = $1`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        location: user.location,
        bio: user.bio,
        favoriteSport: user.favorite_sport,
        avatar: getFullAvatarUrl(req, user.avatar),
        totalRaces: user.total_races,
        joinedRaces: user.joined_races || [],
        completedRaces: user.completed_races || [],
        following: user.following || [],
        followers: user.followers || []
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, location, bio, favorite_sport, avatar, 
              total_races, joined_races, completed_races, following, followers 
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    res.json({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      location: user.location,
      bio: user.bio,
      favoriteSport: user.favorite_sport,
      avatar: getFullAvatarUrl(req, user.avatar),
      totalRaces: user.total_races,
      joinedRaces: user.joined_races || [],
      completedRaces: user.completed_races || [],
      following: user.following || [],
      followers: user.followers || []
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.put('/update-profile', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, bio, location, favoriteSport } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const result = await pool.query(
      'UPDATE users SET name = $1, bio = $2, location = $3, favorite_sport = $4 WHERE id = $5 RETURNING id, email, name, location, bio, favorite_sport, avatar, total_races',
      [
        name.trim(), 
        bio ? bio.trim() : null, 
        location ? location.trim() : null, 
        favoriteSport ? favoriteSport.trim() : null,
        userId
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        location: user.location,
        bio: user.bio,
        favoriteSport: user.favorite_sport,
        avatar: getFullAvatarUrl(req, user.avatar),
        totalRaces: user.total_races
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.delete('/account', verifyFirebaseToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.userId;
    
    await client.query('BEGIN');
    
    await client.query('DELETE FROM conversations WHERE user1_id = $1 OR user2_id = $1', [userId]);
    
    await client.query('DELETE FROM messages WHERE sender_id = $1', [userId]);
    
    await client.query(
      `UPDATE users 
       SET following = array_remove(following, $1),
           followers = array_remove(followers, $1)
       WHERE $1 = ANY(following) OR $1 = ANY(followers)`,
      [userId.toString()]
    );
    
    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Account and all associated data successfully deleted' 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  } finally {
    client.release();
  }
});

router.get('/users/batch', verifyFirebaseToken, async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'User IDs are required' });
    }
    
    const userIds = ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    
    if (userIds.length === 0) {
      return res.json({ users: [] });
    }
    
    const result = await pool.query(
      `SELECT id, email, name, location, bio, favorite_sport, avatar, total_races, created_at,
              joined_races, completed_races, following, followers
       FROM users
       WHERE id = ANY($1::int[])`,
      [userIds]
    );
    
    const users = result.rows.map(user => ({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      location: user.location,
      bio: user.bio,
      favoriteSport: user.favorite_sport,
      avatar: getFullAvatarUrl(req, user.avatar),
      totalRaces: user.total_races,
      joinedRaces: user.joined_races || [],
      completedRaces: user.completed_races || [],
      following: user.following || [],
      followers: user.followers || []
    }));
    
    res.json({ users });
  } catch (error) {
    console.error('Batch users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users/:userId/follow', verifyFirebaseToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const currentUserId = req.user.userId;
    const targetUserId = parseInt(req.params.userId, 10);
    
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    await client.query('BEGIN');
    
    const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [targetUserId]);
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    
    await client.query(
      `UPDATE users 
       SET following = ARRAY(SELECT DISTINCT unnest(COALESCE(following, ARRAY[]::text[]) || ARRAY[$1::text]))
       WHERE id = $2`,
      [targetUserId.toString(), currentUserId]
    );
    
    await client.query(
      `UPDATE users 
       SET followers = ARRAY(SELECT DISTINCT unnest(COALESCE(followers, ARRAY[]::text[]) || ARRAY[$1::text]))
       WHERE id = $2`,
      [currentUserId.toString(), targetUserId]
    );
    
    const result = await client.query(
      `SELECT following, followers FROM users WHERE id = $1`,
      [currentUserId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      following: result.rows[0].following || [],
      followers: result.rows[0].followers || []
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  } finally {
    client.release();
  }
});

router.delete('/users/:userId/unfollow', verifyFirebaseToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const currentUserId = req.user.userId;
    const targetUserId = parseInt(req.params.userId, 10);
    
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    await client.query('BEGIN');
    
    await client.query(
      `UPDATE users 
       SET following = array_remove(following, $1)
       WHERE id = $2`,
      [targetUserId.toString(), currentUserId]
    );
    
    await client.query(
      `UPDATE users 
       SET followers = array_remove(followers, $1)
       WHERE id = $2`,
      [currentUserId.toString(), targetUserId]
    );
    
    const result = await client.query(
      `SELECT following, followers FROM users WHERE id = $1`,
      [currentUserId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      following: result.rows[0].following || [],
      followers: result.rows[0].followers || []
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  } finally {
    client.release();
  }
});

const GOOGLE_CLIENT_IDS = [
  process.env.GOOGLE_IOS_CLIENT_ID,
  process.env.GOOGLE_ANDROID_CLIENT_ID,
  process.env.GOOGLE_WEB_CLIENT_ID,
].filter(Boolean);

router.post('/social', async (req, res) => {
  console.log('[SOCIAL AUTH] Processing social sign-in request');
  
  try {
    const { provider, id_token, user: appleUserId, full_name, email: appleEmail, nonce } = req.body;
    
    if (!provider || !id_token) {
      return res.status(400).json({ error: 'Provider and id_token are required' });
    }
    
    let email, name, providerId;
    
    if (provider === 'google') {
      try {
        const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
        if (!tokenInfoResponse.ok) {
          return res.status(401).json({ error: 'Invalid Google token' });
        }
        const googleUser = await tokenInfoResponse.json();
        
        if (GOOGLE_CLIENT_IDS.length > 0 && !GOOGLE_CLIENT_IDS.includes(googleUser.aud)) {
          console.error('[SOCIAL AUTH] Google token audience mismatch:', googleUser.aud);
          return res.status(401).json({ error: 'Invalid token audience' });
        }
        
        const now = Math.floor(Date.now() / 1000);
        if (googleUser.exp && parseInt(googleUser.exp) < now) {
          console.error('[SOCIAL AUTH] Google token expired');
          return res.status(401).json({ error: 'Token expired' });
        }
        
        email = googleUser.email;
        name = googleUser.name || googleUser.email.split('@')[0];
        providerId = `google_${googleUser.sub}`;
      } catch (err) {
        console.error('[SOCIAL AUTH] Google token verification failed:', err);
        return res.status(401).json({ error: 'Failed to verify Google token' });
      }
    } else if (provider === 'apple') {
      if (!appleUserId) {
        return res.status(400).json({ error: 'Apple user ID is required' });
      }
      
      email = appleEmail;
      if (full_name) {
        const firstName = full_name.givenName || '';
        const lastName = full_name.familyName || '';
        name = `${firstName} ${lastName}`.trim() || (email ? email.split('@')[0] : 'Apple User');
      } else {
        name = email ? email.split('@')[0] : 'Apple User';
      }
      providerId = `apple_${appleUserId}`;
    } else {
      return res.status(400).json({ error: 'Unsupported provider' });
    }
    
    let user = await pool.query(
      'SELECT * FROM users WHERE social_provider_id = $1',
      [providerId]
    );
    
    if (user.rows.length === 0 && email) {
      user = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (user.rows.length > 0) {
        await pool.query(
          'UPDATE users SET social_provider_id = $1, social_provider = $2 WHERE id = $3',
          [providerId, provider, user.rows[0].id]
        );
        user = await pool.query('SELECT * FROM users WHERE id = $1', [user.rows[0].id]);
      }
    }
    
    if (user.rows.length === 0) {
      console.log('[SOCIAL AUTH] Creating new user for provider:', provider);
      const result = await pool.query(
        `INSERT INTO users (email, name, social_provider, social_provider_id, location, bio) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [email || `${providerId}@lusapp.local`, name, provider, providerId, 'Unknown', '']
      );
      user = result;
    }
    
    const dbUser = user.rows[0];
    
    const token = jwt.sign(
      { userId: dbUser.id, email: dbUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    const userData = {
      id: dbUser.id.toString(),
      email: dbUser.email,
      name: dbUser.name,
      location: dbUser.location,
      bio: dbUser.bio,
      favoriteSport: dbUser.favorite_sport,
      avatar: getFullAvatarUrl(req, dbUser.avatar),
      totalRaces: dbUser.total_races,
      joinedRaces: dbUser.joined_races || [],
      completedRaces: dbUser.completed_races || [],
      following: dbUser.following || [],
      followers: dbUser.followers || [],
    };
    
    console.log('[SOCIAL AUTH] Successfully authenticated user:', dbUser.id);
    res.json({ token, user: userData });
    
  } catch (error) {
    console.error('[SOCIAL AUTH] Error:', error);
    res.status(500).json({ error: 'Failed to authenticate with social provider' });
  }
});

router.post('/sync', verifyFirebaseTokenOnly, async (req, res) => {
  console.log('🔍 [AUTH SYNC] Starting user sync...');
  console.log('🔍 [AUTH SYNC] Request body:', JSON.stringify(req.body));
  console.log('🔍 [AUTH SYNC] req.user from middleware:', JSON.stringify(req.user));
  
  try {
    // SECURITY: Use verified token data instead of trusting request body
    const firebase_uid = req.user.firebaseUid;
    const email = req.user.email;
    const { name } = req.body;
    
    if (!firebase_uid || !email) {
      console.error('❌ [AUTH SYNC] Missing required fields in verified token');
      return res.status(400).json({ error: 'Invalid token data' });
    }
    
    console.log('🔍 [AUTH SYNC] Checking for existing user with firebase_uid:', firebase_uid);
    let user = await pool.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [firebase_uid]
    );
    
    if (user.rows.length === 0) {
      console.log('🔍 [AUTH SYNC] No user found with firebase_uid, checking by email:', email);
      user = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (user.rows.length > 0) {
        // SECURITY: Only allow firebase_uid update if the user doesn't already have one
        // This prevents account takeover by preventing reassignment of firebase_uid
        if (user.rows[0].firebase_uid) {
          console.error('❌ [AUTH SYNC] Email already linked to different Firebase UID');
          return res.status(409).json({ 
            error: 'This email is already associated with a different account' 
          });
        }
        
        console.log('🔍 [AUTH SYNC] Found existing user by email (no firebase_uid), linking accounts');
        await pool.query(
          'UPDATE users SET firebase_uid = $1 WHERE id = $2',
          [firebase_uid, user.rows[0].id]
        );
        
        // Reload user data after update
        user = await pool.query(
          'SELECT * FROM users WHERE id = $1',
          [user.rows[0].id]
        );
      } else {
        console.log('🔍 [AUTH SYNC] No existing user, creating new user');
        const result = await pool.query(
          `INSERT INTO users (firebase_uid, email, name, location, bio) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING *`,
          [firebase_uid, email, name || email.split('@')[0], 'Unknown', '']
        );
        user = result;
        console.log('✅ [AUTH SYNC] New user created with ID:', user.rows[0].id);
      }
    } else {
      console.log('✅ [AUTH SYNC] Found existing user with firebase_uid:', user.rows[0].id);
    }
    
    const dbUser = user.rows[0];
    
    const userData = {
      id: dbUser.id.toString(),
      email: dbUser.email,
      name: dbUser.name,
      location: dbUser.location,
      bio: dbUser.bio,
      favoriteSport: dbUser.favorite_sport,
      avatar: getFullAvatarUrl(req, dbUser.avatar),
      totalRaces: dbUser.total_races,
      joined_races: dbUser.joined_races || [],
      completed_races: dbUser.completed_races || [],
      followers: dbUser.followers || [],
      following: dbUser.following || [],
      created_at: dbUser.created_at,
    };
    
    req.user.userId = dbUser.id;
    
    console.log('✅ [AUTH SYNC] User sync successful, returning user data');
    res.json({ user: userData });
  } catch (error) {
    console.error('❌ [AUTH SYNC] Sync error:', error.message);
    console.error('❌ [AUTH SYNC] Full error stack:', error.stack);
    console.error('❌ [AUTH SYNC] Error details:', {
      name: error.name,
      code: error.code,
      detail: error.detail,
    });
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

module.exports = router;
