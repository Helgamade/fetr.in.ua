import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all team members
router.get('/', async (req, res, next) => {
  try {
    const [members] = await pool.execute(`
      SELECT id, name, role, photo, description, sort_order, is_active, created_at, updated_at
      FROM team_members
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, created_at ASC
    `);
    res.json(members);
  } catch (error) {
    next(error);
  }
});

// Get team member by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [members] = await pool.execute(`
      SELECT * FROM team_members WHERE id = ?
    `, [id]);

    if (members.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.json(members[0]);
  } catch (error) {
    next(error);
  }
});

// Create team member
router.post('/', async (req, res, next) => {
  try {
    const { name, role, photo, description, sort_order, is_active } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO team_members (name, role, photo, description, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, role, photo || null, description || null, sort_order || 0, is_active !== undefined ? is_active : true]);

    res.status(201).json({ id: result.insertId, message: 'Team member created' });
  } catch (error) {
    next(error);
  }
});

// Update team member
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, photo, description, sort_order, is_active } = req.body;

    await pool.execute(`
      UPDATE team_members SET
        name = ?, role = ?, photo = ?, description = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `, [name, role, photo || null, description || null, sort_order, is_active, id]);

    res.json({ id, message: 'Team member updated' });
  } catch (error) {
    next(error);
  }
});

// Delete team member
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM team_members WHERE id = ?', [id]);
    res.json({ message: 'Team member deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

