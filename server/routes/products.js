import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res, next) => {
  try {
    const [products] = await pool.execute(`
      SELECT * FROM products ORDER BY created_at DESC
    `);

    // Get images for each product
    for (const product of products) {
      const [images] = await pool.execute(`
        SELECT url FROM product_images 
        WHERE product_id = ? 
        ORDER BY sort_order ASC
      `, [product.id]);
      product.images = images.map(img => img.url);

      // Get options
      const [options] = await pool.execute(`
        SELECT po.* FROM product_options po
        INNER JOIN product_product_options ppo ON po.id = ppo.option_id
        WHERE ppo.product_id = ?
        ORDER BY po.id
      `, [product.id]);
      product.options = options;

      // Get features
      const [features] = await pool.execute(`
        SELECT type, value, description, sort_order 
        FROM product_features 
        WHERE product_id = ? AND type = 'feature'
        ORDER BY sort_order ASC
      `, [product.id]);
      product.features = features.map(f => f.value);

      // Get materials
      const [materials] = await pool.execute(`
        SELECT value as name, description 
        FROM product_features 
        WHERE product_id = ? AND type = 'material'
        ORDER BY sort_order ASC
      `, [product.id]);
      product.materials = materials;

      // Get canMake
      const [canMake] = await pool.execute(`
        SELECT value 
        FROM product_features 
        WHERE product_id = ? AND type = 'can_make'
        ORDER BY sort_order ASC
      `, [product.id]);
      product.canMake = canMake.map(f => f.value);

      // Get suitableFor
      const [suitableFor] = await pool.execute(`
        SELECT value 
        FROM product_features 
        WHERE product_id = ? AND type = 'suitable_for'
        ORDER BY sort_order ASC
      `, [product.id]);
      product.suitableFor = suitableFor.map(f => f.value);
    }

    res.json(products);
  } catch (error) {
    next(error);
  }
});

// Get product by ID or slug
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [products] = await pool.execute(`
      SELECT * FROM products WHERE id = ? OR slug = ?
    `, [id, id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];

    // Get images
    const [images] = await pool.execute(`
      SELECT url FROM product_images 
      WHERE product_id = ? 
      ORDER BY sort_order ASC
    `, [product.id]);
    product.images = images.map(img => img.url);

    // Get options
    const [options] = await pool.execute(`
      SELECT po.* FROM product_options po
      INNER JOIN product_product_options ppo ON po.id = ppo.option_id
      WHERE ppo.product_id = ?
      ORDER BY po.id
    `, [product.id]);
    product.options = options;

    // Get features
    const [features] = await pool.execute(`
      SELECT value FROM product_features 
      WHERE product_id = ? AND type = 'feature'
      ORDER BY sort_order ASC
    `, [product.id]);
    product.features = features.map(f => f.value);

    // Get materials
    const [materials] = await pool.execute(`
      SELECT value as name, description 
      FROM product_features 
      WHERE product_id = ? AND type = 'material'
      ORDER BY sort_order ASC
    `, [product.id]);
    product.materials = materials;

    // Get canMake
    const [canMake] = await pool.execute(`
      SELECT value 
      FROM product_features 
      WHERE product_id = ? AND type = 'can_make'
      ORDER BY sort_order ASC
    `, [product.id]);
    product.canMake = canMake.map(f => f.value);

    // Get suitableFor
    const [suitableFor] = await pool.execute(`
      SELECT value 
      FROM product_features 
      WHERE product_id = ? AND type = 'suitable_for'
      ORDER BY sort_order ASC
    `, [product.id]);
    product.suitableFor = suitableFor.map(f => f.value);

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// Create product
router.post('/', async (req, res, next) => {
  try {
    const {
      id, name, slug, shortDescription, fullDescription,
      basePrice, salePrice, badge, stock, viewCount, purchaseCount,
      images, options, features, materials, canMake, suitableFor
    } = req.body;

    await pool.execute(`
      INSERT INTO products (id, name, slug, short_description, full_description, 
        base_price, sale_price, badge, stock, view_count, purchase_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        slug = VALUES(slug),
        short_description = VALUES(short_description),
        full_description = VALUES(full_description),
        base_price = VALUES(base_price),
        sale_price = VALUES(sale_price),
        badge = VALUES(badge),
        stock = VALUES(stock),
        view_count = VALUES(view_count),
        purchase_count = VALUES(purchase_count)
    `, [id, name, slug, shortDescription, fullDescription, basePrice, salePrice, badge, stock, viewCount || 0, purchaseCount || 0]);

    // Handle images, options, features etc. if provided
    // (simplified - full implementation would handle all relations)

    res.status(201).json({ id, message: 'Product created/updated' });
  } catch (error) {
    next(error);
  }
});

// Update product
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, slug, shortDescription, fullDescription,
      basePrice, salePrice, badge, stock, viewCount, purchaseCount
    } = req.body;

    await pool.execute(`
      UPDATE products SET
        name = ?, slug = ?, short_description = ?, full_description = ?,
        base_price = ?, sale_price = ?, badge = ?, stock = ?,
        view_count = ?, purchase_count = ?
      WHERE id = ?
    `, [name, slug, shortDescription, fullDescription, basePrice, salePrice, badge, stock, viewCount, purchaseCount, id]);

    res.json({ id, message: 'Product updated' });
  } catch (error) {
    next(error);
  }
});

// Delete product
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

