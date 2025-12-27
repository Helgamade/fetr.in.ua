import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res, next) => {
  try {
    const [products] = await pool.execute(`
      SELECT * FROM products ORDER BY display_order ASC, created_at DESC
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
      product.options = options.map(opt => ({
        id: opt.id,
        code: opt.code,
        name: opt.name,
        price: parseFloat(opt.price) || 0,
        description: opt.description || null,
      }));

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

      // Transform snake_case to camelCase for frontend
      product.basePrice = parseFloat(product.base_price) || 0;
      product.salePrice = product.sale_price ? parseFloat(product.sale_price) : null;
      product.purchaseCount = parseInt(product.purchase_count) || 0;
      product.viewCount = parseInt(product.view_count) || 0;
      product.displayOrder = parseInt(product.display_order) || 0;
      product.shortDescription = product.short_description;
      product.fullDescription = product.full_description;
      // Keep code field for comparison and cart
      product.code = product.code;
      
      // Remove snake_case fields
      delete product.base_price;
      delete product.sale_price;
      delete product.purchase_count;
      delete product.view_count;
      delete product.display_order;
      delete product.short_description;
      delete product.full_description;
      delete product.created_at;
      delete product.updated_at;
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
    product.options = options.map(opt => ({
      id: opt.id,
      code: opt.code,
      name: opt.name,
      price: parseFloat(opt.price) || 0,
      description: opt.description || null,
    }));

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

    // Transform snake_case to camelCase for frontend
      product.basePrice = parseFloat(product.base_price) || 0;
      product.salePrice = product.sale_price ? parseFloat(product.sale_price) : null;
      product.purchaseCount = parseInt(product.purchase_count) || 0;
      product.viewCount = parseInt(product.view_count) || 0;
      product.displayOrder = parseInt(product.display_order) || 0;
      product.shortDescription = product.short_description;
      product.fullDescription = product.full_description;
      // Keep code field for comparison and cart
      product.code = product.code;
      
      // Remove snake_case fields
      delete product.base_price;
      delete product.sale_price;
      delete product.purchase_count;
      delete product.view_count;
      delete product.display_order;
      delete product.short_description;
      delete product.full_description;
      delete product.created_at;
      delete product.updated_at;

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
      basePrice, salePrice, badge, stock, viewCount, purchaseCount, displayOrder,
      features, materials, canMake, suitableFor, options
    } = req.body;

    // Update main product fields
    await pool.execute(`
      UPDATE products SET
        name = ?, slug = ?, short_description = ?, full_description = ?,
        base_price = ?, sale_price = ?, badge = ?, stock = ?,
        view_count = ?, purchase_count = ?, display_order = ?
      WHERE id = ?
    `, [name, slug, shortDescription, fullDescription, basePrice, salePrice, badge, stock, viewCount || 0, purchaseCount || 0, displayOrder || 0, id]);

    // Update features (type = 'feature')
    await pool.execute('DELETE FROM product_features WHERE product_id = ? AND type = ?', [id, 'feature']);
    if (features && Array.isArray(features)) {
      for (let i = 0; i < features.length; i++) {
        await pool.execute(`
          INSERT INTO product_features (product_id, type, value, sort_order)
          VALUES (?, 'feature', ?, ?)
        `, [id, features[i], i]);
      }
    }

    // Update materials (type = 'material')
    await pool.execute('DELETE FROM product_features WHERE product_id = ? AND type = ?', [id, 'material']);
    if (materials && Array.isArray(materials)) {
      for (let i = 0; i < materials.length; i++) {
        const material = materials[i];
        await pool.execute(`
          INSERT INTO product_features (product_id, type, value, description, sort_order)
          VALUES (?, 'material', ?, ?, ?)
        `, [id, material.name || material, material.description || null, i]);
      }
    }

    // Update canMake (type = 'can_make')
    await pool.execute('DELETE FROM product_features WHERE product_id = ? AND type = ?', [id, 'can_make']);
    if (canMake && Array.isArray(canMake)) {
      for (let i = 0; i < canMake.length; i++) {
        await pool.execute(`
          INSERT INTO product_features (product_id, type, value, sort_order)
          VALUES (?, 'can_make', ?, ?)
        `, [id, canMake[i], i]);
      }
    }

    // Update suitableFor (type = 'suitable_for')
    await pool.execute('DELETE FROM product_features WHERE product_id = ? AND type = ?', [id, 'suitable_for']);
    if (suitableFor && Array.isArray(suitableFor)) {
      for (let i = 0; i < suitableFor.length; i++) {
        await pool.execute(`
          INSERT INTO product_features (product_id, type, value, sort_order)
          VALUES (?, 'suitable_for', ?, ?)
        `, [id, suitableFor[i], i]);
      }
    }

    // Update options (many-to-many relationship)
    await pool.execute('DELETE FROM product_product_options WHERE product_id = ?', [id]);
    if (options && Array.isArray(options)) {
      for (const optionId of options) {
        await pool.execute(`
          INSERT INTO product_product_options (product_id, option_id)
          VALUES (?, ?)
        `, [id, optionId]);
      }
    }

    res.json({ id, message: 'Product updated' });
  } catch (error) {
    next(error);
  }
});

// Get all product options (for admin)
router.get('/options/all', async (req, res, next) => {
  try {
    const [options] = await pool.execute(`
      SELECT * FROM product_options ORDER BY name ASC
    `);
    
    // Transform price to number
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

