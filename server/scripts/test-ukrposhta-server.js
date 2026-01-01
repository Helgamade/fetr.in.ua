/**
 * Тест Ukrposhta API через наш сервер
 * Проверяет, работают ли серверные endpoints с правильными параметрами из документации
 */

import dotenv from 'dotenv';
dotenv.config();

// Все токены из АРІ_ключі.pdf
const TOKENS = {
  'PROD_BEARER_ECOM': '67f02a7c-3af7-34d1-aa18-7eb4d96f3be4',
  'PROD_BEARER_STATUS_TRACKING': '7f37c2c3-780b-3602-8e18-b7e50b901cd5',
  'PROD_COUNTERPARTY_TOKEN': 'ab714b81-60a5-4dc5-a106-1a382f8d84bf',
};

// Базовый URL API (согласно документации)
const ADDRESS_CLASSIFIER_BASE = 'https://www.ukrposhta.ua/address-classifier-ws';

/**
 * Тестируем конкретную конфигурацию
 */
async function testConfiguration(tokenName, token) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing: ${tokenName}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const results = {
    token: tokenName,
    tests: [],
  };
  
  // Тест 1: Получение регионов
  try {
    const url = `${ADDRESS_CLASSIFIER_BASE}/get_regions`;
    console.log(`📡 [Test 1] GET ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'uk-UA,uk;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.ukrposhta.ua/',
        'Origin': 'https://www.ukrposhta.ua',
      },
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      const entries = data?.Entries?.Entry || [];
      const regions = Array.isArray(entries) ? entries : [entries];
      const validRegions = regions.filter(r => r && Object.keys(r).length > 0);
      
      console.log(`✅ [Test 1] Success! Found ${validRegions.length} regions`);
      results.tests.push({ test: 'get_regions', status: 'success', count: validRegions.length });
    } else {
      console.log(`❌ [Test 1] Error ${response.status}: ${responseText.substring(0, 200)}`);
      results.tests.push({ test: 'get_regions', status: 'error', error: `${response.status}: ${responseText.substring(0, 100)}` });
    }
  } catch (error) {
    console.log(`❌ [Test 1] Exception: ${error.message}`);
    results.tests.push({ test: 'get_regions', status: 'exception', error: error.message });
  }
  
  // Тест 2: Поиск города "Київ" (правильный endpoint из документации)
  try {
    const cityName = 'Київ';
    const regionId = '270'; // Киевская область
    const url = `${ADDRESS_CLASSIFIER_BASE}/get_city_by_name?region_id=${regionId}&district_id=&city_name=${encodeURIComponent(cityName)}&lang=UA&fuzzy=1`;
    console.log(`📡 [Test 2] GET ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'uk-UA,uk;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.ukrposhta.ua/',
        'Origin': 'https://www.ukrposhta.ua',
      },
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      const entries = data?.Entries?.Entry || [];
      const cities = Array.isArray(entries) ? entries : [entries];
      const validCities = cities.filter(c => c && Object.keys(c).length > 0);
      
      if (validCities.length > 0) {
        console.log(`✅ [Test 2] Success! Found ${validCities.length} cities`);
        console.log(`   Sample: ${validCities[0].CITY_NAME} (ID: ${validCities[0].CITY_ID})`);
        results.tests.push({ test: 'get_city_by_name', status: 'success', count: validCities.length, sample: validCities[0] });
      } else {
        console.log(`⚠️  [Test 2] Empty response (no cities found)`);
        results.tests.push({ test: 'get_city_by_name', status: 'empty', data: data });
      }
    } else {
      console.log(`❌ [Test 2] Error ${response.status}: ${responseText.substring(0, 200)}`);
      results.tests.push({ test: 'get_city_by_name', status: 'error', error: `${response.status}: ${responseText.substring(0, 100)}` });
    }
  } catch (error) {
    console.log(`❌ [Test 2] Exception: ${error.message}`);
    results.tests.push({ test: 'get_city_by_name', status: 'exception', error: error.message });
  }
  
  // Тест 3: Получение отделений для Киева (если нашли CITY_ID)
  const cityTest = results.tests.find(t => t.test === 'get_city_by_name' && t.status === 'success');
  if (cityTest && cityTest.sample && cityTest.sample.CITY_ID) {
    try {
      const cityId = cityTest.sample.CITY_ID;
      const url = `${ADDRESS_CLASSIFIER_BASE}/get_postoffices_by_postcode_cityid_cityvpzid?city_id=${cityId}`;
      console.log(`📡 [Test 3] GET ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'uk-UA,uk;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.ukrposhta.ua/',
          'Origin': 'https://www.ukrposhta.ua',
        },
      });
      
      const responseText = await response.text();
      
      if (response.ok) {
        const data = JSON.parse(responseText);
        const entries = data?.Entries?.Entry || [];
        const branches = Array.isArray(entries) ? entries : [entries];
        const validBranches = branches.filter(b => b && Object.keys(b).length > 0);
        
        if (validBranches.length > 0) {
          console.log(`✅ [Test 3] Success! Found ${validBranches.length} branches`);
          console.log(`   Sample: ${validBranches[0].POSTOFFICE_UA || validBranches[0].POSTOFFICE_NAME}`);
          results.tests.push({ test: 'get_postoffices', status: 'success', count: validBranches.length });
        } else {
          console.log(`⚠️  [Test 3] Empty response (no branches found)`);
          results.tests.push({ test: 'get_postoffices', status: 'empty', data: data });
        }
      } else {
        console.log(`❌ [Test 3] Error ${response.status}: ${responseText.substring(0, 200)}`);
        results.tests.push({ test: 'get_postoffices', status: 'error', error: `${response.status}: ${responseText.substring(0, 100)}` });
      }
    } catch (error) {
      console.log(`❌ [Test 3] Exception: ${error.message}`);
      results.tests.push({ test: 'get_postoffices', status: 'exception', error: error.message });
    }
  } else {
    console.log(`⏭️  [Test 3] Skipped (no CITY_ID from previous test)`);
    results.tests.push({ test: 'get_postoffices', status: 'skipped', reason: 'No CITY_ID from previous test' });
  }
  
  return results;
}

/**
 * Запуск всех тестов
 */
async function runTests() {
  console.log('🚀 UKRPOSHTA API SERVER TEST');
  console.log('Testing endpoints through our server with correct parameters from documentation');
  console.log('='.repeat(80));
  
  const allResults = [];
  
  // Тестируем каждый токен
  for (const [tokenName, token] of Object.entries(TOKENS)) {
    const result = await testConfiguration(tokenName, token);
    allResults.push(result);
    
    // Небольшая задержка между токенами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Также тестируем без токена
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing: NO_TOKEN`);
  console.log(`${'='.repeat(80)}\n`);
  const noTokenResult = await testConfiguration('NO_TOKEN', null);
  allResults.push(noTokenResult);
  
  // Выводим итоги
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(80) + '\n');
  
  for (const result of allResults) {
    const successCount = result.tests.filter(t => t.status === 'success').length;
    const totalCount = result.tests.length;
    
    console.log(`${result.token}: ${successCount}/${totalCount} tests passed`);
    
    for (const test of result.tests) {
      const icon = test.status === 'success' ? '✅' : test.status === 'empty' ? '⚠️' : test.status === 'skipped' ? '⏭️' : '❌';
      console.log(`   ${icon} ${test.test}: ${test.status}`);
      if (test.count) console.log(`      Found: ${test.count} items`);
      if (test.error) console.log(`      Error: ${test.error}`);
    }
    console.log('');
  }
  
  // Определяем лучший токен
  const bestResult = allResults
    .filter(r => r.tests.some(t => t.status === 'success'))
    .sort((a, b) => {
      const aSuccess = a.tests.filter(t => t.status === 'success').length;
      const bSuccess = b.tests.filter(t => t.status === 'success').length;
      return bSuccess - aSuccess;
    })[0];
  
  if (bestResult) {
    console.log('🏆 RECOMMENDED TOKEN:');
    console.log(`   ${bestResult.token}`);
    console.log('');
  } else {
    console.log('❌ No working configuration found!\n');
  }
}

runTests().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

