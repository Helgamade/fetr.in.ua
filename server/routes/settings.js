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

// Настройка multer для загрузки hero фонового изображения
const heroUploadsDir = path.join(__dirname, '..', '..', 'uploads', 'hero');

if (!existsSync(heroUploadsDir)) {
  mkdirSync(heroUploadsDir, { recursive: true });
}

const heroStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!existsSync(heroUploadsDir)) {
      mkdirSync(heroUploadsDir, { recursive: true });
    }
    cb(null, heroUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `hero-background-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

const heroUpload = multer({
  storage: heroStorage,
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

// Get public settings (for frontend, no auth required)
router.get('/public', async (req, res, next) => {
  try {
    const publicKeys = [
      'store_name',
      'store_email',
      'store_phone',
      'store_address',
      'store_working_hours_weekdays',
      'store_working_hours_weekend',
      'free_delivery_threshold',
      'hero_background_image'
    ];
    
    const placeholders = publicKeys.map(() => '?').join(',');
    const [settings] = await pool.execute(`
      SELECT key_name, value, type FROM settings
      WHERE key_name IN (${placeholders})
    `, publicKeys);

    const result = {};
    settings.forEach(setting => {
      let value = setting.value;
      if (setting.type === 'number') {
        value = parseFloat(value);
      } else if (setting.type === 'boolean') {
        value = value === 'true';
      } else if (setting.type === 'json') {
        value = JSON.parse(value);
      }
      result[setting.key_name] = value;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get all settings
router.get('/', async (req, res, next) => {
  try {
    const [settings] = await pool.execute(`
      SELECT key_name, value, type FROM settings
    `);

    const result = {};
    settings.forEach(setting => {
      let value = setting.value;
      if (setting.type === 'number') {
        value = parseFloat(value);
      } else if (setting.type === 'boolean') {
        value = value === 'true';
      } else if (setting.type === 'json') {
        value = JSON.parse(value);
      }
      result[setting.key_name] = value;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get setting by key
router.get('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const [settings] = await pool.execute(`
      SELECT value, type FROM settings WHERE key_name = ?
    `, [key]);

    if (settings.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    let value = settings[0].value;
    if (settings[0].type === 'number') {
      value = parseFloat(value);
    } else if (settings[0].type === 'boolean') {
      value = value === 'true';
    } else if (settings[0].type === 'json') {
      value = JSON.parse(value);
    }

    res.json({ key, value });
  } catch (error) {
    next(error);
  }
});

// Update setting
router.put('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    let stringValue = value;
    let type = 'string';

    if (typeof value === 'number') {
      stringValue = value.toString();
      type = 'number';
    } else if (typeof value === 'boolean') {
      stringValue = value.toString();
      type = 'boolean';
    } else if (typeof value === 'object') {
      stringValue = JSON.stringify(value);
      type = 'json';
    }

    await pool.execute(`
      INSERT INTO settings (key_name, value, type)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE value = VALUES(value), type = VALUES(type)
    `, [key, stringValue, type]);

    res.json({ key, value, message: 'Setting updated' });
  } catch (error) {
    next(error);
  }
});

// Update multiple settings
router.put('/', async (req, res, next) => {
  try {
    const settings = req.body;
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const smtpKeys = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_password', 'smtp_from_email', 'smtp_from_name'];
      let smtpChanged = false;

      for (const [key, value] of Object.entries(settings)) {
        let stringValue = value;
        let type = 'string';

        if (typeof value === 'number') {
          stringValue = value.toString();
          type = 'number';
        } else if (typeof value === 'boolean') {
          stringValue = value.toString();
          type = 'boolean';
        } else if (typeof value === 'object') {
          stringValue = JSON.stringify(value);
          type = 'json';
        }

        await connection.execute(`
          INSERT INTO settings (key_name, value, type)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE value = VALUES(value), type = VALUES(type)
        `, [key, stringValue, type]);

        if (smtpKeys.includes(key)) {
          smtpChanged = true;
        }
      }

      await connection.commit();
      
      // Перезагружаем SMTP транспортер, если изменились SMTP настройки
      if (smtpChanged) {
        try {
          const { reloadTransporter } = await import('../utils/emailService.js');
          await reloadTransporter();
          console.log('[Settings] SMTP транспортер перезавантажено');
        } catch (error) {
          console.error('[Settings] Помилка перезавантаження SMTP транспортера:', error);
        }
      }
      
      res.json({ message: 'Settings updated' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
});

// Upload hero background image
router.post('/upload-hero-background', heroUpload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `/uploads/hero/${req.file.filename}`;

    // Удаляем старое изображение, если оно есть
    const [oldSettings] = await pool.execute(`
      SELECT value FROM settings WHERE key_name = 'hero_background_image'
    `);

    if (oldSettings.length > 0 && oldSettings[0].value) {
      const oldImagePath = oldSettings[0].value;
      if (oldImagePath.startsWith('/uploads/hero/')) {
        const oldFilePath = path.join(heroUploadsDir, path.basename(oldImagePath));
        if (existsSync(oldFilePath)) {
          try {
            unlinkSync(oldFilePath);
          } catch (err) {
            console.error('Error deleting old hero image:', err);
          }
        }
      }
    }

    // Сохраняем новый путь в настройках
    await pool.execute(`
      INSERT INTO settings (key_name, value, type)
      VALUES ('hero_background_image', ?, 'string')
      ON DUPLICATE KEY UPDATE value = VALUES(value), type = VALUES(type)
    `, [imageUrl]);

    res.json({ url: imageUrl, message: 'Hero background image uploaded' });
  } catch (error) {
    next(error);
  }
});

export default router;


