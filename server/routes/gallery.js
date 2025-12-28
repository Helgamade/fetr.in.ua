import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all gallery images
router.get('/', async (req, res, next) => {
  try {
    const [images] = await pool.execute(`
      SELECT id, url, title, sort_order, is_published, created_at
      FROM gallery_images
      WHERE is_published = TRUE
      ORDER BY sort_order ASC, created_at ASC
    `);
    res.json(images);
  } catch (error) {
    next(error);
  }
});

// Get gallery image by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [images] = await pool.execute(`
      SELECT * FROM gallery_images WHERE id = ?
    `, [id]);

    if (images.length === 0) {
      return res.status(404).json({ error: 'Gallery image not found' });
    }

    res.json(images[0]);
  } catch (error) {
    next(error);
  }
});

// Create gallery image
router.post('/', async (req, res, next) => {
  try {
    const { url, title, sort_order, is_published } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO gallery_images (url, title, sort_order, is_published)
      VALUES (?, ?, ?, ?)
    `, [url, title || null, sort_order || 0, is_published !== undefined ? is_published : true]);

    res.status(201).json({ id: result.insertId, message: 'Gallery image created' });
  } catch (error) {
    next(error);
  }
});

// Update gallery image
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { url, title, sort_order, is_published } = req.body;

    await pool.execute(`
      UPDATE gallery_images SET
        url = ?, title = ?, sort_order = ?, is_published = ?
      WHERE id = ?
    `, [url, title || null, sort_order, is_published, id]);

    res.json({ id, message: 'Gallery image updated' });
  } catch (error) {
    next(error);
  }
});

// Delete gallery image
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM gallery_images WHERE id = ?', [id]);
    res.json({ message: 'Gallery image deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;


