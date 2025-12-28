import express from 'express';
import pool from '../db.js';
import { sanitizeString, sanitizeName, validateRating, checkRateLimit } from '../utils/sanitize.js';

const router = express.Router();

// Get all reviews (published only for public, all for admin)
router.get('/', async (req, res, next) => {
  try {
    // Get featured reviews first (max 4), then others
    const [featuredReviews] = await pool.execute(`
      SELECT id, name, text, rating, photo, is_approved, featured, created_at, updated_at
      FROM reviews
      WHERE is_approved = TRUE AND featured = TRUE
      ORDER BY RAND()
      LIMIT 4
    `);

    // Get other approved reviews if we have less than 4 featured
    const [otherReviews] = await pool.execute(`
      SELECT id, name, text, rating, photo, is_approved, featured, created_at, updated_at
      FROM reviews
      WHERE is_approved = TRUE AND (featured = FALSE OR featured IS NULL)
      ORDER BY created_at DESC
      LIMIT ?
    `, [Math.max(0, 4 - featuredReviews.length)]);

    const reviews = [...featuredReviews, ...otherReviews].slice(0, 4);
    
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
      SELECT id, name, text, rating, photo, is_approved, featured, created_at, updated_at
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

    // For user-submitted reviews, force is_approved to false (security)
    // For admin-created reviews, use provided value
    if (is_approved === undefined) {
      is_approved = false;
    }

    const featured = req.body.featured === true ? true : false;
    const created_at = req.body.created_at 
      ? new Date(req.body.created_at).toISOString().slice(0, 19).replace('T', ' ')
      : new Date().toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await pool.execute(`
      INSERT INTO reviews (name, text, rating, photo, is_approved, featured, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, text, rating, photo, is_approved, featured, created_at]);

    res.status(201).json({ id: result.insertId, message: 'Review created' });
  } catch (error) {
    next(error);
  }
});

// Update review
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let { name, text, rating, photo, is_approved, featured, created_at } = req.body;

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

    // Handle created_at if provided
    let createdAtValue = null;
    if (created_at) {
      const createdAtDate = new Date(created_at);
      if (!isNaN(createdAtDate.getTime())) {
        createdAtValue = createdAtDate.toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    await pool.execute(`
      UPDATE reviews SET
        name = COALESCE(?, name),
        text = COALESCE(?, text),
        rating = ?,
        photo = ?,
        is_approved = COALESCE(?, is_approved),
        featured = COALESCE(?, featured),
        created_at = COALESCE(?, created_at)
      WHERE id = ?
    `, [
      name || null, 
      text || null, 
      rating, 
      photo, 
      is_approved !== undefined ? is_approved : null,
      featured !== undefined ? featured : null,
      createdAtValue,
      id
    ]);

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

