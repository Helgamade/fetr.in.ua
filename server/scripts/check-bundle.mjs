import { readFileSync } from 'fs';
import { readdirSync } from 'fs';

const dir = '/home/idesig02/fetr.in.ua/www/dist/assets';
const files = readdirSync(dir).filter(f => f.startsWith('Products-') && f.endsWith('.js'));
console.log('Bundle files:', files);

const content = readFileSync(`${dir}/${files[0]}`, 'utf8');
const idx = content.indexOf('sortOrder');
console.log('Context around sortOrder:', content.slice(idx, idx + 120));
console.log('Has orderCount:', content.includes('orderCount'));
console.log('Has sr-only:', content.includes('sr-only'));
