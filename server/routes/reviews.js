import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all reviews
router.get('/', async (req, res, next) => {
  try {
    const [reviews] = await pool.execute(`
      SELECT id, name, text, rating, photo, is_approved, created_at, updated_at
      FROM reviews
      WHERE is_approved = TRUE
      ORDER BY created_at DESC
    `);
    
    // Convert dates
    reviews.forEach(review => {
      review.createdAt = new Date(review.created_at);
      review.updatedAt = new Date(review.updated_at);
      delete review.created_at;
      delete review.updated_at;
    });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

// Get review by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [reviews] = await pool.execute(`
      SELECT * FROM reviews WHERE id = ?
    `, [id]);

    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = reviews[0];
    review.createdAt = new Date(review.created_at);
    review.updatedAt = new Date(review.updated_at);
    delete review.created_at;
    delete review.updated_at;

    res.json(review);
  } catch (error) {
    next(error);
  }
});

// Create review
router.post('/', async (req, res, next) => {
  try {
    const { name, text, rating, photo, is_approved } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO reviews (name, text, rating, photo, is_approved)
      VALUES (?, ?, ?, ?, ?)
    `, [name, text, rating || null, photo || null, is_approved !== undefined ? is_approved : false]);

    res.status(201).json({ id: result.insertId, message: 'Review created' });
  } catch (error) {
    next(error);
  }
});

// Update review
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, text, rating, photo, is_approved } = req.body;

    await pool.execute(`
      UPDATE reviews SET
        name = ?, text = ?, rating = ?, photo = ?, is_approved = ?
      WHERE id = ?
    `, [name, text, rating || null, photo || null, is_approved, id]);

    res.json({ id, message: 'Review updated' });
  } catch (error) {
    next(error);
  }
});

// Delete review
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

