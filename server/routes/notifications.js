const express = require('express');
const { Pool } = require('pg');
const { combinedAuthMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

router.get('/', combinedAuthMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.user.userId, 10);
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const notificationsResult = await pool.query(
      `SELECT n.id, n.type, n.actor_id, n.post_id, n.message, n.is_read, n.created_at,
              u.name as actor_name, u.avatar as actor_avatar
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const unreadCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    
    const notifications = notificationsResult.rows.map(n => ({
      id: n.id,
      type: n.type,
      actorId: n.actor_id,
      actorName: n.actor_name,
      actorAvatar: n.actor_avatar,
      postId: n.post_id,
      message: n.message,
      isRead: n.is_read,
      createdAt: n.created_at
    }));
    
    res.json({
      notifications,
      unreadCount: parseInt(unreadCountResult.rows[0].count, 10)
    });
    
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

router.get('/unread-count', combinedAuthMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.user.userId, 10);
    
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    
    res.json({ unreadCount: parseInt(result.rows[0].count, 10) });
    
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

router.put('/:notificationId/read', combinedAuthMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.user.userId, 10);
    const notificationId = parseInt(req.params.notificationId, 10);
    
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.put('/read-all', combinedAuthMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.user.userId, 10);
    
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

router.delete('/:notificationId', combinedAuthMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.user.userId, 10);
    const notificationId = parseInt(req.params.notificationId, 10);
    
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
