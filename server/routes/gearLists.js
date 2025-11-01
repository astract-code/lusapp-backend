const express = require('express');
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');

const router = express.Router();

module.exports = (pool) => {
  
  router.get('/:groupId/gear-lists', verifyFirebaseToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.userId;

      const memberCheck = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to view gear lists' });
      }

      const result = await pool.query(`
        SELECT 
          gl.id, gl.title, gl.race_id, gl.created_at,
          u.name as creator_name,
          r.name as race_name,
          r.date as race_date,
          (
            SELECT COUNT(*)::int 
            FROM group_gear_items 
            WHERE list_id = gl.id
          ) as item_count
        FROM group_gear_lists gl
        LEFT JOIN users u ON gl.created_by = u.id
        LEFT JOIN races r ON gl.race_id = r.id
        WHERE gl.group_id = $1
        ORDER BY gl.created_at DESC
      `, [groupId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching gear lists:', error);
      res.status(500).json({ error: 'Failed to fetch gear lists' });
    }
  });

  router.post('/:groupId/gear-lists', verifyFirebaseToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const { title, raceId } = req.body;
      const userId = req.user.userId;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'List title is required' });
      }

      const memberCheck = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to create gear lists' });
      }

      const result = await pool.query(`
        INSERT INTO group_gear_lists (group_id, race_id, title, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id, group_id, race_id, title, created_by, created_at
      `, [groupId, raceId || null, title.trim(), userId]);

      res.json({ success: true, list: result.rows[0] });
    } catch (error) {
      console.error('Error creating gear list:', error);
      res.status(500).json({ error: 'Failed to create gear list' });
    }
  });

  router.get('/:groupId/gear-lists/:listId/items', verifyFirebaseToken, async (req, res) => {
    try {
      const { groupId, listId } = req.params;
      const userId = req.user.userId;

      const memberCheck = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to view gear items' });
      }

      const result = await pool.query(`
        SELECT 
          gi.id, gi.description, gi.status, gi.created_at,
          u1.id as added_by_id,
          u1.name as added_by_name,
          u1.avatar as added_by_avatar,
          u2.id as claimed_by_id,
          u2.name as claimed_by_name,
          u2.avatar as claimed_by_avatar
        FROM group_gear_items gi
        LEFT JOIN users u1 ON gi.added_by = u1.id
        LEFT JOIN users u2 ON gi.claimed_by = u2.id
        WHERE gi.list_id = $1
        ORDER BY 
          CASE gi.status
            WHEN 'needed' THEN 1
            WHEN 'claimed' THEN 2
            WHEN 'completed' THEN 3
          END,
          gi.created_at ASC
      `, [listId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching gear items:', error);
      res.status(500).json({ error: 'Failed to fetch gear items' });
    }
  });

  router.post('/:groupId/gear-lists/:listId/items', verifyFirebaseToken, async (req, res) => {
    try {
      const { groupId, listId } = req.params;
      const { description } = req.body;
      const userId = req.user.userId;

      if (!description || !description.trim()) {
        return res.status(400).json({ error: 'Item description is required' });
      }

      const memberCheck = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to add items' });
      }

      const result = await pool.query(`
        INSERT INTO group_gear_items (list_id, description, added_by, status)
        VALUES ($1, $2, $3, 'needed')
        RETURNING id, list_id, description, added_by, status, created_at
      `, [listId, description.trim(), userId]);

      const userResult = await pool.query(
        'SELECT name, avatar FROM users WHERE id = $1',
        [userId]
      );

      res.json({
        success: true,
        item: {
          ...result.rows[0],
          added_by_name: userResult.rows[0].name,
          added_by_avatar: userResult.rows[0].avatar
        }
      });
    } catch (error) {
      console.error('Error adding gear item:', error);
      res.status(500).json({ error: 'Failed to add gear item' });
    }
  });

  router.patch('/:groupId/gear-lists/:listId/items/:itemId', verifyFirebaseToken, async (req, res) => {
    try {
      const { groupId, itemId } = req.params;
      const { status } = req.body;
      const userId = req.user.userId;

      if (!['needed', 'claimed', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const memberCheck = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to update items' });
      }

      let claimedBy = null;
      if (status === 'claimed') {
        claimedBy = userId;
      }

      const result = await pool.query(`
        UPDATE group_gear_items
        SET status = $1, claimed_by = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, status, claimed_by
      `, [status, claimedBy, itemId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.json({ success: true, item: result.rows[0] });
    } catch (error) {
      console.error('Error updating gear item:', error);
      res.status(500).json({ error: 'Failed to update gear item' });
    }
  });

  router.delete('/:groupId/gear-lists/:listId/items/:itemId', verifyFirebaseToken, async (req, res) => {
    try {
      const { groupId, itemId } = req.params;
      const userId = req.user.userId;

      const memberCheck = await pool.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to delete items' });
      }

      const item = await pool.query(
        'SELECT added_by FROM group_gear_items WHERE id = $1',
        [itemId]
      );

      if (item.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const role = memberCheck.rows[0].role;
      const isOwner = item.rows[0].added_by === userId;

      if (!isOwner && role !== 'owner' && role !== 'moderator') {
        return res.status(403).json({ error: 'Only item creator or group moderators can delete items' });
      }

      await pool.query('DELETE FROM group_gear_items WHERE id = $1', [itemId]);

      res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting gear item:', error);
      res.status(500).json({ error: 'Failed to delete gear item' });
    }
  });

  return router;
};
