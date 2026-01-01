/**
 * Автоматический тест Ukrposhta API
 * Проверяет все возможные комбинации токенов, URL и endpoints
 */

import fs from 'fs';

// Все токены из АРІ_ключі.pdf
const TOKENS = {
  'PROD_BEARER_ECOM': '67f02a7c-3af7-34d1-aa18-7eb4d96f3be4',
  'PROD_BEARER_STATUS_TRACKING': '7f37c2c3-780b-3602-8e18-b7e50b901cd5',
  'PROD_COUNTERPARTY_TOKEN': 'ab714b81-60a5-4dc5-a106-1a382f8d84bf',
  'SANDBOX_BEARER_ECOM': '4bfd1c4e-ff8f-3952-bb30-8fc17c5975db',
  'SANDBOX_BEARER_STATUS_TRACKING': 'd4ff701b-795e-3951-a7dc-1202d6fa388a',
  'SANDBOX_COUNTERPARTY_TOKEN': '2fbee77e-2f39-3f34-823f-52d4b3e0bae2',
  'NO_TOKEN': null,
};

// Все возможные базовые URL
const BASE_URLS = [
  'https://www.ukrposhta.ua/address-classifier-ws',
  'https://ukrposhta.ua/address-classifier-ws',
  'https://www.ukrposhta.ua/address-classifier-ws/1.0.0',
  'https://ukrposhta.ua/address-classifier-ws/1.0.0',
  'https://www.ukrposhta.ua/ecom/0.0.1',
  'https://ukrposhta.ua/ecom/0.0.1',
];

// Endpoints для тестирования
const ENDPOINTS = [
  '/get_regions',
  '/get_city_by_region_id_and_district_id_and_city_ua?region_id=270&city_ua=Київ',
  '/get_city_by_city_id?city_id=4926',
  '/get_postoffices_by_postcode_cityid_cityvpzid?city_id=4926',
  '/get_postoffices_by_city_id?city_id=4926',
];

// Различные наборы заголовков
const HEADER_PRESETS = {
  'Minimal': {},
  'Basic': {
    'Accept': 'application/json',
  },
  'Browser-like': {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  'Full': {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.ukrposhta.ua/',
    'Origin': 'https://www.ukrposhta.ua',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
};

// Результаты тестов
const results = {
  success: [],
  errors: {},
  total: 0,
  tested: 0,
};

/**
 * Тест одного варианта
 */
async function testVariant(baseUrl, endpoint, tokenName, token, headerPreset, headers) {
  const url = `${baseUrl}${endpoint}`;
  const testHeaders = { ...headers };
  
  if (token) {
    testHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const variantName = `${baseUrl} | ${tokenName} | ${headerPreset}`;
  results.total++;
  
  try {
    console.log(`\n🧪 Testing: ${variantName}`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: testHeaders,
      timeout: 10000,
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.log(`   ⚠️  Response: ${response.status} - Not JSON: ${responseText.substring(0, 100)}`);
        if (!results.errors['Parse Error']) results.errors['Parse Error'] = [];
        results.errors['Parse Error'].push(variantName);
        return;
      }
      
      console.log(`   ✅ SUCCESS! Status: ${response.status}`);
      console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
      
      results.success.push({
        variant: variantName,
        baseUrl,
        endpoint,
        tokenName,
        token,
        headerPreset,
        status: response.status,
        data: data,
        url: url,
      });
      results.tested++;
    } else {
      const errorType = `${response.status} ${response.statusText}`;
      console.log(`   ❌ Error: ${errorType}`);
      console.log(`   Response: ${responseText.substring(0, 200)}`);
      
      if (!results.errors[errorType]) results.errors[errorType] = [];
      results.errors[errorType].push(variantName);
      results.tested++;
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
    
    const errorType = error.code || error.message.split(':')[0] || 'Unknown Error';
    if (!results.errors[errorType]) results.errors[errorType] = [];
    results.errors[errorType].push(variantName);
    results.tested++;
  }
}

/**
 * Основная функция тестирования
 */
async function runTests() {
  console.log('='.repeat(80));
  console.log('🚀 UKRPOSHTA API AUTOMATED TEST');
  console.log('='.repeat(80));
  console.log(`\n📋 Test Configuration:`);
  console.log(`   - Tokens: ${Object.keys(TOKENS).length}`);
  console.log(`   - Base URLs: ${BASE_URLS.length}`);
  console.log(`   - Endpoints: ${ENDPOINTS.length}`);
  console.log(`   - Header Presets: ${Object.keys(HEADER_PRESETS).length}`);
  console.log(`   - Total Combinations: ${Object.keys(TOKENS).length * BASE_URLS.length * ENDPOINTS.length * Object.keys(HEADER_PRESETS).length}`);
  
  const startTime = Date.now();
  
  // Тестируем все комбинации
  for (const baseUrl of BASE_URLS) {
    for (const endpoint of ENDPOINTS) {
      for (const [tokenName, token] of Object.entries(TOKENS)) {
        for (const [headerPreset, headers] of Object.entries(HEADER_PRESETS)) {
          await testVariant(baseUrl, endpoint, tokenName, token, headerPreset, headers);
          
          // Небольшая задержка между запросами
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Вывод результатов
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`\n⏱️  Duration: ${duration}s`);
  console.log(`📊 Total Tests: ${results.total}`);
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`❌ Failed: ${results.tested - results.success.length}`);
  
  if (results.success.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('🎉 SUCCESSFUL CONFIGURATIONS:');
    console.log('='.repeat(80));
    
    results.success.forEach((result, index) => {
      console.log(`\n[${index + 1}] ${result.variant}`);
      console.log(`    URL: ${result.url}`);
      console.log(`    Status: ${result.status}`);
      console.log(`    Token: ${result.tokenName}${result.token ? ` (${result.token.substring(0, 20)}...)` : ''}`);
      console.log(`    Headers: ${result.headerPreset}`);
      console.log(`    Response: ${JSON.stringify(result.data).substring(0, 200)}...`);
      
      // Детальная конфигурация для использования
      console.log(`\n    📝 Configuration for implementation:`);
      console.log(`    const ADDRESS_CLASSIFIER_BASE = '${result.baseUrl}';`);
      if (result.token) {
        console.log(`    const UKRPOSHTA_BEARER_TOKEN = '${result.token}';`);
      } else {
        console.log(`    // No token required`);
      }
      console.log(`    // Header preset: ${result.headerPreset}`);
    });
  }
  
  if (Object.keys(results.errors).length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('❌ ERROR SUMMARY:');
    console.log('='.repeat(80));
    
    for (const [errorType, variants] of Object.entries(results.errors)) {
      console.log(`\n${errorType}: ${variants.length} occurrences`);
      variants.slice(0, 3).forEach(variant => {
        console.log(`   - ${variant}`);
      });
      if (variants.length > 3) {
        console.log(`   ... and ${variants.length - 3} more`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Сохранение результатов в файл
  const resultsFile = 'ukrposhta-api-test-results.json';
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Full results saved to: ${resultsFile}`);
  console.log('='.repeat(80));
  
  // Возвращаем успешные конфигурации
  return results.success;
}

// Запуск тестов
runTests()
  .then(successfulConfigs => {
    if (successfulConfigs.length > 0) {
      console.log(`\n✅ Found ${successfulConfigs.length} working configuration(s)!`);
      process.exit(0);
    } else {
      console.log(`\n❌ No working configurations found.`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(`\n💥 Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });

