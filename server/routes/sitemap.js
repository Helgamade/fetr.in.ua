import express from 'express';
import pool from '../db.js';

const router = express.Router();

const BASE_URL = 'https://fetr.in.ua';

// Статические публичные страницы сайта
const STATIC_PAGES = [
  { url: '/',        changefreq: 'daily',   priority: '1.0' },
  { url: '/reviews', changefreq: 'weekly',  priority: '0.8' },
];

// Утилитные страницы — не индексируем
const EXCLUDE_SLUGS = new Set(['checkout', 'thank-you', 'login', 'auth']);

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

router.get('/', async (req, res) => {
  try {
    const today = formatDate(new Date());

    // Получаем все опубликованные CMS-страницы
    const [pages] = await pool.execute(
      'SELECT slug, updated_at FROM pages WHERE is_published = 1 ORDER BY id'
    );

    let urls = '';

    // 1. Статические страницы
    for (const page of STATIC_PAGES) {
      urls += `
  <url>
    <loc>${BASE_URL}${xmlEscape(page.url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    // 2. CMS-страницы из БД
    for (const page of pages) {
      if (EXCLUDE_SLUGS.has(page.slug)) continue;
      const lastmod = page.updated_at ? formatDate(page.updated_at) : today;
      urls += `
  <url>
    <loc>${BASE_URL}/${xmlEscape(page.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600'); // кешируем 1 час
    res.send(xml);
  } catch (err) {
    console.error('[Sitemap] Error:', err);
    res.status(500).send('<?xml version="1.0"?><error>Internal Server Error</error>');
  }
});

export default router;
