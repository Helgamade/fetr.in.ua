import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get public settings (for frontend, no auth required)
router.get('/public', async (req, res, next) => {
  try {
    const publicKeys = [
      'store_name',
      'store_email',
      'store_phone',
      'store_address',
      'store_working_hours_weekdays',
      'store_working_hours_weekend'
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
      }

      await connection.commit();
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

export default router;


