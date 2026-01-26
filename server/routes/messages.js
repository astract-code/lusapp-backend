const express = require('express');
const router = express.Router();
const { combinedAuthMiddleware } = require('../middleware/authMiddleware');

module.exports = (pool) => {
  
  // Helper: Update user's last_active timestamp
  const updateLastActive = async (userId) => {
    await pool.query('UPDATE users SET last_active = NOW() WHERE id = $1', [userId]);
  };

  // Get all conversations for a user (with muted/archived status)
  router.get('/conversations', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { includeArchived } = req.query;
      
      await updateLastActive(userId);
      
      let query = `
        SELECT DISTINCT
          c.id,
          c.user1_id,
          c.user2_id,
          c.last_message_at,
          CASE 
            WHEN c.user1_id = $1 THEN u2.id
            ELSE u1.id
          END as other_user_id,
          CASE 
            WHEN c.user1_id = $1 THEN u2.name
            ELSE u1.name
          END as other_user_name,
          CASE 
            WHEN c.user1_id = $1 THEN u2.avatar
            ELSE u1.avatar
          END as other_user_avatar,
          CASE 
            WHEN c.user1_id = $1 THEN u2.last_active
            ELSE u1.last_active
          END as other_user_last_active,
          (
            SELECT content 
            FROM messages 
            WHERE conversation_id = c.id AND deleted_at IS NULL
            ORDER BY created_at DESC 
            LIMIT 1
          ) as last_message,
          (
            SELECT COUNT(*) 
            FROM messages 
            WHERE conversation_id = c.id 
            AND sender_id != $1 
            AND read = false
            AND deleted_at IS NULL
          ) as unread_count,
          COALESCE(cs.muted, false) as muted,
          COALESCE(cs.archived, false) as archived
        FROM conversations c
        JOIN users u1 ON c.user1_id = u1.id
        JOIN users u2 ON c.user2_id = u2.id
        LEFT JOIN conversation_settings cs ON cs.conversation_id = c.id AND cs.user_id = $1
        WHERE (c.user1_id = $1 OR c.user2_id = $1)
      `;
      
      if (includeArchived !== 'true') {
        query += ` AND COALESCE(cs.archived, false) = false`;
      }
      
      query += ` ORDER BY c.last_message_at DESC`;
      
      const result = await pool.query(query, [userId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  // Get messages for a conversation (excluding deleted)
  router.get('/conversations/:otherUserId/messages', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const otherUserId = parseInt(req.params.otherUserId);

      await updateLastActive(userId);

      // Find or create conversation
      let conversation = await pool.query(`
        SELECT id FROM conversations 
        WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
      `, [userId, otherUserId]);

      if (conversation.rows.length === 0) {
        const newConv = await pool.query(`
          INSERT INTO conversations (user1_id, user2_id) 
          VALUES ($1, $2) 
          RETURNING id
        `, [Math.min(userId, otherUserId), Math.max(userId, otherUserId)]);
        conversation = newConv;
      }

      const conversationId = conversation.rows[0].id;

      // Get messages (excluding deleted)
      const messages = await pool.query(`
        SELECT 
          m.id,
          m.sender_id,
          m.content,
          m.read,
          m.read_at,
          m.created_at,
          u.name as sender_name,
          u.avatar as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1 AND m.deleted_at IS NULL
        ORDER BY m.created_at ASC
      `, [conversationId]);

      // Mark messages as read with timestamp
      await pool.query(`
        UPDATE messages 
        SET read = true, read_at = NOW()
        WHERE conversation_id = $1 AND sender_id = $2 AND read = false AND deleted_at IS NULL
      `, [conversationId, otherUserId]);

      // Get other user's online status
      const otherUser = await pool.query(
        'SELECT last_active FROM users WHERE id = $1',
        [otherUserId]
      );

      res.json({ 
        conversationId, 
        messages: messages.rows,
        otherUserLastActive: otherUser.rows[0]?.last_active 
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Get total unread message count (excluding deleted)
  router.get('/unread-count', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      
      const result = await pool.query(`
        SELECT COALESCE(SUM(unread), 0)::integer as total_unread
        FROM (
          SELECT COUNT(*) as unread
          FROM messages m
          JOIN conversations c ON m.conversation_id = c.id
          LEFT JOIN conversation_settings cs ON cs.conversation_id = c.id AND cs.user_id = $1
          WHERE (c.user1_id = $1 OR c.user2_id = $1)
          AND m.sender_id != $1
          AND m.read = false
          AND m.deleted_at IS NULL
          AND COALESCE(cs.archived, false) = false
          GROUP BY c.id
        ) as conversation_unreads
      `, [userId]);

      res.json({ count: result.rows[0].total_unread });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  });

  // Search messages in a conversation
  router.get('/conversations/:otherUserId/search', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const otherUserId = parseInt(req.params.otherUserId);
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
      }

      // Find conversation
      const conversation = await pool.query(`
        SELECT id FROM conversations 
        WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
      `, [userId, otherUserId]);

      if (conversation.rows.length === 0) {
        return res.json({ messages: [] });
      }

      const conversationId = conversation.rows[0].id;

      // Search messages
      const messages = await pool.query(`
        SELECT 
          m.id,
          m.sender_id,
          m.content,
          m.created_at,
          u.name as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1 
        AND m.deleted_at IS NULL
        AND m.content ILIKE $2
        ORDER BY m.created_at DESC
        LIMIT 50
      `, [conversationId, `%${q.trim()}%`]);

      res.json({ messages: messages.rows });
    } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json({ error: 'Failed to search messages' });
    }
  });

  // Send a message
  router.post('/conversations/:otherUserId/messages', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const otherUserId = parseInt(req.params.otherUserId);
      const { content } = req.body;

      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Message content is required' });
      }

      await updateLastActive(userId);

      // Find or create conversation
      let conversation = await pool.query(`
        SELECT id FROM conversations 
        WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
      `, [userId, otherUserId]);

      let conversationId;
      if (conversation.rows.length === 0) {
        const newConv = await pool.query(`
          INSERT INTO conversations (user1_id, user2_id) 
          VALUES ($1, $2) 
          RETURNING id
        `, [Math.min(userId, otherUserId), Math.max(userId, otherUserId)]);
        conversationId = newConv.rows[0].id;
      } else {
        conversationId = conversation.rows[0].id;
      }

      // Insert message
      const message = await pool.query(`
        INSERT INTO messages (conversation_id, sender_id, content) 
        VALUES ($1, $2, $3) 
        RETURNING id, sender_id, content, read, created_at
      `, [conversationId, userId, content.trim()]);

      // Update conversation last_message_at
      await pool.query(`
        UPDATE conversations 
        SET last_message_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [conversationId]);

      res.json(message.rows[0]);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Delete a message (soft delete - own messages only, or any if admin)
  router.delete('/messages/:messageId', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const messageId = parseInt(req.params.messageId);

      // Check if user is admin
      const adminCheck = await pool.query(
        'SELECT is_admin FROM users WHERE id = $1',
        [userId]
      );
      const isAdmin = adminCheck.rows[0]?.is_admin === true;

      // Get message
      const message = await pool.query(
        'SELECT sender_id, conversation_id FROM messages WHERE id = $1 AND deleted_at IS NULL',
        [messageId]
      );

      if (message.rows.length === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check permission (owner or admin)
      if (message.rows[0].sender_id !== userId && !isAdmin) {
        return res.status(403).json({ error: 'Can only delete your own messages' });
      }

      // Soft delete
      await pool.query(
        'UPDATE messages SET deleted_at = NOW() WHERE id = $1',
        [messageId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });

  // Mute/unmute a conversation
  router.post('/conversations/:conversationId/mute', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const conversationId = parseInt(req.params.conversationId);
      const { muted } = req.body;

      await pool.query(`
        INSERT INTO conversation_settings (user_id, conversation_id, muted)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, conversation_id) 
        DO UPDATE SET muted = $3
      `, [userId, conversationId, muted === true]);

      res.json({ success: true, muted: muted === true });
    } catch (error) {
      console.error('Error muting conversation:', error);
      res.status(500).json({ error: 'Failed to mute conversation' });
    }
  });

  // Archive/unarchive a conversation
  router.post('/conversations/:conversationId/archive', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const conversationId = parseInt(req.params.conversationId);
      const { archived } = req.body;

      await pool.query(`
        INSERT INTO conversation_settings (user_id, conversation_id, archived)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, conversation_id) 
        DO UPDATE SET archived = $3
      `, [userId, conversationId, archived === true]);

      res.json({ success: true, archived: archived === true });
    } catch (error) {
      console.error('Error archiving conversation:', error);
      res.status(500).json({ error: 'Failed to archive conversation' });
    }
  });

  // Get user online status
  router.get('/users/:userId/status', combinedAuthMiddleware, async (req, res) => {
    try {
      const targetUserId = parseInt(req.params.userId);

      const result = await pool.query(
        'SELECT last_active FROM users WHERE id = $1',
        [targetUserId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const lastActive = result.rows[0].last_active;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isOnline = lastActive && new Date(lastActive) > fiveMinutesAgo;

      res.json({ lastActive, isOnline });
    } catch (error) {
      console.error('Error fetching user status:', error);
      res.status(500).json({ error: 'Failed to fetch user status' });
    }
  });

  return router;
};
