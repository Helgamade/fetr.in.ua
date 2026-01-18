import express from 'express';
import pool from '../db.js';
import { sanitizeString, sanitizeName, validateRating, checkRateLimit } from '../utils/sanitize.js';

const router = express.Router();

// Get all reviews (published only for public, all for admin)
router.get('/', async (req, res, next) => {
  try {
    // Check if featured column exists by trying a simple query
    let reviews;
    try {
      // Try to get featured reviews (if column exists)
      const [featuredReviews] = await pool.execute(`
        SELECT id, name, text, rating, photo, is_approved, featured, created_at, updated_at
        FROM reviews
        WHERE is_approved = TRUE AND featured = TRUE
        ORDER BY RAND()
        LIMIT 4
      `);

      // Get other approved reviews if we have less than 4 featured (random order)
      const [otherReviews] = await pool.execute(`
        SELECT id, name, text, rating, photo, is_approved, featured, created_at, updated_at
        FROM reviews
        WHERE is_approved = TRUE AND (featured = FALSE OR featured IS NULL)
        ORDER BY RAND()
        LIMIT ?
      `, [Math.max(0, 4 - featuredReviews.length)]);

      reviews = [...featuredReviews, ...otherReviews].slice(0, 4);
    } catch (error) {
      // If featured column doesn't exist, fallback to regular query (random order)
      const [allReviews] = await pool.execute(`
        SELECT id, name, text, rating, photo, is_approved, created_at, updated_at
        FROM reviews
        WHERE is_approved = TRUE
        ORDER BY RAND()
        LIMIT 4
      `);
      reviews = allReviews.map(r => ({ ...r, featured: false }));
    }
    
    // Convert dates and ensure featured field
    reviews.forEach(review => {
      review.createdAt = new Date(review.created_at);
      review.updatedAt = new Date(review.updated_at);
      review.featured = review.featured || false;
      delete review.created_at;
      delete review.updated_at;
    });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

// Get all reviews with filters (for public page)
router.get('/all-public', async (req, res, next) => {
  try {
    const { rating, sort = 'newest', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;
    
    let whereConditions = ['is_approved = TRUE'];
    let params = [];
    
    if (rating) {
      whereConditions.push('rating = ?');
      params.push(parseInt(rating as string));
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    let orderBy = 'created_at DESC';
    if (sort === 'oldest') {
      orderBy = 'created_at ASC';
    } else if (sort === 'rating_high') {
      orderBy = 'rating DESC, created_at DESC';
    } else if (sort === 'rating_low') {
      orderBy = 'rating ASC, created_at DESC';
    }
    
    // Get total count
    let totalCount = 0;
    try {
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM reviews
        ${whereClause}
      `, params);
      totalCount = parseInt(countResult[0]?.total || 0);
    } catch (error) {
      // Ignore count error
    }
    
    // Get paginated reviews
    let reviews;
    try {
      const [result] = await pool.execute(`
        SELECT id, name, text, rating, photo, is_approved, featured, created_at, updated_at
        FROM reviews
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `, [...params, limitNum, offset]);
      reviews = result;
    } catch (error) {
      const [result] = await pool.execute(`
        SELECT id, name, text, rating, photo, is_approved, created_at, updated_at
        FROM reviews
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `, [...params, limitNum, offset]);
      reviews = result.map(r => ({ ...r, featured: false }));
    }
    
    // Convert dates
    reviews.forEach(review => {
      review.createdAt = new Date(review.created_at);
      review.updatedAt = new Date(review.updated_at);
      review.featured = review.featured || false;
      delete review.created_at;
      delete review.updated_at;
    });
    
    // Get statistics
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
      FROM reviews
      WHERE is_approved = TRUE
    `);
    
    const stats = statsResult[0] || {
      total: 0,
      average_rating: 0,
      rating_5: 0,
      rating_4: 0,
      rating_3: 0,
      rating_2: 0,
      rating_1: 0
    };
    
    res.json({
      reviews,
      stats: {
        total: parseInt(stats.total) || 0,
        averageRating: parseFloat(stats.average_rating) || 0,
        byRating: {
          5: parseInt(stats.rating_5) || 0,
          4: parseInt(stats.rating_4) || 0,
          3: parseInt(stats.rating_3) || 0,
          2: parseInt(stats.rating_2) || 0,
          1: parseInt(stats.rating_1) || 0
        }
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get reviews statistics only
router.get('/stats', async (req, res, next) => {
  try {
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
      FROM reviews
      WHERE is_approved = TRUE
    `);
    
    const stats = statsResult[0] || {
      total: 0,
      average_rating: 0,
      rating_5: 0,
      rating_4: 0,
      rating_3: 0,
      rating_2: 0,
      rating_1: 0
    };
    
    res.json({
      total: parseInt(stats.total) || 0,
      averageRating: parseFloat(stats.average_rating) || 0,
      byRating: {
        5: parseInt(stats.rating_5) || 0,
        4: parseInt(stats.rating_4) || 0,
        3: parseInt(stats.rating_3) || 0,
        2: parseInt(stats.rating_2) || 0,
        1: parseInt(stats.rating_1) || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all reviews (for admin - includes unapproved)
router.get('/all', async (req, res, next) => {
  try {
    // Check if featured column exists
    let reviews;
    try {
      const [result] = await pool.execute(`
        SELECT id, name, text, rating, photo, is_approved, featured, created_at, updated_at
        FROM reviews
        ORDER BY created_at DESC
      `);
      reviews = result;
    } catch (error) {
      // If featured column doesn't exist, fallback to query without it
      const [result] = await pool.execute(`
        SELECT id, name, text, rating, photo, is_approved, created_at, updated_at
        FROM reviews
        ORDER BY created_at DESC
      `);
      reviews = result.map(r => ({ ...r, featured: false }));
    }
    
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

    // Handle created_at - if it's already in YYYY-MM-DD HH:mm:ss format, use it directly
    // Otherwise, parse it and format as local time
    let created_at;
    if (req.body.created_at) {
      if (typeof req.body.created_at === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(req.body.created_at)) {
        // Already in correct format (YYYY-MM-DD HH:mm:ss), use directly
        created_at = req.body.created_at;
      } else {
        // Parse and format as local time
        const date = new Date(req.body.created_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        created_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
    } else {
      // Use current time in local format
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      created_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // Try with featured column, fallback if it doesn't exist
    let result;
    try {
      const featured = req.body.featured === true ? true : false;
      [result] = await pool.execute(`
        INSERT INTO reviews (name, text, rating, photo, is_approved, featured, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [name, text, rating, photo, is_approved, featured, created_at]);
    } catch (error) {
      // Fallback without featured column
      [result] = await pool.execute(`
        INSERT INTO reviews (name, text, rating, photo, is_approved, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [name, text, rating, photo, is_approved, created_at]);
    }

    const reviewId = result.insertId;
    
    // Отправляем email уведомление админу о новом отзыве (асинхронно)
    (async () => {
      try {
        const { sendEmailToAdmin } = await import('../utils/emailService.js');
        const baseUrl = process.env.CORS_ORIGIN || 'https://fetr.in.ua';
        
        const templateData = {
          reviewerName: name,
          rating: rating,
          reviewText: text,
          reviewLink: `${baseUrl}/admin/reviews`
        };
        
        await sendEmailToAdmin('review_created_admin', templateData);
      } catch (emailError) {
        console.error('[Create Review] Помилка відправки email:', emailError);
      }
    })();
    
    res.status(201).json({ id: reviewId, message: 'Review created' });
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

    // Handle created_at if provided - use directly if in correct format, otherwise parse
    let createdAtValue = null;
    if (created_at) {
      if (typeof created_at === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(created_at)) {
        // Already in correct format (YYYY-MM-DD HH:mm:ss), use directly
        createdAtValue = created_at;
      } else {
        // Parse and format as local time
        const createdAtDate = new Date(created_at);
        if (!isNaN(createdAtDate.getTime())) {
          const year = createdAtDate.getFullYear();
          const month = String(createdAtDate.getMonth() + 1).padStart(2, '0');
          const day = String(createdAtDate.getDate()).padStart(2, '0');
          const hours = String(createdAtDate.getHours()).padStart(2, '0');
          const minutes = String(createdAtDate.getMinutes()).padStart(2, '0');
          const seconds = String(createdAtDate.getSeconds()).padStart(2, '0');
          createdAtValue = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
      }
    }

    // Try with featured column, fallback if it doesn't exist
    try {
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
    } catch (error) {
      // Fallback without featured column
      await pool.execute(`
        UPDATE reviews SET
          name = COALESCE(?, name),
          text = COALESCE(?, text),
          rating = ?,
          photo = ?,
          is_approved = COALESCE(?, is_approved),
          created_at = COALESCE(?, created_at)
        WHERE id = ?
      `, [
        name || null, 
        text || null, 
        rating, 
        photo, 
        is_approved !== undefined ? is_approved : null,
        createdAtValue,
        id
      ]);
    }

    // Если отзыв был одобрен, отправляем email (если есть email клиента)
    // Примечание: в текущей структуре БД нет email для отзывов, 
    // но можно добавить в будущем или использовать другой способ связи
    if (is_approved === true) {
      (async () => {
        try {
          // Получаем данные отзыва
          const [reviewData] = await pool.execute(`
            SELECT * FROM reviews WHERE id = ?
          `, [id]);
          
          if (reviewData.length > 0) {
            const review = reviewData[0];
            const baseUrl = process.env.CORS_ORIGIN || 'https://fetr.in.ua';
            
            // Если в будущем добавится email для отзывов, можно будет отправлять
            // const { sendEmail } = await import('../utils/emailService.js');
            // if (review.customer_email) {
            //   await sendEmail('review_approved', review.customer_email, {
            //     reviewLink: `${baseUrl}/reviews`
            //   });
            // }
          }
        } catch (emailError) {
          console.error('[Update Review] Помилка відправки email:', emailError);
        }
      })();
    }
    
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

