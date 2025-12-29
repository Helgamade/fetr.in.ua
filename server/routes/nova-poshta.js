import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Получить популярные города
router.get('/cities/popular', async (req, res, next) => {
  try {
    const [cities] = await pool.execute(`
      SELECT 
        ref,
        description_ua,
        description_ru,
        area_description_ua,
        area_description_ru,
        settlement_type_description_ua,
        CONCAT(
          description_ua,
          IF(area_description_ua IS NOT NULL, CONCAT(' (', area_description_ua, ')'), '')
        ) as full_description_ua
      FROM nova_poshta_cities
      WHERE is_popular = TRUE
      ORDER BY sort_order ASC, description_ua ASC
    `);

    res.json(cities);
  } catch (error) {
    next(error);
  }
});

// Поиск городов
router.get('/cities/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const searchTerm = `%${q}%`;
    const [cities] = await pool.execute(`
      SELECT 
        ref,
        description_ua,
        description_ru,
        area_description_ua,
        area_description_ru,
        settlement_type_description_ua,
        CONCAT(
          description_ua,
          IF(area_description_ua IS NOT NULL, CONCAT(' (', area_description_ua, ')'), '')
        ) as full_description_ua
      FROM nova_poshta_cities
      WHERE description_ua LIKE ?
      ORDER BY 
        CASE WHEN description_ua LIKE ? THEN 0 ELSE 1 END,
        description_ua ASC
      LIMIT 50
    `, [searchTerm, `${q}%`]);

    res.json(cities);
  } catch (error) {
    next(error);
  }
});

// Получить отделения для города
router.get('/warehouses', async (req, res, next) => {
  try {
    const { cityRef, type, search } = req.query;

    if (!cityRef) {
      return res.status(400).json({ error: 'cityRef is required' });
    }

    let query = `
      SELECT 
        ref,
        site_key,
        description_ua,
        description_ru,
        short_address_ua,
        short_address_ru,
        type_of_warehouse,
        number,
        phone,
        max_weight_allowed
      FROM nova_poshta_warehouses
      WHERE city_ref = ?
    `;

    const params = [cityRef];

    // Фильтр по типу (PostOffice или Postomat)
    if (type) {
      query += ` AND type_of_warehouse = ?`;
      params.push(type);
    }

    // Поиск по описанию
    if (search && search.length >= 2) {
      query += ` AND (description_ua LIKE ? OR number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Сортировка: сначала по номеру (если есть), затем по описанию
    query += ` ORDER BY 
      CASE 
        WHEN number IS NOT NULL AND number REGEXP '^[0-9]+$' THEN CAST(number AS UNSIGNED)
        ELSE 999999
      END ASC,
      description_ua ASC
      LIMIT 100
    `;

    const [warehouses] = await pool.execute(query, params);

    res.json(warehouses);
  } catch (error) {
    next(error);
  }
});

// Получить информацию о городе по ref
router.get('/cities/:ref', async (req, res, next) => {
  try {
    const { ref } = req.params;

    const [cities] = await pool.execute(`
      SELECT 
        ref,
        description_ua,
        description_ru,
        area_description_ua,
        area_description_ru,
        settlement_type_description_ua,
        CONCAT(
          description_ua,
          IF(area_description_ua IS NOT NULL, CONCAT(' (', area_description_ua, ')'), '')
        ) as full_description_ua
      FROM nova_poshta_cities
      WHERE ref = ?
    `, [ref]);

    if (cities.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    res.json(cities[0]);
  } catch (error) {
    next(error);
  }
});

// Получить информацию об отделении по ref
router.get('/warehouses/:ref', async (req, res, next) => {
  try {
    const { ref } = req.params;

    const [warehouses] = await pool.execute(`
      SELECT 
        ref,
        site_key,
        description_ua,
        description_ru,
        short_address_ua,
        short_address_ru,
        city_ref,
        city_description_ua,
        type_of_warehouse,
        number,
        phone,
        max_weight_allowed
      FROM nova_poshta_warehouses
      WHERE ref = ?
    `, [ref]);

    if (warehouses.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json(warehouses[0]);
  } catch (error) {
    next(error);
  }
});

export default router;

