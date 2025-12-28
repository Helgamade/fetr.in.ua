import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all FAQs (with optional filter for published only)
router.get('/', async (req, res, next) => {
  try {
    const publishedOnly = req.query.published === 'true';
    let query = `
      SELECT id, question, answer, sort_order, is_published, created_at, updated_at
      FROM faqs
    `;
    
    if (publishedOnly) {
      query += ` WHERE is_published = TRUE`;
    }
    
    query += ` ORDER BY sort_order ASC, created_at ASC`;
    
    const [faqs] = await pool.execute(query);
    res.json(faqs);
  } catch (error) {
    next(error);
  }
});

// Get FAQ by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [faqs] = await pool.execute(`
      SELECT * FROM faqs WHERE id = ?
    `, [id]);

    if (faqs.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json(faqs[0]);
  } catch (error) {
    next(error);
  }
});

// Create FAQ
router.post('/', async (req, res, next) => {
  try {
    const { question, answer, sort_order, is_published } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO faqs (question, answer, sort_order, is_published)
      VALUES (?, ?, ?, ?)
    `, [question, answer, sort_order || 0, is_published !== undefined ? is_published : true]);

    res.status(201).json({ id: result.insertId, message: 'FAQ created' });
  } catch (error) {
    next(error);
  }
});

// Update FAQ
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question, answer, sort_order, is_published } = req.body;

    // Строим запрос динамически, обновляя только переданные поля
    const updateFields = [];
    const updateValues = [];

    if (question !== undefined) {
      updateFields.push('question = ?');
      updateValues.push(question);
    }
    if (answer !== undefined) {
      updateFields.push('answer = ?');
      updateValues.push(answer);
    }
    if (sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      updateValues.push(sort_order);
    }
    if (is_published !== undefined) {
      updateFields.push('is_published = ?');
      updateValues.push(is_published);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(`
      UPDATE faqs SET
        ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    res.json({ id, message: 'FAQ updated' });
  } catch (error) {
    next(error);
  }
});

// Delete FAQ
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM faqs WHERE id = ?', [id]);
    res.json({ message: 'FAQ deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;


