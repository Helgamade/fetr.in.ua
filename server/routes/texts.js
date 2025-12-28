import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET all texts (группированные по namespace)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM site_texts ORDER BY namespace, `key`'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// GET texts by namespace (для ленивой загрузки)
router.get('/namespace/:namespace', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT `key`, value FROM site_texts WHERE namespace = ?',
      [req.params.namespace]
    );
    
    // Преобразуем в формат i18next: { key: value }
    const resources = {};
    rows.forEach(row => {
      // Убираем namespace из ключа для формата i18next
      const key = row.key.replace(`${req.params.namespace}.`, '');
      resources[key] = row.value;
    });
    
    res.json(resources);
  } catch (error) {
    next(error);
  }
});

// GET single text by key
router.get('/key/:key', async (req, res, next) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const [rows] = await pool.execute(
      'SELECT value FROM site_texts WHERE `key` = ?',
      [key]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Text not found' });
    }
    res.json({ value: rows[0].value });
  } catch (error) {
    next(error);
  }
});

// PUT update text
router.put('/:id', async (req, res, next) => {
  try {
    const { value, description } = req.body;
    await pool.execute(
      'UPDATE site_texts SET value = ?, description = ? WHERE id = ?',
      [value, description || null, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST create text
router.post('/', async (req, res, next) => {
  try {
    const { key, value, namespace, description } = req.body;
    
    // Проверка формата ключа (namespace.key)
    if (!key || !key.includes('.')) {
      return res.status(400).json({ error: 'Key must be in format: namespace.key' });
    }
    
    // Извлекаем namespace из ключа, если не передан
    const finalNamespace = namespace || key.split('.')[0];
    
    await pool.execute(
      'INSERT INTO site_texts (`key`, value, namespace, description) VALUES (?, ?, ?, ?)',
      [key, value, finalNamespace, description || null]
    );
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Key already exists' });
    }
    next(error);
  }
});

// DELETE text
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM site_texts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;

