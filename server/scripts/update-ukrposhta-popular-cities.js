import pool from '../db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const ADDRESS_CLASSIFIER_BASE = 'https://www.ukrposhta.ua/address-classifier-ws';
const UKRPOSHTA_BEARER_TOKEN = process.env.UKRPOSHTA_BEARER_TOKEN || '67f02a7c-3af7-34d1-aa18-7eb4d96f3be4';

async function callAddressClassifierAPI(endpoint) {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${ADDRESS_CLASSIFIER_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${UKRPOSHTA_BEARER_TOKEN}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ [API] Request failed: ${error.message}`);
    throw error;
  }
}

async function updatePopularCities() {
  let connection;
  try {
    console.log('🔄 [Update Popular Cities] Starting update...');
    
    connection = await pool.getConnection();
    
    // Получаем все популярные города из БД
    const [cities] = await connection.execute(`
      SELECT id, name, region, city_id 
      FROM ukrposhta_popular_cities 
      ORDER BY sort_order ASC
    `);
    
    console.log(`📋 [Update Popular Cities] Found ${cities.length} cities to update`);
    
    let updatedCount = 0;
    let failedCount = 0;
    
    for (const city of cities) {
      try {
        console.log(`🔍 [Update Popular Cities] Searching CITY_ID for "${city.name} (${city.region})"...`);
        
        // Ищем город через API
        // Используем URLSearchParams для правильного кодирования кириллицы
        const params = new URLSearchParams({ city_ua: city.name });
        const data = await callAddressClassifierAPI(
          `/get_city_by_region_id_and_district_id_and_city_ua?${params.toString()}`
        );
        
        const entries = data?.Entries?.Entry || [];
        const apiCities = Array.isArray(entries) ? entries : [entries];
        
        // Нормализуем область для сравнения (убираем "обл.")
        const normalizeRegion = (region) => {
          if (!region) return '';
          return region.replace(/\s*обл\.?\s*$/i, '').trim();
        };
        
        const cityRegionNormalized = normalizeRegion(city.region);
        
        // Ищем город по названию и области
        let foundCity = apiCities.find(c => {
          const nameMatch = c.CITY_UA?.toLowerCase() === city.name.toLowerCase();
          const regionMatch = cityRegionNormalized 
            ? normalizeRegion(c.REGION_UA || '') === cityRegionNormalized
            : true;
          return nameMatch && regionMatch && c.CITY_ID;
        });
        
        // Если не нашли с учетом области, пробуем только по названию
        if (!foundCity && cityRegionNormalized) {
          foundCity = apiCities.find(c => {
            const nameMatch = c.CITY_UA?.toLowerCase() === city.name.toLowerCase();
            return nameMatch && c.CITY_ID;
          });
        }
        
        if (foundCity && foundCity.CITY_ID) {
          const newCityId = foundCity.CITY_ID.toString();
          
          // Обновляем CITY_ID в БД
          await connection.execute(`
            UPDATE ukrposhta_popular_cities 
            SET city_id = ?, last_updated_at = NOW() 
            WHERE id = ?
          `, [newCityId, city.id]);
          
          console.log(`✅ [Update Popular Cities] Updated "${city.name}": CITY_ID = ${newCityId} (was: ${city.city_id || 'NULL'})`);
          updatedCount++;
        } else {
          console.warn(`⚠️ [Update Popular Cities] Could not find CITY_ID for "${city.name} (${city.region})"`);
          failedCount++;
        }
        
        // Небольшая задержка между запросами, чтобы не перегружать API
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ [Update Popular Cities] Error updating "${city.name}":`, error.message);
        failedCount++;
      }
    }
    
    console.log(`✅ [Update Popular Cities] Update completed! Updated: ${updatedCount}, Failed: ${failedCount}`);
  } catch (error) {
    console.error('❌ [Update Popular Cities] Fatal error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

updatePopularCities();

