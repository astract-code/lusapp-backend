const express = require('express');
const bcrypt = require('bcrypt');
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');

const router = express.Router();

module.exports = (pool) => {
  
  router.post('/create', verifyFirebaseToken, async (req, res) => {
    console.log('=== GROUP CREATE REQUEST ===');
    console.log('User ID:', req.user?.userId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const { name, sport_type, city, country, description, password } = req.body;
      const userId = req.user.userId;

      console.log('Parsed data - name:', name, 'sport_type:', sport_type);

      if (!name || !name.trim()) {
        console.log('ERROR: Group name is required');
        return res.status(400).json({ error: 'Group name is required' });
      }

      let passwordHash = null;
      if (password && password.trim()) {
        passwordHash = await bcrypt.hash(password, 12);
      }

      const result = await pool.query(
        `INSERT INTO groups (name, sport_type, city, country, description, password_hash, created_by, member_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
         RETURNING id, name, sport_type, city, country, description, created_by, member_count, created_at`,
        [name.trim(), sport_type || null, city || null, country || null, description || '', passwordHash, userId]
      );

      const group = result.rows[0];
      console.log('Group created in DB:', group.id);

      await pool.query(
        `INSERT INTO group_members (group_id, user_id, role)
         VALUES ($1, $2, 'owner')`,
        [group.id, userId]
      );
      console.log('Member record created');

      const response = {
        success: true,
        group: {
          ...group,
          hasPassword: !!passwordHash,
          role: 'owner'
        }
      };
      console.log('Sending success response:', response);
      res.json(response);
    } catch (error) {
      console.error('ERROR creating group:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({ error: 'Failed to create group', details: error.message });
    }
  });

  router.get('/race/:raceId', verifyFirebaseToken, async (req, res) => {
    try {
      const raceId = parseInt(req.params.raceId, 10);
      
      if (isNaN(raceId)) {
        return res.status(400).json({ error: 'Invalid race ID' });
      }
      
      const result = await pool.query(
        `SELECT 
          g.id, g.name, g.sport_type, g.city, g.country, g.description, 
          g.member_count, g.created_at, g.banner_url, g.race_id,
          (g.password_hash IS NOT NULL) as has_password,
          gm.role as user_role
        FROM groups g
        LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = $1
        WHERE g.race_id = $2`,
        [req.user.userId, raceId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Race group not found' });
      }
      
      res.json({ group: result.rows[0] });
    } catch (error) {
      console.error('Error fetching race group:', error);
      res.status(500).json({ error: 'Failed to fetch race group' });
    }
  });

  router.get('/search', verifyFirebaseToken, async (req, res) => {
    try {
      const { query, sport_type, city } = req.query;
      
      let sql = `
        SELECT 
          g.id, g.name, g.sport_type, g.city, g.country, g.description, 
          g.member_count, g.created_at, g.banner_url,
          (g.password_hash IS NOT NULL) as has_password,
          u.name as creator_name,
          CASE 
            WHEN gm.user_id IS NOT NULL THEN gm.role
            ELSE NULL
          END as user_role
        FROM groups g
        LEFT JOIN users u ON g.created_by = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = $1
        WHERE 1=1
      `;
      
      const params = [req.user.userId];
      let paramIndex = 2;

      if (query && query.trim()) {
        sql += ` AND LOWER(g.name) LIKE LOWER($${paramIndex})`;
        params.push(`%${query.trim()}%`);
        paramIndex++;
      }

      if (sport_type) {
        sql += ` AND g.sport_type = $${paramIndex}`;
        params.push(sport_type);
        paramIndex++;
      }

      if (city) {
        sql += ` AND g.city = $${paramIndex}`;
        params.push(city);
        paramIndex++;
      }

      sql += ` ORDER BY g.member_count DESC, g.created_at DESC LIMIT 50`;

      const result = await pool.query(sql, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error searching groups:', error);
      res.status(500).json({ error: 'Failed to search groups' });
    }
  });

  router.get('/my-groups', verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.user.userId;

      const result = await pool.query(`
        SELECT 
          g.id, g.name, g.sport_type, g.city, g.country, g.description,
          g.member_count, g.created_at, g.banner_url,
          gm.role,
          (
            SELECT COUNT(*)::int 
            FROM group_messages 
            WHERE group_id = g.id 
            AND created_at > gm.last_active_at
          ) as unread_count,
          (
            SELECT content
            FROM group_messages
            WHERE group_id = g.id
            ORDER BY created_at DESC
            LIMIT 1
          ) as last_message
        FROM groups g
        INNER JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = $1
        ORDER BY g.updated_at DESC
      `, [userId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching user groups:', error);
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  });

  router.get('/unread-count', verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.user.userId;

      const result = await pool.query(`
        SELECT COALESCE(SUM(unread), 0)::int as total_unread
        FROM (
          SELECT COUNT(*) as unread
          FROM group_messages gm
          INNER JOIN group_members mem ON gm.group_id = mem.group_id
          WHERE mem.user_id = $1
          AND gm.created_at > mem.last_active_at
        ) as subquery
      `, [userId]);

      res.json({ unread_count: result.rows[0]?.total_unread || 0 });
    } catch (error) {
      console.error('Error fetching group unread count:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  });

  router.get('/:groupId', verifyFirebaseToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.userId;

      const result = await pool.query(`
        SELECT 
          g.*,
          (g.password_hash IS NOT NULL) as has_password,
          u.name as creator_name,
          u.avatar as creator_avatar,
          gm.role as user_role
        FROM groups g
        LEFT JOIN users u ON g.created_by = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = $1
        WHERE g.id = $2
      `, [userId, groupId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const group = result.rows[0];
      delete group.password_hash;

      res.json(group);
    } catch (error) {
      console.error('Error fetching group details:', error);
      res.status(500).json({ error: 'Failed to fetch group details' });
    }
  });

  router.post('/:groupId/join', verifyFirebaseToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const { password } = req.body;
      const userId = req.user.userId;

      const groupResult = await pool.query(
        'SELECT password_hash FROM groups WHERE id = $1',
        [groupId]
      );

      if (groupResult.rows.length === 0) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const group = groupResult.rows[0];

      if (group.password_hash) {
        if (!password) {
          return res.status(400).json({ error: 'Password required to join this group' });
        }

        const passwordMatch = await bcrypt.compare(password, group.password_hash);
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Incorrect password' });
        }
      }

      const existingMember = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (existingMember.rows.length > 0) {
        return res.status(400).json({ error: 'Already a member of this group' });
      }

      await pool.query(
        'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
        [groupId, userId, 'member']
      );

      await pool.query(
        'UPDATE groups SET member_count = member_count + 1 WHERE id = $1',
        [groupId]
      );

      res.json({ success: true, message: 'Successfully joined group' });
    } catch (error) {
      console.error('Error joining group:', error);
      res.status(500).json({ error: 'Failed to join group' });
    }
  });

  router.post('/:groupId/leave', verifyFirebaseToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.userId;

      const memberResult = await pool.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberResult.rows.length === 0) {
        return res.status(400).json({ error: 'Not a member of this group' });
      }

      if (memberResult.rows[0].role === 'owner') {
        return res.status(400).json({ error: 'Group owner cannot leave. Transfer ownership or delete the group.' });
      }

      await pool.query(
        'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      await pool.query(
        'UPDATE groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = $1',
        [groupId]
      );

      res.json({ success: true, message: 'Successfully left group' });
    } catch (error) {
      console.error('Error leaving group:', error);
      res.status(500).json({ error: 'Failed to leave group' });
    }
  });

  router.get('/:groupId/members', verifyFirebaseToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.userId;

      const memberCheck = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Must be a member to view member list' });
      }

      const result = await pool.query(`
        SELECT 
          u.id as user_id, u.name, u.avatar, u.location, u.favorite_sport,
          gm.role, gm.joined_at
        FROM group_members gm
        INNER JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1
        ORDER BY 
          CASE gm.role 
            WHEN 'owner' THEN 1
            WHEN 'moderator' THEN 2
            ELSE 3
          END,
          gm.joined_at ASC
      `, [groupId]);

      res.json({ members: result.rows });
    } catch (error) {
      console.error('Error fetching group members:', error);
      res.status(500).json({ error: 'Failed to fetch group members' });
    }
  });

  router.delete('/:groupId', verifyFirebaseToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.userId;

      const result = await pool.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (result.rows.length === 0 || result.rows[0].role !== 'owner') {
        return res.status(403).json({ error: 'Only the group owner can delete the group' });
      }

      await pool.query('DELETE FROM groups WHERE id = $1', [groupId]);

      res.json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
      console.error('Error deleting group:', error);
      res.status(500).json({ error: 'Failed to delete group' });
    }
  });

  return router;
};
