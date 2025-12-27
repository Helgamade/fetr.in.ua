import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all comparison features with values for all products
router.get('/', async (req, res, next) => {
  try {
    // Get all features
    const [features] = await pool.execute(`
      SELECT * FROM comparison_features ORDER BY sort_order ASC
    `);

    // Get all products
    const [products] = await pool.execute(`
      SELECT id, code, name FROM products ORDER BY display_order ASC
    `);

    // Get all values
    const [values] = await pool.execute(`
      SELECT * FROM comparison_values
    `);

    // Build result: features with values for each product
    const result = features.map(feature => {
      const featureValues = {};
      products.forEach(product => {
        const value = values.find(v => 
          v.feature_key === feature.key_name && v.product_id === product.id
        );
        if (value) {
          if (feature.type === 'boolean' || value.is_boolean) {
            featureValues[product.code] = value.value === 'true';
          } else {
            featureValues[product.code] = value.value;
          }
        } else {
          featureValues[product.code] = null;
        }
      });
      return {
        id: feature.id,
        key: feature.key_name,
        label: feature.label,
        type: feature.type || 'text',
        sortOrder: feature.sort_order,
        values: featureValues
      };
    });

    res.json({
      features: result,
      products: products.map(p => ({ id: p.id, code: p.code, name: p.name }))
    });
  } catch (error) {
    next(error);
  }
});

// Update comparison value
router.put('/value', async (req, res, next) => {
  try {
    const { featureKey, productId, value } = req.body;

    if (!featureKey || !productId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get feature type to determine is_boolean
    const [features] = await pool.execute(`
      SELECT type FROM comparison_features WHERE key_name = ?
    `, [featureKey]);
    
    if (features.length === 0) {
      return res.status(404).json({ error: 'Feature not found' });
    }
    
    const featureType = features[0].type || 'text';
    const isBooleanValue = featureType === 'boolean';
    
    // For boolean type: store 'true' if value is truthy, null if falsy
    // For text type: store the string value directly
    const valueToStore = isBooleanValue 
      ? (value === true || value === 'true' ? 'true' : null)
      : String(value || '');

    await pool.execute(`
      INSERT INTO comparison_values (feature_key, product_id, value, is_boolean)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE value = VALUES(value), is_boolean = VALUES(is_boolean)
    `, [featureKey, productId, valueToStore, isBooleanValue]);

    res.json({ message: 'Value updated' });
  } catch (error) {
    next(error);
  }
});

// Create new feature
router.post('/feature', async (req, res, next) => {
  try {
    const { key, label, type, sortOrder } = req.body;

    if (!key || !label || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.execute(`
      INSERT INTO comparison_features (key_name, label, type, sort_order)
      VALUES (?, ?, ?, ?)
    `, [key, label, type, sortOrder || 0]);

    res.status(201).json({ id: result.insertId, key, label, type, sortOrder: sortOrder || 0 });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Feature with this key already exists' });
    }
    next(error);
  }
});

// Update feature
router.put('/feature/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { label, type, sortOrder } = req.body;

    await pool.execute(`
      UPDATE comparison_features
      SET label = ?, type = ?, sort_order = ?
      WHERE key_name = ?
    `, [label, type, sortOrder || 0, key]);

    res.json({ message: 'Feature updated' });
  } catch (error) {
    next(error);
  }
});

// Delete feature
router.delete('/feature/:key', async (req, res, next) => {
  try {
    const { key } = req.params;

    await pool.execute('DELETE FROM comparison_values WHERE feature_key = ?', [key]);
    await pool.execute('DELETE FROM comparison_features WHERE key_name = ?', [key]);

    res.json({ message: 'Feature deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

