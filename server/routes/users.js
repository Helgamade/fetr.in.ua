import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res, next) => {
  try {
    const [users] = await pool.execute(`
      SELECT id, name, email, phone, role, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [users] = await pool.execute(`
      SELECT id, name, email, phone, role, is_active, created_at, updated_at
      FROM users WHERE id = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    next(error);
  }
});

// Create user
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, password_hash, role } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `, [name, email, phone || null, password_hash || null, role || 'user']);

    res.status(201).json({ id: result.insertId, message: 'User created' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    next(error);
  }
});

// Update user
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, is_active } = req.body;

    await pool.execute(`
      UPDATE users SET
        name = ?, email = ?, phone = ?, role = ?, is_active = ?
      WHERE id = ?
    `, [name, email, phone || null, role, is_active !== undefined ? is_active : true, id]);

    res.json({ id, message: 'User updated' });
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

