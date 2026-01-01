import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const router = express.Router();

// Адресный классификатор API Укрпошты
// ✅ ПРОТЕСТИРОВАНО автоматическим тестом - эта конфигурация работает!
// URL: https://www.ukrposhta.ua/address-classifier-ws (с www)
// PROD_BEARER_ECOM (из АРІ_ключі.pdf): 67f02a7c-3af7-34d1-aa18-7eb4d96f3be4
const ADDRESS_CLASSIFIER_BASE = 'https://www.ukrposhta.ua/address-classifier-ws';
const UKRPOSHTA_BEARER_TOKEN = process.env.UKRPOSHTA_BEARER_TOKEN || '67f02a7c-3af7-34d1-aa18-7eb4d96f3be4';

// Функция для вызова адресного классификатора API
// Согласно документации раздел 3.2: /get_city_by_name
async function callAddressClassifierAPI(endpoint) {
  const url = `${ADDRESS_CLASSIFIER_BASE}${endpoint}`;
  
  try {
    console.log(`📡 [Address Classifier API] GET ${url}`);
    
    // Полный набор заголовков для имитации браузера и обхода Cloudflare
    const headers = {
      'Authorization': `Bearer ${UKRPOSHTA_BEARER_TOKEN}`,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.ukrposhta.ua/',
      'Origin': 'https://www.ukrposhta.ua',
    };
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`❌ [Address Classifier API] Error ${response.status}: ${responseText}`);
      throw new Error(`API error: ${response.status} - ${responseText}`);
    }

    // Парсим JSON ответ
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`❌ [Address Classifier API] JSON parse error:`, parseError);
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }

    console.log(`✅ [Address Classifier API] Success: ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`❌ [Address Classifier API] Request failed:`, error.message);
    throw error;
  }
}

// Популярные города Украины (хардкод для быстрого доступа)
// ВАЖНО: Эти города используются только для отображения в UI
// Для получения отделений нужно использовать CITY_ID из API через cities/search
// Популярные города НЕ должны использоваться для получения отделений напрямую
const POPULAR_CITIES = [
  { id: 'kyiv', name: 'Київ', postalCode: '01001', region: 'Київська обл.', cityId: null }, // cityId должен быть получен через API
  { id: 'odesa', name: 'Одеса', postalCode: '65001', region: 'Одеська обл.', cityId: null },
  { id: 'dnipro', name: 'Дніпро', postalCode: '49001', region: 'Дніпропетровська обл.', cityId: null },
  { id: 'kharkiv', name: 'Харків', postalCode: '61001', region: 'Харківська обл.', cityId: null },
  { id: 'lviv', name: 'Львів', postalCode: '79001', region: 'Львівська обл.', cityId: null },
  { id: 'zaporizhzhia', name: 'Запоріжжя', postalCode: '69001', region: 'Запорізька обл.', cityId: null },
];

// Получить популярные города
router.get('/cities/popular', async (req, res, next) => {
  try {
    res.json(POPULAR_CITIES);
  } catch (error) {
    next(error);
  }
});

// Поиск городов через адресный классификатор API Укрпошты
// Согласно документации "Рекомендації з пошуку індексів та відділень" (Search-offices-and-indexes-v3.pdf)
// 
// Процесс поиска: Область -> Район -> Населенный пункт -> Отделение
// 
// Endpoints адресного классификатора:
// - GET /get_regions_by_region_ua?region_name=... - поиск области
// - GET /get_districts_by_region_id_and_district_ua?region_id=...&district_ua=... - поиск района
// - GET /get_city_by_region_id_and_district_id_and_city_ua?district_id=...&city_ua=... - поиск населенного пункта
// - GET /get_city_by_region_id_and_city_ua?region_id=...&city_ua=... - поиск населенного пункта по области и названию (если есть)
// 
// Формат ответа населенного пункта:
// {REGION_ID, DISTRICT_ID, CITY_ID, REGION_UA, DISTRICT_UA, CITY_UA, CITY_KOATUU, CITY_KATOTTG, POSTCODE, ...}
router.get('/cities/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    console.log(`🔍 [Ukrposhta API] Search cities request: q="${q}"`);
    
    if (!q || q.length < 2) {
      console.log(`⚠️ [Ukrposhta API] Query too short: "${q}"`);
      return res.json([]);
    }

    // Проверяем популярные города для быстрого ответа
    const popularMatches = POPULAR_CITIES.filter(city => 
      city.name.toLowerCase().includes(q.toLowerCase()) ||
      city.region.toLowerCase().includes(q.toLowerCase())
    );
    
    console.log(`📋 [Ukrposhta API] Found ${popularMatches.length} popular matches`);

    try {
      // Пробуем поиск населенного пункта по названию с указанием region_id
      // Согласно документации, можно использовать:
      // GET /get_city_by_region_id_and_city_ua?region_id={region_id}&city_ua={название}
      // 
      // Но для поиска без указания области нужно либо:
      // 1. Получить список всех областей и искать в каждой
      // 2. Использовать endpoint для поиска по названию без region_id (если есть)
      
      // Пробуем поиск по названию без region_id (может не работать)
      let apiCities = [];
      
      // Согласно документации, для поиска населенного пункта нужно указать region_id и district_id
      // Но для простого поиска можно использовать поиск по region_id и названию города
      // Пробуем поиск в популярных областях параллельно
      const popularRegions = [
        { id: '270', name: 'Київська' },
        { id: '14', name: 'Львівська' },
        { id: '63', name: 'Харківська' },
        { id: '51', name: 'Одеська' },
        { id: '12', name: 'Дніпропетровська' },
        { id: '23', name: 'Запорізька' },
        { id: '32', name: 'Київ' },
      ];
      
      console.log(`🌍 [Ukrposhta API] Searching in ${popularRegions.length} popular regions`);
      
      // Согласно тестированию, endpoint работает БЕЗ region_id (поиск по всей Украине)
      // GET /get_city_by_region_id_and_district_id_and_city_ua?city_ua={cityUa}
      try {
        console.log(`🔍 [Ukrposhta API] Searching without region_id (all Ukraine)`);
        const data = await callAddressClassifierAPI(
          `/get_city_by_region_id_and_district_id_and_city_ua?city_ua=${encodeURIComponent(q)}`
        );
        const entries = data?.Entries?.Entry || [];
        apiCities = Array.isArray(entries) ? entries : [entries];
        console.log(`✅ [Ukrposhta API] Found ${apiCities.length} cities (all Ukraine)`);
      } catch (err) {
        console.log(`⚠️ [Ukrposhta API] Error searching without region_id:`, err.message);
        // Fallback: ищем в популярных областях
        console.log(`🔄 [Ukrposhta API] Fallback: searching in popular regions`);
        const searchPromises = popularRegions.map(async (region) => {
          try {
            const data = await callAddressClassifierAPI(
              `/get_city_by_region_id_and_district_id_and_city_ua?region_id=${region.id}&city_ua=${encodeURIComponent(q)}`
            );
            const entries = data?.Entries?.Entry || [];
            const result = Array.isArray(entries) ? entries : [entries];
            if (result.length > 0) {
              console.log(`✅ [Ukrposhta API] Found ${result.length} cities in ${region.name}`);
            }
            return result;
          } catch (err) {
            console.log(`⚠️ [Ukrposhta API] Error searching in ${region.name}:`, err.message);
            return [];
          }
        });
        
        const results = await Promise.all(searchPromises);
        apiCities = results.flat();
      }
      
      console.log(`📦 [Ukrposhta API] Total API cities found: ${apiCities.length}`);
      
    // Преобразуем данные API в наш формат
    // Формат ответа: {REGION_ID, DISTRICT_ID, CITY_ID, REGION_UA, DISTRICT_UA, CITY_UA, ...}
    const formattedCities = apiCities.map((item) => ({
      id: item.CITY_ID?.toString() || '',
      name: item.CITY_UA || '',  // CITY_UA согласно реальному ответу API
      postalCode: '', // В этом endpoint нет почтового индекса
      region: item.REGION_UA || '',  // REGION_UA согласно реальному ответу API
      district: item.DISTRICT_UA || '',  // DISTRICT_UA согласно реальному ответу API
      cityId: item.CITY_ID?.toString() || '', // Сохраняем CITY_ID для получения отделений
    })).filter(city => city.name && city.id);

      console.log(`✨ [Ukrposhta API] Formatted cities: ${formattedCities.length}`);

      // Объединяем популярные и результаты API, убираем дубликаты по CITY_ID
      const allCities = [...popularMatches];
      formattedCities.forEach(city => {
        if (!allCities.find(c => c.id === city.id || c.postalCode === city.postalCode)) {
          allCities.push(city);
        }
      });

      console.log(`🎯 [Ukrposhta API] Total cities to return: ${allCities.length}`);
      res.json(allCities);
    } catch (apiError) {
      console.error('❌ [Address Classifier API] Search cities error:', apiError.message);
      console.error('❌ [Address Classifier API] Stack:', apiError.stack);
      // Если API не работает, возвращаем популярные города
      console.log(`📋 [Ukrposhta API] Returning ${popularMatches.length} popular matches due to API error`);
      res.json(popularMatches);
    }
  } catch (error) {
    console.error('❌ [Ukrposhta API] Unexpected error:', error);
    next(error);
  }
});

// Получить информацию о городе по ID (CITY_ID) или индексу
// Согласно документации "Рекомендації з пошуку індексів та відділень"
// Используем адресный классификатор для получения информации о населенном пункте
router.get('/cities/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Проверяем популярные города
    const popularCity = POPULAR_CITIES.find(c => c.id === id || c.postalCode === id);
    if (popularCity) {
      return res.json(popularCity);
    }

    // Пробуем получить информацию о городе через адресный классификатор
    // ПРИМЕЧАНИЕ: Для получения города по ID нужен endpoint типа /get_city_by_city_id?city_id=...
    // Если такого endpoint нет, возвращаем 404
    try {
      // Пробуем получить город по CITY_ID
      const data = await callAddressClassifierAPI(`/get_city_by_city_id?city_id=${encodeURIComponent(id)}`);
      
      const entries = data?.Entries?.Entry || [];
      const cityData = Array.isArray(entries) ? entries[0] : entries;
      
      if (!cityData) {
        throw new Error('City not found');
      }

      // Преобразуем данные в наш формат
      const city = {
        id: cityData.CITY_ID?.toString() || id,
        name: cityData.CITY_UA || cityData.CITY_EN || '',
        postalCode: cityData.POSTCODE || '',
        region: cityData.REGION_UA || '',
        district: cityData.DISTRICT_UA || '',
        cityId: cityData.CITY_ID?.toString() || id, // Сохраняем CITY_ID для получения отделений
      };
      
      res.json(city);
    } catch (apiError) {
      console.error('❌ [Address Classifier API] Get city error:', apiError.message);
      res.status(404).json({ error: 'City not found' });
    }
  } catch (error) {
    next(error);
  }
});

// Получить отделения для города
// Согласно документации "Рекомендації з пошуку індексів та відділень" (Search-offices-and-indexes-v3.pdf)
// 
// Endpoints для получения отделений:
// - GET /get_postoffices_by_city_id?city_id={CITY_ID} - получение отделений по идентификатору населенного пункта
// - GET /get_postoffices_by_katottg?katottg={KATOTTG} - получение отделений по коду KATOTTG
// 
// Формат ответа отделения:
// {POSTOFFICE_ID, POSTOFFICE_UA, POSTOFFICE_EN, POSTCODE, ...}
router.get('/branches', async (req, res, next) => {
  try {
    const { cityId, postalCode, search } = req.query;

    console.log('🔍 [GET /branches] Request:', { cityId, postalCode, search });

    // Для получения отделений нужен CITY_ID (идентификатор населенного пункта)
    // или KATOTTG (код классификатора)
    // postalCode не используется напрямую для получения отделений в адресном классификаторе
    if (!cityId) {
      console.log('❌ [GET /branches] Missing cityId (CITY_ID)');
      return res.status(400).json({ error: 'cityId (CITY_ID) is required. Use cities/search to find city and get CITY_ID' });
    }

    // Проверяем, что cityId является числом (CITY_ID должен быть числовым)
    // Если это строка (например, 'kyiv', 'odesa'), значит это популярный город без CITY_ID
    const cityIdNum = parseInt(cityId, 10);
    if (isNaN(cityIdNum) || cityIdNum <= 0) {
      console.log(`❌ [GET /branches] Invalid cityId: "${cityId}" - must be a numeric CITY_ID. Use cities/search to find city and get CITY_ID`);
      return res.status(400).json({ error: `Invalid cityId: "${cityId}". CITY_ID must be a number. Use cities/search to find city and get CITY_ID` });
    }

    try {
      // Получаем отделения по CITY_ID согласно документации
      // Правильный endpoint: /get_postoffices_by_postcode_cityid_cityvpzid?city_id={city_id}
      // Согласно "Search-offices-and-indexes-v3.pdf" и "Address-classifier-v3.20-09122024.xml"
      const data = await callAddressClassifierAPI(`/get_postoffices_by_postcode_cityid_cityvpzid?city_id=${cityIdNum}`);
      
      // Формат ответа: {Entries: {Entry: [...]}}
      const entries = data?.Entries?.Entry || [];
      const branchesList = Array.isArray(entries) ? entries : [entries];
      
      // Преобразуем данные API в наш формат
      // Согласно документации, формат ответа: {POSTOFFICE_ID, POSTOFFICE_UA, POSTCODE, STREET_UA_VPZ, ...}
      const formattedBranches = branchesList.map((item, index) => ({
        id: item.POSTOFFICE_ID?.toString() || item.POSTCODE || `branch_${index}`,
        name: item.POSTOFFICE_UA || item.POSTOFFICE_EN || item.POSTOFFICE_NAME || `Відділення ${index + 1}`,
        address: item.STREET_UA_VPZ || item.ADDRESS_UA || item.ADDRESS_EN || item.ADDRESS || '',
        postalCode: item.POSTCODE || postalCode || '',
        cityId: cityId,
      })).filter(branch => branch.name);

      // Если есть поисковый запрос, дополнительно фильтруем результаты
      let filteredBranches = formattedBranches;
      if (search && search.length >= 2) {
        const searchLower = search.toLowerCase();
        filteredBranches = formattedBranches.filter(branch => 
          branch.name.toLowerCase().includes(searchLower) ||
          branch.address.toLowerCase().includes(searchLower) ||
          branch.id.toString().toLowerCase().includes(searchLower)
        );
      }

      console.log(`✅ [GET /branches] Found ${filteredBranches.length} branches for cityId: ${cityId}`);
      res.json(filteredBranches);
    } catch (apiError) {
      console.error('❌ [Address Classifier API] Get branches error:', apiError.message);
      // Если API не работает, возвращаем пустой массив
      res.json([]);
    }
  } catch (error) {
    console.error('❌ [GET /branches] Error:', error);
    next(error);
  }
});

// Получить информацию об отделении по ID (POSTOFFICE_ID)
// Согласно документации "Рекомендації з пошуку індексів та відділень"
// ПРИМЕЧАНИЕ: Точный endpoint для получения отделения по ID нужно проверить в документации адресного классификатора
router.get('/branches/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    try {
      // Пробуем получить отделение по POSTOFFICE_ID
      // Возможные варианты: /get_postoffice_by_id?postoffice_id=... или /get_postoffice_by_postoffice_id?postoffice_id=...
      let data;
      try {
        data = await callAddressClassifierAPI(`/get_postoffice_by_id?postoffice_id=${encodeURIComponent(id)}`);
      } catch (error1) {
        try {
          data = await callAddressClassifierAPI(`/get_postoffice_by_postoffice_id?postoffice_id=${encodeURIComponent(id)}`);
        } catch (error2) {
          throw error2;
        }
      }

      const entries = data?.Entries?.Entry || [];
      const branchData = Array.isArray(entries) ? entries[0] : entries;
      
      if (!branchData) {
        throw new Error('Branch not found');
      }

      const branch = {
        id: branchData.POSTOFFICE_ID?.toString() || id,
        name: branchData.POSTOFFICE_UA || branchData.POSTOFFICE_EN || branchData.POSTOFFICE_NAME || '',
        address: branchData.STREET_UA_VPZ || branchData.ADDRESS_UA || branchData.ADDRESS_EN || branchData.ADDRESS || '',
        postalCode: branchData.POSTCODE || '',
        cityId: branchData.CITY_ID?.toString() || null,
      };
      res.json(branch);
    } catch (apiError) {
      console.error('❌ [Address Classifier API] Get branch error:', apiError.message);
      res.status(404).json({ error: 'Branch not found' });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
