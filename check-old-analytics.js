import fs from 'fs';

const files = fs.readdirSync('dist/assets').filter(f => f.startsWith('index-') && f.endsWith('.js'));
const jsFile = files[0];
console.log('Checking file:', jsFile);

const content = fs.readFileSync(`dist/assets/${jsFile}`, 'utf8');

// Ищем ИМЕННО старые логи с эмодзи
const pattern = /console\.(log|warn|error)\([^)]*Analytics:[^)]*\)/g;
const matches = content.match(pattern);

if (matches && matches.length > 0) {
  console.log('\n❌ FOUND OLD "📊 Analytics:" LOGS:');
  matches.slice(0, 10).forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.substring(0, 150)}`);
  });
  console.log(`\nTotal: ${matches.length}`);
} else {
  console.log('\n✅ NO OLD "📊 Analytics:" LOGS');
}

