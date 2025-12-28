import express from 'express';
import pool from '../db.js';
import { sanitizeString, sanitizeName, validateRating, checkRateLimit } from '../utils/sanitize.js';

const router = express.Router();

// Get all reviews (published only for public, all for admin)
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

// Get all reviews (for admin - includes unapproved)
router.get('/all', async (req, res, next) => {
  try {
    const [reviews] = await pool.execute(`
      SELECT id, name, text, rating, photo, is_approved, created_at, updated_at
      FROM reviews
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
    // Rate limiting check - get IP from various sources
    const clientIp = req.ip || 
                     req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     'unknown';
    if (!checkRateLimit(clientIp, 3, 60000)) { // 3 requests per minute
      return res.status(429).json({ 
        error: 'Занадто багато запитів. Будь ласка, спробуйте пізніше.' 
      });
    }

    let { name, text, rating, photo, is_approved } = req.body;

    // Validate required fields
    if (!name || !text) {
      return res.status(400).json({ error: 'Ім\'я та текст відгуку обов\'язкові' });
    }

    // Sanitize and validate inputs
    name = sanitizeName(name);
    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Ім\'я має містити мінімум 2 символи' });
    }

    text = sanitizeString(text, 2000); // Max 2000 characters
    if (!text || text.length < 10) {
      return res.status(400).json({ error: 'Текст відгуку має містити мінімум 10 символів' });
    }

    rating = validateRating(rating);

    // Photo is optional, but if provided, sanitize URL
    if (photo && typeof photo === 'string') {
      photo = sanitizeString(photo, 500);
      // Basic URL validation
      if (photo && !/^https?:\/\/.+/.test(photo)) {
        photo = null; // Reject invalid URLs
      }
    } else {
      photo = null;
    }

    // Force is_approved to false for user-submitted reviews (security)
    is_approved = false;

    const [result] = await pool.execute(`
      INSERT INTO reviews (name, text, rating, photo, is_approved)
      VALUES (?, ?, ?, ?, ?)
    `, [name, text, rating, photo, is_approved]);

    res.status(201).json({ id: result.insertId, message: 'Review created' });
  } catch (error) {
    next(error);
  }
});

// Update review
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let { name, text, rating, photo, is_approved } = req.body;

    // Sanitize and validate inputs
    if (name !== undefined) {
      name = sanitizeName(name);
      if (!name || name.length < 2) {
        return res.status(400).json({ error: 'Ім\'я має містити мінімум 2 символи' });
      }
    }

    if (text !== undefined) {
      text = sanitizeString(text, 2000);
      if (!text || text.length < 10) {
        return res.status(400).json({ error: 'Текст відгуку має містити мінімум 10 символів' });
      }
    }

    if (rating !== undefined) {
      rating = validateRating(rating);
    }

    if (photo !== undefined && photo !== null) {
      if (typeof photo === 'string') {
        photo = sanitizeString(photo, 500);
        if (photo && !/^https?:\/\/.+/.test(photo)) {
          photo = null;
        }
      } else {
        photo = null;
      }
    }

    await pool.execute(`
      UPDATE reviews SET
        name = COALESCE(?, name),
        text = COALESCE(?, text),
        rating = ?,
        photo = ?,
        is_approved = COALESCE(?, is_approved)
      WHERE id = ?
    `, [name || null, text || null, rating, photo, is_approved !== undefined ? is_approved : null, id]);

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

