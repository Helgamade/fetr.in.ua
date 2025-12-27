import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all pages
router.get('/', async (req, res, next) => {
  try {
    const [pages] = await pool.execute(`
      SELECT * FROM pages ORDER BY created_at DESC
    `);
    res.json(pages);
  } catch (error) {
    next(error);
  }
});

// Get page by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const [pages] = await pool.execute(`
      SELECT * FROM pages WHERE slug = ? AND is_published = TRUE
    `, [slug]);

    if (pages.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json(pages[0]);
  } catch (error) {
    next(error);
  }
});

// Create page
router.post('/', async (req, res, next) => {
  try {
    const { slug, title, content, meta_title, meta_description, is_published } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO pages (slug, title, content, meta_title, meta_description, is_published)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [slug, title, content, meta_title || null, meta_description || null, is_published !== undefined ? is_published : true]);

    res.status(201).json({ id: result.insertId, message: 'Page created' });
  } catch (error) {
    next(error);
  }
});

// Update page
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { slug, title, content, meta_title, meta_description, is_published } = req.body;

    await pool.execute(`
      UPDATE pages SET
        slug = ?, title = ?, content = ?, meta_title = ?,
        meta_description = ?, is_published = ?
      WHERE id = ?
    `, [slug, title, content, meta_title || null, meta_description || null, is_published, id]);

    res.json({ id, message: 'Page updated' });
  } catch (error) {
    next(error);
  }
});

// Delete page
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM pages WHERE id = ?', [id]);
    res.json({ message: 'Page deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

