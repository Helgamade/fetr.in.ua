import fs from 'fs';

// Проверяем скомпилированный JS файл
const files = fs.readdirSync('dist/assets').filter(f => f.startsWith('index-') && f.endsWith('.js'));

if (files.length === 0) {
  console.log('NO JS FILES FOUND');
  process.exit(1);
}

const jsFile = files[0];
console.log('Checking file:', jsFile);

const content = fs.readFileSync(`dist/assets/${jsFile}`, 'utf8');

// Ищем старые логи аналитики
const oldAnalyticsPattern = /console\.log\(['"`].*?Analytics.*?['"`]/g;
const matches = content.match(oldAnalyticsPattern);

if (matches && matches.length > 0) {
  console.log('\n❌ FOUND OLD ANALYTICS LOGS:');
  matches.slice(0, 10).forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.substring(0, 100)}`);
  });
  console.log(`\nTotal matches: ${matches.length}`);
  process.exit(1);
} else {
  console.log('\n✅ NO OLD ANALYTICS LOGS FOUND');
  process.exit(0);
}

