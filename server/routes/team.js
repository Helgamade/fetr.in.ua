import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Настройка multer для загрузки изображений команды
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'team');

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
    cb(null, `team-${uniqueSuffix}${ext}`);
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

// Upload image for team member
router.post('/upload-image', upload.single('image'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: `/uploads/team/${req.file.filename}` });
});

// Get all team members (for admin - все, для фронтенда - только активные)
router.get('/', async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true';
    const query = activeOnly
      ? `SELECT id, name, role, photo, description, sort_order, is_active, created_at, updated_at
         FROM team_members
         WHERE is_active = TRUE
         ORDER BY sort_order ASC, created_at ASC`
      : `SELECT id, name, role, photo, description, sort_order, is_active, created_at, updated_at
         FROM team_members
         ORDER BY sort_order ASC, created_at ASC`;
    
    const [members] = await pool.execute(query);
    res.json(members);
  } catch (error) {
    next(error);
  }
});

// Get team member by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [members] = await pool.execute(`
      SELECT * FROM team_members WHERE id = ?
    `, [id]);

    if (members.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.json(members[0]);
  } catch (error) {
    next(error);
  }
});

// Create team member
router.post('/', async (req, res, next) => {
  try {
    const { name, role, photo, description, sort_order, is_active } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO team_members (name, role, photo, description, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, role, photo || null, description || null, sort_order || 0, is_active !== undefined ? is_active : true]);

    res.status(201).json({ id: result.insertId, message: 'Team member created' });
  } catch (error) {
    next(error);
  }
});

// Update team member
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, photo, description, sort_order, is_active } = req.body;

    await pool.execute(`
      UPDATE team_members SET
        name = ?, role = ?, photo = ?, description = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `, [name, role, photo || null, description || null, sort_order, is_active, id]);

    res.json({ id, message: 'Team member updated' });
  } catch (error) {
    next(error);
  }
});

// Delete team member
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Получаем фото перед удалением
    const [members] = await pool.execute('SELECT photo FROM team_members WHERE id = ?', [id]);
    if (members.length > 0 && members[0].photo) {
      // Удаляем файл с сервера, если это загруженное изображение
      const photoPath = members[0].photo;
      if (photoPath.startsWith('/uploads/team/')) {
        const filePath = path.join(uploadsDir, path.basename(photoPath));
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      }
    }
    
    await pool.execute('DELETE FROM team_members WHERE id = ?', [id]);
    res.json({ message: 'Team member deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

