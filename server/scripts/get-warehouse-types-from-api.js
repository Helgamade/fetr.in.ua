import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const API_KEY = process.env.NOVA_POSHTA_API_KEY;
const NOVA_POSHTA_API_URL = 'https://api.novaposhta.ua/v2.0/json/';

async function getWarehouseTypes() {
  try {
    console.log('🔍 Получение типов отделений из API Новой Почты...\n');

    const requestBody = {
      apiKey: API_KEY,
      modelName: 'AddressGeneral',
      calledMethod: 'getWarehouseTypes',
      methodProperties: {}
    };

    console.log('📡 Запрос:', JSON.stringify(requestBody, null, 2));
    console.log('');

    const response = await fetch(NOVA_POSHTA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ Ответ от API:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    if (data.success && data.data) {
      console.log('📋 Типы отделений:');
      console.log('='.repeat(80));
      
      data.data.forEach((type, index) => {
        console.log(`\n${index + 1}. Ref: ${type.Ref}`);
        console.log(`   Description: ${type.Description}`);
        console.log(`   DescriptionRu: ${type.DescriptionRu || 'N/A'}`);
      });

      console.log('\n\n📊 Группировка для использования в коде:');
      console.log('='.repeat(80));
      
      const postomatTypes = [];
      const postOfficeTypes = [];
      
      data.data.forEach(type => {
        const desc = (type.Description || '').toLowerCase();
        const descRu = (type.DescriptionRu || '').toLowerCase();
        
        if (desc.includes('поштомат') || descRu.includes('почтомат') || desc.includes('postomat')) {
          postomatTypes.push(type);
        } else {
          postOfficeTypes.push(type);
        }
      });

      console.log('\n📦 Поштомати (Postomat):');
      postomatTypes.forEach(type => {
        console.log(`  '${type.Ref}', // ${type.Description}`);
      });

      console.log('\n🏢 Відділення (PostOffice):');
      postOfficeTypes.forEach(type => {
        console.log(`  '${type.Ref}', // ${type.Description}`);
      });

    } else {
      console.log('❌ Ошибка в ответе API:', data.errors || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    process.exit(0);
  }
}

getWarehouseTypes();

