import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import sharp from 'sharp';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Настройка multer для загрузки изображений
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'materials');
const thumbnailsDir = path.join(__dirname, '..', '..', 'uploads', 'materials', 'thumbnails');

if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
if (!existsSync(thumbnailsDir)) {
  mkdirSync(thumbnailsDir, { recursive: true });
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
    const filename = `material-${uniqueSuffix}${ext}`;
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
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Тільки зображення дозволені'));
    }
  }
});

// Get all materials
router.get('/', async (req, res, next) => {
  try {
    const [materials] = await pool.execute(`
      SELECT * FROM materials ORDER BY name ASC
    `);
    
    const transformedMaterials = materials.map(mat => ({
      id: mat.id,
      name: mat.name,
      description: mat.description || null,
      image: mat.image || null,
      thumbnail: mat.thumbnail || null,
    }));
    
    res.json(transformedMaterials);
  } catch (error) {
    next(error);
  }
});

// Get material by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [materials] = await pool.execute(`
      SELECT * FROM materials WHERE id = ?
    `, [id]);
    
    if (materials.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    const material = materials[0];
    res.json({
      id: material.id,
      name: material.name,
      description: material.description || null,
      image: material.image || null,
      thumbnail: material.thumbnail || null,
    });
  } catch (error) {
    next(error);
  }
});

// Create material
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    let imagePath = null;
    let thumbnailPath = null;
    
    if (req.file) {
      imagePath = `/uploads/materials/${req.file.filename}`;
      
      // Создаем миниатюру
      const thumbnailFilename = `thumb-${req.file.filename}`;
      const thumbnailFullPath = path.join(thumbnailsDir, thumbnailFilename);
      
      try {
        await sharp(req.file.path)
          .resize(200, 200, { fit: 'cover' })
          .toFile(thumbnailFullPath);
        
        thumbnailPath = `/uploads/materials/thumbnails/${thumbnailFilename}`;
      } catch (sharpError) {
        console.error('Error creating thumbnail:', sharpError);
        // Если не удалось создать миниатюру, продолжаем без неё
      }
    }
    
    const [result] = await pool.execute(`
      INSERT INTO materials (name, description, image, thumbnail)
      VALUES (?, ?, ?, ?)
    `, [name, description || null, imagePath, thumbnailPath]);
    
    res.status(201).json({ 
      id: result.insertId, 
      name,
      description: description || null,
      image: imagePath,
      thumbnail: thumbnailPath,
      message: 'Material created' 
    });
  } catch (error) {
    next(error);
  }
});

// Update material
router.put('/:id', upload.single('image'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Получаем текущий материал для удаления старых изображений
    const [currentMaterials] = await pool.execute(`
      SELECT image, thumbnail FROM materials WHERE id = ?
    `, [id]);
    
    if (currentMaterials.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    const currentMaterial = currentMaterials[0];
    let imagePath = currentMaterial.image;
    let thumbnailPath = currentMaterial.thumbnail;
    
    // Если загружено новое изображение
    if (req.file) {
      // Удаляем старые изображения
      if (currentMaterial.image) {
        const oldImagePath = path.join(__dirname, '..', '..', currentMaterial.image.replace(/^\//, ''));
        if (existsSync(oldImagePath)) {
          try {
            unlinkSync(oldImagePath);
          } catch (e) {
            console.error('Error deleting old image:', e);
          }
        }
      }
      
      if (currentMaterial.thumbnail) {
        const oldThumbnailPath = path.join(__dirname, '..', '..', currentMaterial.thumbnail.replace(/^\//, ''));
        if (existsSync(oldThumbnailPath)) {
          try {
            unlinkSync(oldThumbnailPath);
          } catch (e) {
            console.error('Error deleting old thumbnail:', e);
          }
        }
      }
      
      imagePath = `/uploads/materials/${req.file.filename}`;
      
      // Создаем миниатюру
      const thumbnailFilename = `thumb-${req.file.filename}`;
      const thumbnailFullPath = path.join(thumbnailsDir, thumbnailFilename);
      
      try {
        await sharp(req.file.path)
          .resize(200, 200, { fit: 'cover' })
          .toFile(thumbnailFullPath);
        
        thumbnailPath = `/uploads/materials/thumbnails/${thumbnailFilename}`;
      } catch (sharpError) {
        console.error('Error creating thumbnail:', sharpError);
      }
    }
    
    await pool.execute(`
      UPDATE materials
      SET name = ?, description = ?, image = ?, thumbnail = ?
      WHERE id = ?
    `, [name, description || null, imagePath, thumbnailPath, id]);
    
    res.json({ id, message: 'Material updated' });
  } catch (error) {
    next(error);
  }
});

// Delete material
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Получаем материал для удаления изображений
    const [materials] = await pool.execute(`
      SELECT image, thumbnail FROM materials WHERE id = ?
    `, [id]);
    
    if (materials.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    const material = materials[0];
    
    // Проверяем, используется ли материал в товарах
    const [used] = await pool.execute(`
      SELECT COUNT(*) as count FROM product_materials WHERE material_id = ?
    `, [id]);
    
    if (used[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete material that is used in products. Remove it from all products first.' 
      });
    }
    
    // Удаляем изображения
    if (material.image) {
      const imagePath = path.join(__dirname, '..', '..', material.image.replace(/^\//, ''));
      if (existsSync(imagePath)) {
        try {
          unlinkSync(imagePath);
        } catch (e) {
          console.error('Error deleting image:', e);
        }
      }
    }
    
    if (material.thumbnail) {
      const thumbnailPath = path.join(__dirname, '..', '..', material.thumbnail.replace(/^\//, ''));
      if (existsSync(thumbnailPath)) {
        try {
          unlinkSync(thumbnailPath);
        } catch (e) {
          console.error('Error deleting thumbnail:', e);
        }
      }
    }
    
    await pool.execute('DELETE FROM materials WHERE id = ?', [id]);
    res.json({ id, message: 'Material deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;