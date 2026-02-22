import { readFileSync, readdirSync } from 'fs';

const dir = '/home/idesig02/fetr.in.ua/www/dist/assets';
const files = readdirSync(dir).filter(f => f.endsWith('.js'));

for (const f of files) {
  const content = readFileSync(`${dir}/${f}`, 'utf8');
  const idx = content.indexOf('sortOrder');
  if (idx !== -1) {
    console.log(`\n=== ${f} ===`);
    console.log('sortOrder context:', content.slice(idx, idx + 150));
    console.log('Has sr-only:', content.includes('sr-only'));
    console.log('Has orderCount in handleSave area:', content.slice(idx, idx+150).includes('orderCount'));
  }
}
