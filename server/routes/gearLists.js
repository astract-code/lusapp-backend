const express = require('express');
const { combinedAuthMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

module.exports = (pool) => {

  router.get('/:groupId/gear-lists', combinedAuthMiddleware, async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.userId;

      const memberCheck = await pool.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to view gear lists' });
      }

      const result = await pool.query(`
        SELECT 
          gl.id, gl.title, gl.race_id, gl.visibility, gl.owner_id, gl.created_at,
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
          AND (
            gl.visibility = 'collaborative'
            OR gl.owner_id = $2
          )
        ORDER BY gl.created_at DESC
      `, [groupId, userId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching gear lists:', error);
      res.status(500).json({ error: 'Failed to fetch gear lists' });
    }
  });

  router.post('/:groupId/gear-lists', combinedAuthMiddleware, async (req, res) => {
    try {
      const { groupId } = req.params;
      const { title, raceId, visibility } = req.body;
      const userId = req.user.userId;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'List title is required' });
      }

      const listVisibility = visibility || 'collaborative';
      if (!['collaborative', 'personal'].includes(listVisibility)) {
        return res.status(400).json({ error: 'Invalid visibility type' });
      }

      const memberCheck = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to create gear lists' });
      }

      const ownerId = listVisibility === 'personal' ? userId : null;

      const result = await pool.query(`
        INSERT INTO group_gear_lists (group_id, race_id, title, visibility, owner_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, group_id, race_id, title, visibility, owner_id, created_by, created_at
      `, [groupId, raceId || null, title.trim(), listVisibility, ownerId, userId]);

      res.json({ success: true, list: result.rows[0] });
    } catch (error) {
      console.error('Error creating gear list:', error);
      res.status(500).json({ error: 'Failed to create gear list', details: error.message });
    }
  });

  router.get('/:groupId/gear-lists/:listId/items', combinedAuthMiddleware, async (req, res) => {
    try {
      const { groupId, listId } = req.params;
      const userId = req.user.userId;

      const memberCheck = await pool.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to view gear items' });
      }

      const listCheck = await pool.query(
        'SELECT visibility, owner_id FROM group_gear_lists WHERE id = $1',
        [listId]
      );

      if (listCheck.rows.length === 0) {
        return res.status(404).json({ error: 'List not found' });
      }

      const { visibility, owner_id } = listCheck.rows[0];

      if (visibility === 'personal' && owner_id !== userId) {
        return res.status(403).json({ error: 'This is a private list' });
      }

      const result = await pool.query(`
        SELECT 
          gi.id, gi.description, gi.status, gi.created_at,
          u1.id as added_by_id,
          u1.name as added_by_name,
          u1.avatar as added_by_avatar,
          u2.id as claimed_by_id,
          u2.name as claimed_by_name,
          u2.avatar as claimed_by_avatar,
          CASE WHEN gt.user_id IS NOT NULL THEN true ELSE false END as my_tick
        FROM group_gear_items gi
        LEFT JOIN users u1 ON gi.added_by = u1.id
        LEFT JOIN users u2 ON gi.claimed_by = u2.id
        LEFT JOIN group_gear_item_ticks gt ON gt.item_id = gi.id AND gt.user_id = $2
        WHERE gi.list_id = $1
        ORDER BY gi.created_at ASC
      `, [listId, userId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching gear items:', error);
      res.status(500).json({ error: 'Failed to fetch gear items' });
    }
  });

  router.post('/:groupId/gear-lists/:listId/items', combinedAuthMiddleware, async (req, res) => {
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

      const listCheck = await pool.query(
        'SELECT visibility, owner_id FROM group_gear_lists WHERE id = $1',
        [listId]
      );

      if (listCheck.rows.length === 0) {
        return res.status(404).json({ error: 'List not found' });
      }

      const { visibility, owner_id } = listCheck.rows[0];
      if (visibility === 'personal' && owner_id !== userId) {
        return res.status(403).json({ error: 'Only the list owner can add items to a private list' });
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
          added_by_avatar: userResult.rows[0].avatar,
          my_tick: false
        }
      });
    } catch (error) {
      console.error('Error adding gear item:', error);
      res.status(500).json({ error: 'Failed to add gear item' });
    }
  });

  router.patch('/:groupId/gear-lists/:listId/items/:itemId', combinedAuthMiddleware, async (req, res) => {
    try {
      const { groupId, listId, itemId } = req.params;
      const { action } = req.body;
      const userId = req.user.userId;

      if (action !== 'claim') {
        return res.status(400).json({ error: 'Invalid action. Use action: "claim"' });
      }

      const memberCheck = await pool.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to claim items' });
      }

      const listCheck = await pool.query(
        'SELECT visibility FROM group_gear_lists WHERE id = $1',
        [listId]
      );

      if (listCheck.rows.length === 0) {
        return res.status(404).json({ error: 'List not found' });
      }

      if (listCheck.rows[0].visibility === 'personal') {
        return res.status(403).json({ error: 'Private lists do not support claiming' });
      }

      const itemCheck = await pool.query(
        'SELECT claimed_by FROM group_gear_items WHERE id = $1',
        [itemId]
      );

      if (itemCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const currentClaimer = itemCheck.rows[0].claimed_by;
      const isAlreadyClaimer = currentClaimer === userId;

      const newClaimedBy = isAlreadyClaimer ? null : userId;
      const newStatus = isAlreadyClaimer ? 'needed' : 'claimed';

      const result = await pool.query(`
        UPDATE group_gear_items
        SET status = $1, claimed_by = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, status, claimed_by
      `, [newStatus, newClaimedBy, itemId]);

      res.json({ success: true, item: result.rows[0], unclaimed: isAlreadyClaimer });
    } catch (error) {
      console.error('Error claiming gear item:', error);
      res.status(500).json({ error: 'Failed to claim gear item' });
    }
  });

  router.post('/:groupId/gear-lists/:listId/items/:itemId/tick', combinedAuthMiddleware, async (req, res) => {
    try {
      const { groupId, listId, itemId } = req.params;
      const userId = req.user.userId;

      const memberCheck = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to tick items' });
      }

      const listCheck = await pool.query(
        'SELECT visibility, owner_id FROM group_gear_lists WHERE id = $1',
        [listId]
      );

      if (listCheck.rows.length === 0) {
        return res.status(404).json({ error: 'List not found' });
      }

      const { visibility, owner_id } = listCheck.rows[0];
      if (visibility === 'personal' && owner_id !== userId) {
        return res.status(403).json({ error: 'Only the list owner can tick items on a private list' });
      }

      const existing = await pool.query(
        'SELECT 1 FROM group_gear_item_ticks WHERE item_id = $1 AND user_id = $2',
        [itemId, userId]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          'DELETE FROM group_gear_item_ticks WHERE item_id = $1 AND user_id = $2',
          [itemId, userId]
        );
        res.json({ success: true, ticked: false });
      } else {
        await pool.query(
          'INSERT INTO group_gear_item_ticks (item_id, user_id) VALUES ($1, $2)',
          [itemId, userId]
        );
        res.json({ success: true, ticked: true });
      }
    } catch (error) {
      console.error('Error toggling gear item tick:', error);
      res.status(500).json({ error: 'Failed to toggle tick' });
    }
  });

  router.delete('/:groupId/gear-lists/:listId/items/:itemId', combinedAuthMiddleware, async (req, res) => {
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
      const isCreator = item.rows[0].added_by === userId;

      if (!isCreator && role !== 'owner' && role !== 'moderator') {
        return res.status(403).json({ error: 'Only item creator or group moderators can delete items' });
      }

      await pool.query('DELETE FROM group_gear_items WHERE id = $1', [itemId]);

      res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting gear item:', error);
      res.status(500).json({ error: 'Failed to delete gear item' });
    }
  });

  router.get('/:groupId/gear-lists/:listId/share', combinedAuthMiddleware, async (req, res) => {
    try {
      const { groupId, listId } = req.params;
      const userId = req.user.userId;

      const memberCheck = await pool.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to share gear lists' });
      }

      const listResult = await pool.query(`
        SELECT 
          gl.title, gl.visibility, gl.owner_id, gl.race_id,
          r.name as race_name,
          r.date as race_date
        FROM group_gear_lists gl
        LEFT JOIN races r ON gl.race_id = r.id
        WHERE gl.id = $1
      `, [listId]);

      if (listResult.rows.length === 0) {
        return res.status(404).json({ error: 'List not found' });
      }

      const list = listResult.rows[0];

      if (list.visibility === 'personal' && list.owner_id !== userId) {
        return res.status(403).json({ error: 'Cannot share private list of another user' });
      }

      const itemsResult = await pool.query(`
        SELECT 
          gi.description, gi.status,
          u.name as claimed_by_name
        FROM group_gear_items gi
        LEFT JOIN users u ON gi.claimed_by = u.id
        WHERE gi.list_id = $1
        ORDER BY gi.created_at ASC
      `, [listId]);

      let shareText = `📋 ${list.title}\n`;

      if (list.race_name) {
        const raceDate = new Date(list.race_date);
        shareText += `🏃 ${list.race_name} - ${raceDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}\n`;
      }

      shareText += list.visibility === 'personal' ? '🔒 Private List\n' : '🌐 Public List\n';
      shareText += '\n';

      if (itemsResult.rows.length === 0) {
        shareText += 'No items yet';
      } else {
        itemsResult.rows.forEach(item => {
          if (item.status === 'claimed') {
            shareText += `[~] ${item.description}${item.claimed_by_name ? ` (${item.claimed_by_name})` : ''}\n`;
          } else {
            shareText += `[ ] ${item.description}\n`;
          }
        });
      }

      shareText += '\n📱 Created with Lusapp';

      res.json({ success: true, shareText });
    } catch (error) {
      console.error('Error generating share text:', error);
      res.status(500).json({ error: 'Failed to generate share text' });
    }
  });

  return router;
};
