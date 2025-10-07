const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

module.exports = (pool) => {
  // Get all conversations for a user
  router.get('/conversations', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      
      const result = await pool.query(`
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
          (
            SELECT content 
            FROM messages 
            WHERE conversation_id = c.id 
            ORDER BY created_at DESC 
            LIMIT 1
          ) as last_message,
          (
            SELECT COUNT(*) 
            FROM messages 
            WHERE conversation_id = c.id 
            AND sender_id != $1 
            AND read = false
          ) as unread_count
        FROM conversations c
        JOIN users u1 ON c.user1_id = u1.id
        JOIN users u2 ON c.user2_id = u2.id
        WHERE c.user1_id = $1 OR c.user2_id = $1
        ORDER BY c.last_message_at DESC
      `, [userId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  // Get messages for a conversation
  router.get('/conversations/:otherUserId/messages', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const otherUserId = parseInt(req.params.otherUserId);

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

      // Get messages
      const messages = await pool.query(`
        SELECT 
          m.id,
          m.sender_id,
          m.content,
          m.read,
          m.created_at,
          u.name as sender_name,
          u.avatar as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
      `, [conversationId]);

      // Mark messages as read
      await pool.query(`
        UPDATE messages 
        SET read = true 
        WHERE conversation_id = $1 AND sender_id = $2 AND read = false
      `, [conversationId, otherUserId]);

      res.json({ conversationId, messages: messages.rows });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Send a message
  router.post('/conversations/:otherUserId/messages', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const otherUserId = parseInt(req.params.otherUserId);
      const { content } = req.body;

      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Message content is required' });
      }

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

  return router;
};
