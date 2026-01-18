import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import pool from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Настройка multer для загрузки изображений Instagram
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'instagram');

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
    cb(null, `instagram-${uniqueSuffix}${ext}`);
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

// Upload image for Instagram post (требует авторизацию admin)
router.post('/upload-image', authenticate, authorize('admin'), upload.single('image'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: `/uploads/instagram/${req.file.filename}` });
});

// Get all Instagram posts
router.get('/', async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true';
    const query = activeOnly
      ? `SELECT id, image_url, description, instagram_url, likes_count, comments_count, sort_order, is_active, created_at, updated_at
         FROM instagram_posts
         WHERE is_active = TRUE
         ORDER BY sort_order ASC, created_at DESC`
      : `SELECT id, image_url, description, instagram_url, likes_count, comments_count, sort_order, is_active, created_at, updated_at
         FROM instagram_posts
         ORDER BY sort_order ASC, created_at DESC`;
    
    const [posts] = await pool.execute(query);
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// Get Instagram post by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [posts] = await pool.execute(`
      SELECT id, image_url, description, instagram_url, likes_count, comments_count, sort_order, is_active, created_at, updated_at
      FROM instagram_posts WHERE id = ?
    `, [id]);

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Instagram post not found' });
    }

    res.json(posts[0]);
  } catch (error) {
    next(error);
  }
});

// Create Instagram post (требует авторизацию admin)
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { image_url, description, instagram_url, likes_count, comments_count, sort_order, is_active } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'image_url is required' });
    }

    const [result] = await pool.execute(`
      INSERT INTO instagram_posts (image_url, description, instagram_url, likes_count, comments_count, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      image_url,
      description || null,
      instagram_url || '',
      likes_count || 0,
      comments_count || 0,
      sort_order || 0,
      is_active !== undefined ? is_active : true
    ]);

    res.status(201).json({ id: result.insertId, message: 'Instagram post created' });
  } catch (error) {
    next(error);
  }
});

// Update Instagram post (требует авторизацию admin)
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { image_url, description, instagram_url, likes_count, comments_count, sort_order, is_active } = req.body;

    // If image is being updated, delete old image if it exists
    if (image_url) {
      const [oldPost] = await pool.execute('SELECT image_url FROM instagram_posts WHERE id = ?', [id]);
      if (oldPost.length > 0 && oldPost[0].image_url && oldPost[0].image_url !== image_url) {
        // Only delete if it's a local file (starts with /uploads/)
        if (oldPost[0].image_url.startsWith('/uploads/instagram/')) {
          const oldFilePath = path.join(uploadsDir, path.basename(oldPost[0].image_url));
          if (existsSync(oldFilePath)) {
            unlinkSync(oldFilePath);
          }
        }
      }
    }

    await pool.execute(`
      UPDATE instagram_posts SET
        image_url = ?, description = ?, instagram_url = ?, likes_count = ?, comments_count = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `, [
      image_url,
      description || null,
      instagram_url || '',
      likes_count || 0,
      comments_count || 0,
      sort_order,
      is_active,
      id
    ]);

    res.json({ id, message: 'Instagram post updated' });
  } catch (error) {
    next(error);
  }
});

// Delete Instagram post (требует авторизацию admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete associated image from file system
    const [posts] = await pool.execute('SELECT image_url FROM instagram_posts WHERE id = ?', [id]);
    if (posts.length > 0 && posts[0].image_url) {
      // Only delete if it's a local file (starts with /uploads/)
      if (posts[0].image_url.startsWith('/uploads/instagram/')) {
        const filePath = path.join(uploadsDir, path.basename(posts[0].image_url));
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      }
    }

    await pool.execute('DELETE FROM instagram_posts WHERE id = ?', [id]);
    res.json({ message: 'Instagram post deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

