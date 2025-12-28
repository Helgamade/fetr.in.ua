import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Настройка multer для загрузки изображений галереи
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'galleries');

if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `gallery-${uniqueSuffix}${ext}`;
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
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Тільки зображення (jpeg, jpg, png, gif, webp) дозволені!'));
    }
  }
});

// Get all galleries (for admin - все, для фронтенда - только published)
router.get('/', async (req, res, next) => {
  try {
    const publishedOnly = req.query.published === 'true';
    const query = publishedOnly 
      ? `SELECT * FROM galleries WHERE is_published = TRUE ORDER BY sort_order ASC, created_at ASC`
      : `SELECT * FROM galleries ORDER BY sort_order ASC, created_at ASC`;
    
    const [galleries] = await pool.execute(query);
    
    // Get images for each gallery (with published filter if needed)
    for (const gallery of galleries) {
      const imageQuery = publishedOnly
        ? `SELECT id, gallery_id, url, title, description, sort_order, is_published, created_at
           FROM gallery_images
           WHERE gallery_id = ? AND is_published = TRUE
           ORDER BY sort_order ASC, created_at ASC`
        : `SELECT id, gallery_id, url, title, description, sort_order, is_published, created_at
           FROM gallery_images
           WHERE gallery_id = ?
           ORDER BY sort_order ASC, created_at ASC`;
      
      const [images] = await pool.execute(imageQuery, [gallery.id]);
      gallery.images = images;
      gallery.imagesCount = images.length;
    }
    
    res.json(galleries);
  } catch (error) {
    next(error);
  }
});

// Get gallery by ID with images
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const publishedOnly = req.query.published === 'true';
    
    // Get gallery
    const [galleries] = await pool.execute('SELECT * FROM galleries WHERE id = ?', [id]);
    if (galleries.length === 0) {
      return res.status(404).json({ error: 'Gallery not found' });
    }
    
    const gallery = galleries[0];
    
    // Get images for this gallery
    const query = publishedOnly
      ? `SELECT id, gallery_id, url, title, description, sort_order, is_published, created_at
         FROM gallery_images
         WHERE gallery_id = ? AND is_published = TRUE
         ORDER BY sort_order ASC, created_at ASC`
      : `SELECT id, gallery_id, url, title, description, sort_order, is_published, created_at
         FROM gallery_images
         WHERE gallery_id = ?
         ORDER BY sort_order ASC, created_at ASC`;
    
    const [images] = await pool.execute(query, [id]);
    
    gallery.images = images;
    
    res.json(gallery);
  } catch (error) {
    next(error);
  }
});

// Create gallery
router.post('/', async (req, res, next) => {
  try {
    const { name, sort_order, is_published } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const [result] = await pool.execute(`
      INSERT INTO galleries (name, sort_order, is_published)
      VALUES (?, ?, ?)
    `, [name, sort_order || 0, is_published !== undefined ? is_published : true]);
    
    res.status(201).json({ id: result.insertId, message: 'Gallery created' });
  } catch (error) {
    next(error);
  }
});

// Update gallery
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sort_order, is_published } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    await pool.execute(`
      UPDATE galleries SET name = ?, sort_order = ?, is_published = ?
      WHERE id = ?
    `, [name, sort_order || 0, is_published !== undefined ? is_published : true, id]);
    
    res.json({ id, message: 'Gallery updated' });
  } catch (error) {
    next(error);
  }
});

// Delete gallery
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete gallery (images will be deleted via CASCADE)
    await pool.execute('DELETE FROM galleries WHERE id = ?', [id]);
    
    res.json({ id, message: 'Gallery deleted' });
  } catch (error) {
    next(error);
  }
});

// Upload image to gallery
router.post('/:id/images', upload.single('image'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imageUrl = `/uploads/galleries/${req.file.filename}`;
    const { title, description, sort_order } = req.body;
    
    // Get max sort_order for this gallery
    const [maxSort] = await pool.execute(`
      SELECT MAX(sort_order) as max_sort FROM gallery_images WHERE gallery_id = ?
    `, [id]);
    const nextSortOrder = maxSort[0].max_sort !== null ? maxSort[0].max_sort + 1 : 0;
    
    const [result] = await pool.execute(`
      INSERT INTO gallery_images (gallery_id, url, title, description, sort_order, is_published)
      VALUES (?, ?, ?, ?, ?, TRUE)
    `, [id, imageUrl, title || null, description || null, sort_order !== undefined ? sort_order : nextSortOrder]);
    
    res.status(201).json({ 
      id: result.insertId, 
      url: imageUrl,
      message: 'Image uploaded' 
    });
  } catch (error) {
    next(error);
  }
});

// Update gallery image
router.put('/:galleryId/images/:imageId', async (req, res, next) => {
  try {
    const { galleryId, imageId } = req.params;
    const { title, description, sort_order, is_published } = req.body;
    
    await pool.execute(`
      UPDATE gallery_images SET
        title = ?, description = ?, sort_order = ?, is_published = ?
      WHERE id = ? AND gallery_id = ?
    `, [title || null, description || null, sort_order, is_published !== undefined ? is_published : true, imageId, galleryId]);
    
    res.json({ id: imageId, message: 'Image updated' });
  } catch (error) {
    next(error);
  }
});

// Delete gallery image
router.delete('/:galleryId/images/:imageId', async (req, res, next) => {
  try {
    const { galleryId, imageId } = req.params;
    
    // Get image URL to delete file
    const [images] = await pool.execute(`
      SELECT url FROM gallery_images WHERE id = ? AND gallery_id = ?
    `, [imageId, galleryId]);
    
    if (images.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Delete from database
    await pool.execute('DELETE FROM gallery_images WHERE id = ? AND gallery_id = ?', [imageId, galleryId]);
    
    // TODO: Delete file from filesystem if needed
    
    res.json({ id: imageId, message: 'Image deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

