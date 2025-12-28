import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all options
router.get('/', async (req, res, next) => {
  try {
    const [options] = await pool.execute(`
      SELECT * FROM product_options ORDER BY name ASC
    `);
    
    const transformedOptions = options.map(opt => ({
      id: opt.id,
      code: opt.code,
      name: opt.name,
      price: parseFloat(opt.price) || 0,
      description: opt.description || null,
    }));
    
    res.json(transformedOptions);
  } catch (error) {
    next(error);
  }
});

// Get option by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [options] = await pool.execute(`
      SELECT * FROM product_options WHERE id = ?
    `, [id]);
    
    if (options.length === 0) {
      return res.status(404).json({ error: 'Option not found' });
    }
    
    const option = options[0];
    res.json({
      id: option.id,
      code: option.code,
      name: option.name,
      price: parseFloat(option.price) || 0,
      description: option.description || null,
    });
  } catch (error) {
    next(error);
  }
});

// Create option
router.post('/', async (req, res, next) => {
  try {
    const { name, price, description } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    // Generate code from name (lowercase, replace spaces with hyphens, remove special chars)
    const code = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-6);
    
    const [result] = await pool.execute(`
      INSERT INTO product_options (code, name, price, description)
      VALUES (?, ?, ?, ?)
    `, [code, name, parseFloat(price), description || null]);
    
    res.status(201).json({ id: result.insertId, code, message: 'Option created' });
  } catch (error) {
    next(error);
  }
});

// Update option
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, description } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    await pool.execute(`
      UPDATE product_options
      SET name = ?, price = ?, description = ?
      WHERE id = ?
    `, [name, parseFloat(price), description || null, id]);
    
    res.json({ id, message: 'Option updated' });
  } catch (error) {
    next(error);
  }
});

// Delete option
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if option is used in any products
    const [used] = await pool.execute(`
      SELECT COUNT(*) as count FROM product_product_options WHERE option_id = ?
    `, [id]);
    
    if (used[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete option that is used in products. Remove it from all products first.' 
      });
    }
    
    await pool.execute('DELETE FROM product_options WHERE id = ?', [id]);
    res.json({ id, message: 'Option deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

