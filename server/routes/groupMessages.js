const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

module.exports = (pool) => {
  
  // Get total unread group message count across all groups
  // IMPORTANT: This must come BEFORE /:groupId/messages to avoid route conflicts
  router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;

      // Get all groups the user is a member of
      const memberGroups = await pool.query(
        'SELECT group_id FROM group_members WHERE user_id = $1',
        [userId]
      );

      if (memberGroups.rows.length === 0) {
        return res.json({ count: 0 });
      }

      const groupIds = memberGroups.rows.map(row => row.group_id);

      // Count unread messages across all groups
      const result = await pool.query(`
        SELECT COUNT(*)::integer as total_unread
        FROM group_messages gm
        WHERE gm.group_id = ANY($1)
        AND gm.sender_id != $2
        AND NOT EXISTS (
          SELECT 1 FROM group_message_reads gmr
          WHERE gmr.message_id = gm.id AND gmr.user_id = $2
        )
      `, [groupIds, userId]);

      res.json({ count: result.rows[0].total_unread });
    } catch (error) {
      console.error('Error fetching unread group message count:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  });

  router.get('/:groupId/messages', authMiddleware, async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.userId;

      const memberCheck = await pool.query(
        'SELECT id, last_active_at FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to view messages' });
      }

      const messages = await pool.query(`
        SELECT 
          gm.id, gm.content, gm.created_at,
          gm.sender_id,
          u.name as sender_name,
          u.avatar as sender_avatar
        FROM group_messages gm
        INNER JOIN users u ON gm.sender_id = u.id
        WHERE gm.group_id = $1
        ORDER BY gm.created_at ASC
      `, [groupId]);

      // Mark all unread messages in this group as read for this user (bulk insert)
      if (messages.rows.length > 0) {
        await pool.query(`
          INSERT INTO group_message_reads (message_id, user_id)
          SELECT gm.id, $2
          FROM group_messages gm
          WHERE gm.group_id = $1
          AND gm.sender_id != $2
          AND NOT EXISTS (
            SELECT 1 FROM group_message_reads gmr
            WHERE gmr.message_id = gm.id AND gmr.user_id = $2
          )
          ON CONFLICT (message_id, user_id) DO NOTHING
        `, [groupId, userId]);
      }

      await pool.query(
        'UPDATE group_members SET last_active_at = NOW() WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      res.json({ messages: messages.rows });
    } catch (error) {
      console.error('Error fetching group messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  router.post('/:groupId/messages', authMiddleware, async (req, res) => {
    try {
      const { groupId } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const memberCheck = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to send messages' });
      }

      const result = await pool.query(`
        INSERT INTO group_messages (group_id, sender_id, content)
        VALUES ($1, $2, $3)
        RETURNING id, group_id, sender_id, content, created_at
      `, [groupId, userId, content.trim()]);

      await pool.query(
        'UPDATE groups SET updated_at = NOW() WHERE id = $1',
        [groupId]
      );

      const message = result.rows[0];

      const userResult = await pool.query(
        'SELECT name, avatar FROM users WHERE id = $1',
        [userId]
      );

      res.json({
        success: true,
        message: {
          ...message,
          sender_name: userResult.rows[0].name,
          sender_avatar: userResult.rows[0].avatar
        }
      });
    } catch (error) {
      console.error('Error sending group message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  return router;
};
