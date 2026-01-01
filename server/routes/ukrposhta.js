import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const router = express.Router();

// Адресный классификатор API Укрпошты
// ✅ Тестирование показало, что оба токена работают
// Попробуем PRODUCTION BEARER eCom (как предложено для решения проблемы с заголовками)
// URL: https://www.ukrposhta.ua/address-classifier-ws (с www)
// PRODUCTION BEARER eCom (из АРІ_ключі.pdf): 67f02a7c-3af7-34d1-aa18-7eb4d96f3be4
// PROD_COUNTERPARTY TOKEN (альтернатива): ab714b81-60a5-4dc5-a106-1a382f8d84bf
const ADDRESS_CLASSIFIER_BASE = 'https://www.ukrposhta.ua/address-classifier-ws';
const UKRPOSHTA_BEARER_TOKEN = process.env.UKRPOSHTA_BEARER_TOKEN || '67f02a7c-3af7-34d1-aa18-7eb4d96f3be4';

// Функция для вызова адресного классификатора API
async function callAddressClassifierAPI(endpoint) {
  // ВАЖНО: endpoint может уже содержать query параметры, поэтому формируем URL правильно
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${ADDRESS_CLASSIFIER_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  try {
    // Проверяем, что токен определён
    if (!UKRPOSHTA_BEARER_TOKEN) {
      throw new Error('UKRPOSHTA_BEARER_TOKEN is not defined! Check server/.env file.');
    }
    
    console.log(`📡 [Address Classifier API] GET ${url}`);
    console.log(`🔑 [Address Classifier API] Using token: ${UKRPOSHTA_BEARER_TOKEN.substring(0, 20)}...`);
    
    // ВАЖНО: Передаем заголовки явно, как в примере пользователя
    // Используем минимальный набор заголовков для избежания проблем с Cloudflare
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${UKRPOSHTA_BEARER_TOKEN}`,
        'Accept': 'application/json',
      },
    });
    
    // Логируем результат для отладки
    console.log(`📋 [Address Classifier API] Response status: ${response.status}`);
    if (!response.ok) {
      console.log(`📋 [Address Classifier API] Response headers:`, Object.fromEntries(response.headers.entries()));
    }
    
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
      // ВАЖНО: Используем URLSearchParams для правильного кодирования кириллицы
      try {
        console.log(`🔍 [Ukrposhta API] Searching without region_id (all Ukraine)`);
        const params = new URLSearchParams({ city_ua: q });
        const data = await callAddressClassifierAPI(
          `/get_city_by_region_id_and_district_id_and_city_ua?${params.toString()}`
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
            const params = new URLSearchParams({ 
              region_id: region.id,
              city_ua: q 
            });
            const data = await callAddressClassifierAPI(
              `/get_city_by_region_id_and_district_id_and_city_ua?${params.toString()}`
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
      // ВАЖНО: Используем Set для правильной дедупликации по CITY_ID
      const citiesMap = new Map();
      
      // Сначала добавляем популярные города
      popularMatches.forEach(city => {
        if (city.cityId) {
          citiesMap.set(city.cityId, city);
        } else {
          citiesMap.set(city.id, city);
        }
      });
      
      // Затем добавляем города из API (перезаписывают популярные, если есть CITY_ID)
      formattedCities.forEach(city => {
        const key = city.cityId || city.id;
        if (key && !citiesMap.has(key)) {
          citiesMap.set(key, city);
        }
      });
      
      const allCities = Array.from(citiesMap.values());
      
      // Сортируем: сначала точные совпадения (начинаются с запроса), потом остальные
      // Внутри каждой группы - сортировка по алфавиту от А до Я
      allCities.sort((a, b) => {
        const qLower = q.toLowerCase();
        const aStartsWith = a.name.toLowerCase().startsWith(qLower);
        const bStartsWith = b.name.toLowerCase().startsWith(qLower);
        
        // Приоритет: точные совпадения первыми
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Внутри группы - сортировка по алфавиту
        return a.name.localeCompare(b.name, 'uk', { sensitivity: 'base' });
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

// Получить информацию о городе по ID (CITY_ID)
// По аналогии с NovaPoshtaDelivery - возвращаем данные из популярных городов или ищем через API
router.get('/cities/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Проверяем популярные города
    const popularCity = POPULAR_CITIES.find(c => c.id === id || c.cityId === id || c.postalCode === id);
    if (popularCity) {
      // Если у популярного города нет cityId, пытаемся найти его через API
      if (!popularCity.cityId && popularCity.name) {
        try {
          const params = new URLSearchParams({ city_ua: popularCity.name });
          const data = await callAddressClassifierAPI(
            `/get_city_by_region_id_and_district_id_and_city_ua?${params.toString()}`
          );
          const entries = data?.Entries?.Entry || [];
          const cities = Array.isArray(entries) ? entries : [entries];
          const foundCity = cities.find(c => c.CITY_ID?.toString() === id || c.CITY_UA === popularCity.name);
          if (foundCity) {
            return res.json({
              id: foundCity.CITY_ID?.toString() || id,
              name: foundCity.CITY_UA || popularCity.name,
              postalCode: popularCity.postalCode || '',
              region: foundCity.REGION_UA || popularCity.region || '',
              district: foundCity.DISTRICT_UA || '',
              cityId: foundCity.CITY_ID?.toString() || id,
            });
          }
        } catch (apiError) {
          console.error('❌ [GET /cities/:id] Error searching city:', apiError.message);
        }
      }
      return res.json(popularCity);
    }

    // Если id - это CITY_ID (число), пытаемся найти город через API
    // Сначала пробуем поиск без region_id (по всей Украине) с пустым city_ua
    // Если не найдем, пробуем поиск в популярных регионах
    const cityIdNum = parseInt(id, 10);
    if (!isNaN(cityIdNum) && cityIdNum > 0) {
      console.log(`🔍 [GET /cities/:id] Searching for CITY_ID: ${cityIdNum}`);
      
      // Пробуем поиск без region_id (по всей Украине) - но API может не поддерживать это
      // Вместо этого, пробуем поиск в популярных регионах с разными вариантами
      const popularRegions = [
        { id: '270', name: 'Київська' },
        { id: '14', name: 'Львівська' },
        { id: '63', name: 'Харківська' },
        { id: '51', name: 'Одеська' },
        { id: '12', name: 'Дніпропетровська' },
        { id: '23', name: 'Запорізька' },
        { id: '32', name: 'Київ' },
        { id: '5', name: 'Вінницька' },
        { id: '7', name: 'Волинська' },
        { id: '9', name: 'Донецька' },
        { id: '26', name: 'Житомирська' },
        { id: '30', name: 'Закарпатська' },
        { id: '35', name: 'Івано-Франківська' },
        { id: '46', name: 'Миколаївська' },
        { id: '48', name: 'Одеська' },
        { id: '53', name: 'Полтавська' },
        { id: '56', name: 'Рівненська' },
        { id: '59', name: 'Сумська' },
        { id: '61', name: 'Тернопільська' },
        { id: '65', name: 'Херсонська' },
        { id: '68', name: 'Хмельницька' },
        { id: '71', name: 'Черкаська' },
        { id: '74', name: 'Чернівецька' },
        { id: '77', name: 'Чернігівська' },
      ];
      
      // Пробуем поиск в каждом регионе (без фильтра по названию)
      // Но API требует city_ua, поэтому пробуем с пустой строкой или без параметра
      for (const region of popularRegions) {
        try {
          // Пробуем поиск без city_ua (только region_id)
          // Если API не поддерживает, пробуем с пустым city_ua
          const data = await callAddressClassifierAPI(
            `/get_city_by_region_id_and_district_id_and_city_ua?region_id=${region.id}&city_ua=`
          );
          const entries = data?.Entries?.Entry || [];
          const cities = Array.isArray(entries) ? entries : [entries];
          const foundCity = cities.find(c => c.CITY_ID?.toString() === id);
          if (foundCity) {
            console.log(`✅ [GET /cities/:id] Found city ${foundCity.CITY_UA} (CITY_ID: ${id}) in region ${region.name}`);
            return res.json({
              id: foundCity.CITY_ID?.toString() || id,
              name: foundCity.CITY_UA || '',
              postalCode: '',
              region: foundCity.REGION_UA || '',
              district: foundCity.DISTRICT_UA || '',
              cityId: foundCity.CITY_ID?.toString() || id,
            });
          }
        } catch (apiError) {
          // Продолжаем поиск в следующем регионе
          continue;
        }
      }
      
      // Если не нашли в популярных регионах, пробуем получить информацию о городе
      // через endpoint отделений - если отделения для города существуют, значит город существует
      // и мы можем извлечь информацию о городе из первого отделения
      try {
        console.log(`🔄 [GET /cities/:id] Trying to get city info via branches endpoint for CITY_ID: ${cityIdNum}`);
        const branchesData = await callAddressClassifierAPI(
          `/get_postoffices_by_postcode_cityid_cityvpzid?city_id=${cityIdNum}`
        );
        const branchesEntries = branchesData?.Entries?.Entry || [];
        const branchesList = Array.isArray(branchesEntries) ? branchesEntries : [branchesEntries];
        
        if (branchesList.length > 0 && branchesList[0]) {
          const firstBranch = branchesList[0];
          // Извлекаем информацию о городе из отделения
          // В ответе отделения может быть информация о городе (CITY_ID, CITY_UA, REGION_UA и т.д.)
          // Но в реальном ответе API может не быть полной информации о городе
          // Поэтому пробуем поиск по названию города, если оно есть в отделении
          
          // Если в отделении есть информация о городе, используем её
          // Иначе пробуем поиск по всем регионам с более широким запросом
          console.log(`✅ [GET /cities/:id] Found branches for CITY_ID ${cityIdNum}, extracting city info from first branch`);
          
          // Пробуем найти город через поиск по всем регионам с частичным совпадением
          // Но это неэффективно, поэтому лучше вернуть минимальную информацию
          // и позволить фронтенду использовать данные из отделений
          
          // ВАЖНО: Если отделения загружаются, значит город существует
          // Возвращаем минимальную информацию о городе на основе CITY_ID
          // НЕ возвращаем postalCode из отделения, так как это индекс отделения, а не города
          return res.json({
            id: cityIdNum.toString(),
            name: firstBranch.CITY_UA || firstBranch.CITY_NAME || `City ${cityIdNum}`, // Может быть в ответе отделения
            postalCode: '', // Не используем POSTCODE из отделения - это индекс отделения, а не города
            region: firstBranch.REGION_UA || firstBranch.REGION_NAME || '',
            district: firstBranch.DISTRICT_UA || firstBranch.DISTRICT_NAME || '',
            cityId: cityIdNum.toString(),
          });
        }
      } catch (branchesError) {
        console.log(`⚠️ [GET /cities/:id] Could not get city info via branches: ${branchesError.message}`);
      }
      
      console.log(`⚠️ [GET /cities/:id] City with CITY_ID ${cityIdNum} not found in popular regions and branches endpoint`);
    }

    console.log(`⚠️ [GET /cities/:id] City not found. City ID: ${id}`);
    res.status(404).json({ error: 'City not found. Use /cities/search to find cities.' });
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
// По аналогии с NovaPoshtaDelivery - получаем все отделения для города и находим нужное
router.get('/branches/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cityId } = req.query;

    console.log(`🔍 [GET /branches/:id] Request:`, { id, cityId });

    if (!cityId) {
      console.log(`❌ [GET /branches/:id] Missing cityId query parameter. Branch ID: ${id}`);
      return res.status(400).json({ error: 'cityId query parameter is required. Example: /branches/:id?cityId=12345' });
    }

    const cityIdNum = parseInt(cityId, 10);
    if (isNaN(cityIdNum) || cityIdNum <= 0) {
      console.log(`❌ [GET /branches/:id] Invalid cityId: "${cityId}". Branch ID: ${id}`);
      return res.status(400).json({ error: `Invalid cityId: "${cityId}". CITY_ID must be a number.` });
    }

    // Получаем все отделения для города
    try {
      const data = await callAddressClassifierAPI(`/get_postoffices_by_postcode_cityid_cityvpzid?city_id=${cityIdNum}`);
      const entries = data?.Entries?.Entry || [];
      const branchesList = Array.isArray(entries) ? entries : [entries];
      
      console.log(`📦 [GET /branches/:id] Loaded ${branchesList.length} branches for cityId: ${cityIdNum}`);
      
      // Ищем отделение по ID
      const foundBranch = branchesList.find(b => 
        b.POSTOFFICE_ID?.toString() === id || 
        b.POSTCODE === id ||
        (b.POSTOFFICE_ID && b.POSTOFFICE_ID.toString() === id)
      );

      if (foundBranch) {
        console.log(`✅ [GET /branches/:id] Found branch:`, { id, name: foundBranch.POSTOFFICE_UA });
        return res.json({
          id: foundBranch.POSTOFFICE_ID?.toString() || foundBranch.POSTCODE || id,
          name: foundBranch.POSTOFFICE_UA || foundBranch.POSTOFFICE_EN || foundBranch.POSTOFFICE_NAME || '',
          address: foundBranch.STREET_UA_VPZ || foundBranch.ADDRESS_UA || foundBranch.ADDRESS_EN || foundBranch.ADDRESS || '',
          postalCode: foundBranch.POSTCODE || '',
          cityId: cityId,
        });
      }

      console.log(`⚠️ [GET /branches/:id] Branch not found. Branch ID: ${id}, City ID: ${cityId}`);
      res.status(404).json({ error: 'Branch not found. Use /branches?cityId=... to list branches.' });
    } catch (apiError) {
      console.error('❌ [GET /branches/:id] Error loading branches:', apiError.message);
      res.status(404).json({ error: 'Branch not found. API error.' });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
