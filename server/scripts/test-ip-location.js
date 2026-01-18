/**
 * Тестовый скрипт для проверки определения города по IP
 * Запуск: node server/scripts/test-ip-location.js
 */

import pool from '../db.js';

// Копируем функцию getLocationByIP из analytics.js
async function getLocationByIP(ip) {
  try {
    // Исключаем локальные и внутренние IP
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      console.log(`[Test] IP ${ip} is local/internal, skipping`);
      return { city: null, country: null };
    }

    // Берем первый IP из списка, если их несколько (x-forwarded-for)
    const cleanIP = ip.split(',')[0].trim();
    console.log(`[Test] Getting location for IP: ${cleanIP}`);

    // Используем ip-api.com (бесплатный, 45 запросов/минуту)
    // Используем AbortController для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`http://ip-api.com/json/${cleanIP}?fields=status,city,country`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[Test] IP-API response not OK: ${response.status}`);
        return { city: null, country: null };
      }

      const data = await response.json();
      console.log(`[Test] IP-API response:`, JSON.stringify(data, null, 2));
    
      // ip-api.com возвращает status: 'success' при успехе, 'fail' при ошибке
      if (data.status === 'success') {
        const result = {
          city: data.city || null,
          country: data.country || null,
        };
        console.log(`[Test] ✓ Location determined: ${result.city}, ${result.country}`);
        return result;
      }

      console.error(`[Test] ✗ IP-API returned status 'fail':`, data.message || 'unknown error');
      return { city: null, country: null };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[Test] ✗ Timeout getting location by IP');
      } else {
        console.error('[Test] ✗ Error getting location by IP:', fetchError.message);
      }
      return { city: null, country: null };
    }
  } catch (error) {
    console.error('[Test] ✗ Error in getLocationByIP:', error.message);
    return { city: null, country: null };
  }
}

async function testIPLocation() {
  console.log('=== Testing IP Location Detection ===\n');

  // Тест 1: Получаем IP адрес текущего запроса (тестовый публичный IP)
  const testIPs = [
    '8.8.8.8', // Google DNS - должен вернуть USA
    '1.1.1.1', // Cloudflare DNS - должен вернуть Australia
    // Добавим реальный IP из запроса если нужно
  ];

  for (const testIP of testIPs) {
    console.log(`\n--- Testing IP: ${testIP} ---`);
    const location = await getLocationByIP(testIP);
    console.log(`Result:`, location);
  }

  // Тест 2: Проверяем запись в базу данных
  console.log('\n=== Testing Database Insert ===\n');
  
  const testSessionId = `test-${Date.now()}`;
  const testIP = '8.8.8.8'; // Используем тестовый IP
  
  console.log(`Creating test session: ${testSessionId}`);
  
  // Получаем город для тестового IP
  const location = await getLocationByIP(testIP);
  console.log(`Location for test IP:`, location);
  
  try {
    // Создаем тестовую сессию
    await pool.execute(`
      INSERT INTO analytics_sessions (
        session_id, visitor_fingerprint,
        ip_address, country, city,
        device_type, browser, os,
        cart_items_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testSessionId,
      'test-fingerprint',
      testIP,
      location.country,
      location.city,
      'desktop',
      'Test Browser',
      'Test OS',
      0
    ]);
    
    console.log(`✓ Test session created: ${testSessionId}`);
    
    // Проверяем, что запись появилась
    const [rows] = await pool.execute(
      'SELECT session_id, ip_address, city, country FROM analytics_sessions WHERE session_id = ?',
      [testSessionId]
    );
    
    if (rows.length > 0) {
      const session = rows[0];
      console.log('\n✓ Session found in database:');
      console.log(JSON.stringify(session, null, 2));
      
      if (session.city || session.country) {
        console.log('\n✅ SUCCESS: City and country are stored in database!');
      } else {
        console.log('\n❌ FAIL: City and country are NULL in database');
      }
    } else {
      console.log('\n❌ FAIL: Session not found in database');
    }
    
    // Удаляем тестовую сессию
    await pool.execute('DELETE FROM analytics_sessions WHERE session_id = ?', [testSessionId]);
    console.log(`\n✓ Test session deleted: ${testSessionId}`);
    
  } catch (error) {
    console.error('\n❌ Error inserting test session:', error);
    console.error(error.stack);
  }

  // Закрываем соединение
  await pool.end();
  console.log('\n=== Test Complete ===');
}

// Запускаем тест
testIPLocation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
