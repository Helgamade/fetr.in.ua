import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { writeFileSync, readFileSync } from 'fs';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Настройка multer для загрузки изображений
// КРИТИЧНО: Путь должен быть абсолютным относительно server/routes/products.js
// server/routes/products.js -> server/ -> www/ -> www/uploads/products
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'products');
console.log('=== MULTER CONFIG ===');
console.log('__dirname:', __dirname);
console.log('uploadsDir (relative):', path.join(__dirname, '..', '..', 'uploads', 'products'));
console.log('uploadsDir (absolute):', path.resolve(uploadsDir));
console.log('uploadsDir exists:', existsSync(uploadsDir));

if (!existsSync(uploadsDir)) {
  console.log('Creating uploads directory:', uploadsDir);
  mkdirSync(uploadsDir, { recursive: true });
  console.log('Directory created, exists now:', existsSync(uploadsDir));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Убеждаемся, что папка существует
    if (!existsSync(uploadsDir)) {
      console.log('Directory missing in destination callback, creating:', uploadsDir);
      mkdirSync(uploadsDir, { recursive: true });
    }
    const absPath = path.resolve(uploadsDir);
    console.log('Multer destination callback:', absPath);
    cb(null, absPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `product-${uniqueSuffix}${ext}`;
    console.log('Multer filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    console.log('File filter:', { originalname: file.originalname, mimetype: file.mimetype, extname, mimetypeMatch: mimetype });
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Тільки зображення (jpeg, jpg, png, gif, webp) дозволені!'));
    }
  }
});

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
        SELECT po.*, ppo.sort_order FROM product_options po
        INNER JOIN product_product_options ppo ON po.id = ppo.option_id
        WHERE ppo.product_id = ?
        ORDER BY ppo.sort_order ASC, po.id ASC
      `, [product.id]);
      product.options = options.map(opt => ({
        id: opt.id,
        code: opt.code,
        name: opt.name,
        price: parseFloat(opt.price) || 0,
        description: opt.description || null,
        icon: opt.icon || null,
      }));

      // Get features
      const [features] = await pool.execute(`
        SELECT type, value, description, sort_order 
        FROM product_features 
        WHERE product_id = ? AND type = 'feature'
        ORDER BY sort_order ASC
      `, [product.id]);
      product.features = features.map(f => f.value);

      // Get materials (new structure)
      const [materials] = await pool.execute(`
        SELECT m.*, pm.sort_order
        FROM materials m
        INNER JOIN product_materials pm ON m.id = pm.material_id
        WHERE pm.product_id = ?
        ORDER BY pm.sort_order ASC, m.id ASC
      `, [product.id]);
      product.materials = materials.map(mat => ({
        id: mat.id,
        name: mat.name,
        description: mat.description || null,
        image: mat.image || null,
        thumbnail: mat.thumbnail || null,
      }));

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
      product.actualPurchaseCount = parseInt(product.actual_purchase_count) || 0;
      product.dailySalesTarget = product.daily_sales_target ? parseInt(product.daily_sales_target) : null;
      product.displayOrder = parseInt(product.display_order) || 0;
      product.shortDescription = product.short_description;
      product.fullDescription = product.full_description;
      product.sectionIconFeatures = product.section_icon_features || null;
      product.sectionIconMaterials = product.section_icon_materials || null;
      product.sectionIconCanMake = product.section_icon_can_make || null;
      product.sectionIconSuitableFor = product.section_icon_suitable_for || null;
      product.sectionIconOptions = product.section_icon_options || null;
      product.featuresExtraText = product.features_extra_text || null;
      // Keep code field for comparison and cart
      product.code = product.code;
      
      // Remove snake_case fields
      delete product.base_price;
      delete product.sale_price;
      delete product.purchase_count;
      delete product.view_count;
      delete product.actual_purchase_count;
      delete product.daily_sales_target;
      delete product.display_order;
      delete product.short_description;
      delete product.full_description;
      delete product.section_icon_features;
      delete product.section_icon_materials;
      delete product.section_icon_can_make;
      delete product.section_icon_suitable_for;
      delete product.section_icon_options;
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
      SELECT po.*, ppo.sort_order FROM product_options po
      INNER JOIN product_product_options ppo ON po.id = ppo.option_id
      WHERE ppo.product_id = ?
      ORDER BY ppo.sort_order ASC, po.id ASC
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

    // Get materials (new structure)
    const [materials] = await pool.execute(`
      SELECT m.*, pm.sort_order
      FROM materials m
      INNER JOIN product_materials pm ON m.id = pm.material_id
      WHERE pm.product_id = ?
      ORDER BY pm.sort_order ASC, m.id ASC
    `, [product.id]);
    product.materials = materials.map(mat => ({
      id: mat.id,
      name: mat.name,
      description: mat.description || null,
      image: mat.image || null,
      thumbnail: mat.thumbnail || null,
    }));

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
      product.actualPurchaseCount = parseInt(product.actual_purchase_count) || 0;
      product.dailySalesTarget = product.daily_sales_target ? parseInt(product.daily_sales_target) : null;
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
      delete product.actual_purchase_count;
      delete product.daily_sales_target;
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
      features, materials, canMake, suitableFor, options, images,
      sectionIconFeatures, sectionIconMaterials, sectionIconCanMake, sectionIconSuitableFor, sectionIconOptions,
      featuresExtraText
    } = req.body;

    // Update main product fields
    await pool.execute(`
      UPDATE products SET
        name = ?, slug = ?, short_description = ?, full_description = ?,
        base_price = ?, sale_price = ?, badge = ?, stock = ?,
        view_count = ?, purchase_count = ?, daily_sales_target = ?, display_order = ?,
        section_icon_features = ?, section_icon_materials = ?, section_icon_can_make = ?,
        section_icon_suitable_for = ?, section_icon_options = ?, features_extra_text = ?
      WHERE id = ?
    `, [
      name, slug, shortDescription, fullDescription, basePrice, salePrice, badge, stock,
      viewCount || 0, purchaseCount || 0, req.body.dailySalesTarget || null, displayOrder || 0,
      sectionIconFeatures || null, sectionIconMaterials || null, sectionIconCanMake || null,
      sectionIconSuitableFor || null, sectionIconOptions || null, featuresExtraText || null,
      id
    ]);

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

    // Update materials (new structure - product_materials)
    await pool.execute('DELETE FROM product_materials WHERE product_id = ?', [id]);
    if (materials && Array.isArray(materials)) {
      for (let i = 0; i < materials.length; i++) {
        const material = materials[i];
        // Support both formats: array of IDs or array of {id, ...} objects
        const materialId = typeof material === 'object' && material !== null ? material.id : material;
        if (materialId) {
          await pool.execute(`
            INSERT INTO product_materials (product_id, material_id, sort_order)
            VALUES (?, ?, ?)
          `, [id, materialId, i]);
        }
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

    // Update images
    await pool.execute('DELETE FROM product_images WHERE product_id = ?', [id]);
    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        if (imageUrl && imageUrl.trim()) {
          await pool.execute(`
            INSERT INTO product_images (product_id, url, sort_order)
            VALUES (?, ?, ?)
          `, [id, imageUrl.trim(), i]);
        }
      }
    }

    // Update options (many-to-many relationship) with sort_order
    await pool.execute('DELETE FROM product_product_options WHERE product_id = ?', [id]);
    if (options && Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        // Support both formats: array of IDs or array of {id, sortOrder} objects
        const optionId = typeof option === 'object' && option !== null ? option.id : option;
        const sortOrder = typeof option === 'object' && option !== null && option.sortOrder !== undefined ? option.sortOrder : i;
        await pool.execute(`
          INSERT INTO product_product_options (product_id, option_id, sort_order)
          VALUES (?, ?, ?)
        `, [id, optionId, sortOrder]);
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

// Upload product image
router.post('/upload-image', upload.single('image'), async (req, res, next) => {
  try {
    console.log('=== UPLOAD REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('UploadsDir:', uploadsDir);
    console.log('Absolute uploadsDir:', path.resolve(uploadsDir));
    
    if (!req.file) {
      console.error('ERROR: No file in request');
      return res.status(400).json({ error: 'Файл не завантажено' });
    }
    
    console.log('File object:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      size: req.file.size,
      destination: req.file.destination,
      filename: req.file.filename,
      path: req.file.path
    });
    
    // Проверяем реальный путь, где файл сохранен
    const savedPath = req.file.path;
    const expectedPath = path.join(uploadsDir, req.file.filename);
    
    console.log('Saved path:', savedPath);
    console.log('Expected path:', expectedPath);
    console.log('Path exists:', existsSync(savedPath));
    console.log('Expected path exists:', existsSync(expectedPath));
    
    // Проверяем, что файл действительно существует
    if (!existsSync(savedPath)) {
      console.error('ERROR: File was not saved! Path does not exist:', savedPath);
      return res.status(500).json({ error: 'Файл не збережено на сервері. Шлях: ' + savedPath });
    }
    
    // Проверяем размер файла
    const fs = await import('fs/promises');
    const stats = await fs.stat(savedPath);
    console.log('File stats:', {
      size: stats.size,
      isFile: stats.isFile(),
      mode: stats.mode.toString(8)
    });
    
    if (stats.size === 0) {
      console.error('ERROR: File is empty!');
      return res.status(500).json({ error: 'Файл порожній' });
    }
    
    console.log('SUCCESS: File uploaded and verified');
    const fileUrl = `/uploads/products/${req.file.filename}`;
    console.log('Returning URL:', fileUrl);
    
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (error) {
    console.error('ERROR: Upload failed:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
});

// Test upload endpoint (для тестирования загрузки)
router.post('/upload-test', upload.single('testImage'), async (req, res) => {
  try {
    console.log('=== TEST UPLOAD ===');
    console.log('File:', req.file);
    console.log('Body:', req.body);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fs = await import('fs/promises');
    const stats = await fs.stat(req.file.path);
    
    res.json({
      success: true,
      message: 'Test upload successful',
      file: {
        filename: req.file.filename,
        path: req.file.path,
        size: stats.size,
        mimetype: req.file.mimetype,
        url: `/uploads/products/${req.file.filename}`
      },
      uploadsDir: uploadsDir,
      uploadsDirAbsolute: path.resolve(uploadsDir),
      uploadsDirExists: existsSync(uploadsDir),
      fileExists: existsSync(req.file.path),
      filesInDir: (await fs.readdir(uploadsDir)).length
    });
  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
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

