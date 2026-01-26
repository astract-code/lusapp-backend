const express = require('express');
const { combinedAuthMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

module.exports = (pool) => {
  
  // Helper: Update user's last_active timestamp
  const updateLastActive = async (userId) => {
    await pool.query('UPDATE users SET last_active = NOW() WHERE id = $1', [userId]);
  };

  // Helper: Check if user is app admin
  const isAppAdmin = async (userId) => {
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
    return result.rows[0]?.is_admin === true;
  };

  // Get total unread group message count across all groups
  // IMPORTANT: This must come BEFORE /:groupId/messages to avoid route conflicts
  router.get('/unread-count', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;

      // Get all groups the user is a member of (not archived)
      const memberGroups = await pool.query(
        'SELECT group_id FROM group_members WHERE user_id = $1 AND COALESCE(archived, false) = false',
        [userId]
      );

      if (memberGroups.rows.length === 0) {
        return res.json({ count: 0 });
      }

      const groupIds = memberGroups.rows.map(row => row.group_id);

      // Count unread messages across all groups (excluding deleted)
      const result = await pool.query(`
        SELECT COUNT(*)::integer as total_unread
        FROM group_messages gm
        WHERE gm.group_id = ANY($1)
        AND gm.sender_id != $2
        AND gm.deleted_at IS NULL
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

  // Get messages for a group (including pinned status, excluding deleted)
  router.get('/:groupId/messages', combinedAuthMiddleware, async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.userId;

      await updateLastActive(userId);

      const memberCheck = await pool.query(
        'SELECT id, last_active_at, muted, archived FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to view messages' });
      }

      // Get group info including announcement_mode
      const groupInfo = await pool.query(
        'SELECT announcement_mode FROM groups WHERE id = $1',
        [groupId]
      );

      // Get pinned messages first, then regular messages (excluding deleted)
      const messages = await pool.query(`
        SELECT 
          gm.id, gm.content, gm.created_at,
          gm.sender_id,
          gm.pinned,
          gm.pinned_by,
          u.name as sender_name,
          u.avatar as sender_avatar,
          pinner.name as pinned_by_name
        FROM group_messages gm
        INNER JOIN users u ON gm.sender_id = u.id
        LEFT JOIN users pinner ON gm.pinned_by = pinner.id
        WHERE gm.group_id = $1 AND gm.deleted_at IS NULL
        ORDER BY gm.pinned DESC, gm.created_at ASC
      `, [groupId]);

      // Mark all unread messages in this group as read for this user (bulk insert)
      if (messages.rows.length > 0) {
        await pool.query(`
          INSERT INTO group_message_reads (message_id, user_id)
          SELECT gm.id, $2
          FROM group_messages gm
          WHERE gm.group_id = $1
          AND gm.sender_id != $2
          AND gm.deleted_at IS NULL
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

      res.json({ 
        messages: messages.rows,
        announcementMode: groupInfo.rows[0]?.announcement_mode || false,
        muted: memberCheck.rows[0]?.muted || false,
        archived: memberCheck.rows[0]?.archived || false
      });
    } catch (error) {
      console.error('Error fetching group messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Search messages in a group
  router.get('/:groupId/search', combinedAuthMiddleware, async (req, res) => {
    try {
      const { groupId } = req.params;
      const { q } = req.query;
      const userId = req.user.userId;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
      }

      // Verify membership
      const memberCheck = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to search messages' });
      }

      // Search messages
      const messages = await pool.query(`
        SELECT 
          gm.id,
          gm.sender_id,
          gm.content,
          gm.created_at,
          u.name as sender_name
        FROM group_messages gm
        JOIN users u ON gm.sender_id = u.id
        WHERE gm.group_id = $1 
        AND gm.deleted_at IS NULL
        AND gm.content ILIKE $2
        ORDER BY gm.created_at DESC
        LIMIT 50
      `, [groupId, `%${q.trim()}%`]);

      res.json({ messages: messages.rows });
    } catch (error) {
      console.error('Error searching group messages:', error);
      res.status(500).json({ error: 'Failed to search messages' });
    }
  });

  // Send a message (respects announcement_mode)
  router.post('/:groupId/messages', combinedAuthMiddleware, async (req, res) => {
    try {
      const { groupId } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      await updateLastActive(userId);

      const memberCheck = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to send messages' });
      }

      // Check announcement mode
      const groupInfo = await pool.query(
        'SELECT announcement_mode FROM groups WHERE id = $1',
        [groupId]
      );

      if (groupInfo.rows[0]?.announcement_mode) {
        // Only admins can post in announcement mode
        const userIsAdmin = await isAppAdmin(userId);
        if (!userIsAdmin) {
          return res.status(403).json({ error: 'Only admins can post when announcement mode is enabled' });
        }
      }

      const result = await pool.query(`
        INSERT INTO group_messages (group_id, sender_id, content)
        VALUES ($1, $2, $3)
        RETURNING id, group_id, sender_id, content, created_at, pinned
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

  // Delete a message (soft delete - own messages only, or any if admin)
  router.delete('/:groupId/messages/:messageId', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const messageId = parseInt(req.params.messageId);
      const groupId = parseInt(req.params.groupId);

      const userIsAdmin = await isAppAdmin(userId);

      // Get message
      const message = await pool.query(
        'SELECT sender_id FROM group_messages WHERE id = $1 AND group_id = $2 AND deleted_at IS NULL',
        [messageId, groupId]
      );

      if (message.rows.length === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check permission (owner or admin)
      if (message.rows[0].sender_id !== userId && !userIsAdmin) {
        return res.status(403).json({ error: 'Can only delete your own messages' });
      }

      // Soft delete
      await pool.query(
        'UPDATE group_messages SET deleted_at = NOW() WHERE id = $1',
        [messageId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting group message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });

  // Pin/unpin a message (admin only)
  router.post('/:groupId/messages/:messageId/pin', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const messageId = parseInt(req.params.messageId);
      const groupId = parseInt(req.params.groupId);
      const { pinned } = req.body;

      const userIsAdmin = await isAppAdmin(userId);
      if (!userIsAdmin) {
        return res.status(403).json({ error: 'Only admins can pin messages' });
      }

      // Verify message exists and belongs to group
      const message = await pool.query(
        'SELECT id FROM group_messages WHERE id = $1 AND group_id = $2 AND deleted_at IS NULL',
        [messageId, groupId]
      );

      if (message.rows.length === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }

      await pool.query(
        'UPDATE group_messages SET pinned = $1, pinned_by = $2 WHERE id = $3',
        [pinned === true, pinned === true ? userId : null, messageId]
      );

      res.json({ success: true, pinned: pinned === true });
    } catch (error) {
      console.error('Error pinning message:', error);
      res.status(500).json({ error: 'Failed to pin message' });
    }
  });

  // Toggle announcement mode (admin only)
  router.post('/:groupId/announcement-mode', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const groupId = parseInt(req.params.groupId);
      const { enabled } = req.body;

      const userIsAdmin = await isAppAdmin(userId);
      if (!userIsAdmin) {
        return res.status(403).json({ error: 'Only admins can toggle announcement mode' });
      }

      await pool.query(
        'UPDATE groups SET announcement_mode = $1 WHERE id = $2',
        [enabled === true, groupId]
      );

      res.json({ success: true, announcementMode: enabled === true });
    } catch (error) {
      console.error('Error toggling announcement mode:', error);
      res.status(500).json({ error: 'Failed to toggle announcement mode' });
    }
  });

  // Mute/unmute a group
  router.post('/:groupId/mute', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const groupId = parseInt(req.params.groupId);
      const { muted } = req.body;

      await pool.query(
        'UPDATE group_members SET muted = $1 WHERE group_id = $2 AND user_id = $3',
        [muted === true, groupId, userId]
      );

      res.json({ success: true, muted: muted === true });
    } catch (error) {
      console.error('Error muting group:', error);
      res.status(500).json({ error: 'Failed to mute group' });
    }
  });

  // Archive/unarchive a group
  router.post('/:groupId/archive', combinedAuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const groupId = parseInt(req.params.groupId);
      const { archived } = req.body;

      await pool.query(
        'UPDATE group_members SET archived = $1 WHERE group_id = $2 AND user_id = $3',
        [archived === true, groupId, userId]
      );

      res.json({ success: true, archived: archived === true });
    } catch (error) {
      console.error('Error archiving group:', error);
      res.status(500).json({ error: 'Failed to archive group' });
    }
  });

  return router;
};
