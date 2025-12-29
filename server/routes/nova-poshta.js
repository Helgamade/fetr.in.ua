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

    console.log('🔍 [GET /warehouses] Request:', { cityRef, type, search });

    if (!cityRef) {
      console.log('❌ [GET /warehouses] Missing cityRef');
      return res.status(400).json({ error: 'cityRef is required' });
    }

    // Проверяем, существует ли город
    const [cityCheck] = await pool.execute(
      'SELECT ref, description_ua FROM nova_poshta_cities WHERE ref = ?',
      [cityRef]
    );

    if (cityCheck.length === 0) {
      console.log(`❌ [GET /warehouses] City not found: ${cityRef}`);
      return res.status(404).json({ error: 'City not found' });
    }

    console.log(`✅ [GET /warehouses] City found: ${cityCheck[0].description_ua} (${cityRef})`);

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
        max_weight_allowed,
        city_ref
      FROM nova_poshta_warehouses
      WHERE city_ref = ?
    `;

    const params = [cityRef];

    // Фильтр по типу (PostOffice или Postomat)
    // API Новой Почты возвращает UUID типов отделений:
    // PostOffice (Відділення): 
    //   - '841339c7-591a-42e2-8233-7a0a00f0ed6f' (отделения, включая пункты приема)
    //   - '9a68df70-0267-42a8-bb5c-37f427e36ee4' (отделения)
    // Postomat (Поштомат): 
    //   - 'f9316480-5f2d-425d-bc2c-ac7cd29decf0' (почтоматы)
    if (type) {
      if (type === 'PostOffice') {
        // Відділення: оба UUID типа отделений
        query += ` AND type_of_warehouse IN ('841339c7-591a-42e2-8233-7a0a00f0ed6f', '9a68df70-0267-42a8-bb5c-37f427e36ee4')`;
      } else if (type === 'Postomat') {
        // Поштомат: только почтоматы
        query += ` AND type_of_warehouse = 'f9316480-5f2d-425d-bc2c-ac7cd29decf0'`;
      }
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

    console.log(`📊 [GET /warehouses] Query: ${query}`);
    console.log(`📊 [GET /warehouses] Params:`, params);

    const [warehouses] = await pool.execute(query, params);

    console.log(`✅ [GET /warehouses] Found ${warehouses.length} warehouses for city ${cityRef}`);

    // Проверяем первые несколько отделений для отладки
    if (warehouses.length > 0) {
      console.log(`📦 [GET /warehouses] Sample warehouse:`, {
        ref: warehouses[0].ref,
        description: warehouses[0].description_ua,
        city_ref: warehouses[0].city_ref,
        type: warehouses[0].type_of_warehouse
      });
    } else {
      // Проверяем, есть ли вообще отделения в базе для этого города
      const [totalCheck] = await pool.execute(
        'SELECT COUNT(*) as total FROM nova_poshta_warehouses WHERE city_ref = ?',
        [cityRef]
      );
      console.log(`⚠️  [GET /warehouses] No warehouses found, but total in DB for this city: ${totalCheck[0].total}`);
      
      // Проверяем, есть ли вообще отделения в базе
      const [globalCheck] = await pool.execute(
        'SELECT COUNT(*) as total FROM nova_poshta_warehouses'
      );
      console.log(`📊 [GET /warehouses] Total warehouses in DB: ${globalCheck[0].total}`);
    }

    res.json(warehouses);
  } catch (error) {
    console.error('❌ [GET /warehouses] Error:', error);
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

