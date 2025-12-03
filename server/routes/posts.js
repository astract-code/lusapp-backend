const express = require('express');
const { Pool } = require('pg');
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { type, raceId, content } = req.body;
    const userId = req.user.userId;
    
    // NOTE: 'race_created' is NOT in this allowlist - it can only be created server-side during race approval
    if (!type || !['signup', 'completion', 'general'].includes(type)) {
      return res.status(400).json({ error: 'Valid post type is required (signup, completion, or general)' });
    }
    
    if ((type === 'signup' || type === 'completion') && !raceId) {
      return res.status(400).json({ error: 'Race ID is required for signup/completion posts' });
    }
    
    const result = await pool.query(
      `INSERT INTO posts (user_id, type, race_id, timestamp, liked_by, comments)
       VALUES ($1, $2, $3, NOW(), ARRAY[]::text[], '[]'::text)
       RETURNING id, user_id, type, race_id, timestamp, liked_by, comments`,
      [userId, type, raceId || null]
    );
    
    const post = result.rows[0];
    
    res.status(201).json({
      id: post.id.toString(),
      userId: post.user_id.toString(),
      type: post.type,
      raceId: post.race_id ? post.race_id.toString() : null,
      timestamp: post.timestamp,
      likedBy: post.liked_by || [],
      comments: JSON.parse(post.comments || '[]')
    });
    
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.get('/feed', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    // Get all posts from all users
    const postsResult = await pool.query(
      `SELECT p.id, p.user_id, p.type, p.race_id, p.timestamp, p.liked_by, p.comments,
              u.name as user_name, u.avatar as user_avatar,
              r.name as race_name, r.sport_category, r.sport_subtype, r.city, r.country, r.date, r.distance
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN races r ON p.race_id = r.id
       ORDER BY p.timestamp DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    const posts = postsResult.rows.map(post => ({
      id: post.id.toString(),
      userId: post.user_id.toString(),
      userName: post.user_name,
      userAvatar: post.user_avatar,
      type: post.type,
      raceId: post.race_id ? post.race_id.toString() : null,
      raceName: post.race_name,
      sportCategory: post.sport_category,
      sportSubtype: post.sport_subtype,
      city: post.city,
      country: post.country,
      date: post.date,
      distance: post.distance,
      timestamp: post.timestamp,
      likedBy: post.liked_by || [],
      comments: JSON.parse(post.comments || '[]')
    }));
    
    // Also get recently added races (approved ones from the last 30 days)
    const racesResult = await pool.query(
      `SELECT r.id, r.name, r.sport_category, r.sport_subtype, r.city, r.country, r.date, r.distance, r.created_at
       FROM races r
       WHERE r.status = 'approved' 
       AND r.created_at > NOW() - INTERVAL '30 days'
       ORDER BY r.created_at DESC
       LIMIT 20`
    );
    
    // Convert recent races to feed items with type 'new_race'
    const recentRaces = racesResult.rows.map(race => ({
      id: `race_${race.id}`,
      userId: null,
      userName: 'Lusapp',
      userAvatar: null,
      type: 'new_race',
      raceId: race.id.toString(),
      raceName: race.name,
      sportCategory: race.sport_category,
      sportSubtype: race.sport_subtype,
      city: race.city,
      country: race.country,
      date: race.date,
      distance: race.distance,
      timestamp: race.created_at,
      likedBy: [],
      comments: []
    }));
    
    // Combine posts and recent races, sort by timestamp, and limit
    const combinedFeed = [...posts, ...recentRaces]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    res.json({ posts: combinedFeed });
    
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

router.post('/:postId/like', verifyFirebaseToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user.userId.toString();
    
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    
    const result = await pool.query(
      `UPDATE posts 
       SET liked_by = ARRAY(SELECT DISTINCT unnest(COALESCE(liked_by, ARRAY[]::text[]) || ARRAY[$1]))
       WHERE id = $2
       RETURNING liked_by`,
      [userId, postId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({
      success: true,
      likedBy: result.rows[0].liked_by || []
    });
    
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

router.delete('/:postId/unlike', verifyFirebaseToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user.userId.toString();
    
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    
    const result = await pool.query(
      `UPDATE posts 
       SET liked_by = array_remove(liked_by, $1)
       WHERE id = $2
       RETURNING liked_by`,
      [userId, postId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({
      success: true,
      likedBy: result.rows[0].liked_by || []
    });
    
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ error: 'Failed to unlike post' });
  }
});

router.post('/:postId/comment', verifyFirebaseToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user.userId;
    const { text } = req.body;
    
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const postResult = await pool.query(
      'SELECT comments FROM posts WHERE id = $1',
      [postId]
    );
    
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const userResult = await pool.query(
      'SELECT name, avatar FROM users WHERE id = $1',
      [userId]
    );
    
    const comments = JSON.parse(postResult.rows[0].comments || '[]');
    
    const newComment = {
      id: Date.now().toString(),
      userId: userId.toString(),
      userName: userResult.rows[0].name,
      userAvatar: userResult.rows[0].avatar,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };
    
    comments.push(newComment);
    
    await pool.query(
      'UPDATE posts SET comments = $1 WHERE id = $2',
      [JSON.stringify(comments), postId]
    );
    
    res.json({
      success: true,
      comment: newComment,
      comments
    });
    
  } catch (error) {
    console.error('Comment on post error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
