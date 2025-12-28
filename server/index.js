import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import settingsRoutes from './routes/settings.js';
import usersRoutes from './routes/users.js';
import pagesRoutes from './routes/pages.js';
import faqsRoutes from './routes/faqs.js';
import reviewsRoutes from './routes/reviews.js';
import teamRoutes from './routes/team.js';
import galleryRoutes from './routes/gallery.js';
import galleriesRoutes from './routes/galleries.js';
import comparisonRoutes from './routes/comparison.js';
import optionsRoutes from './routes/options.js';
import instagramRoutes from './routes/instagram.js';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const app = express();
// Use PORT and HOST from environment (set by hosting) or fallback values.
// Some hostings provide HOST like "http://127.1.5.169:3000" — normalize it.
const PORT = Number(process.env.PORT) || 3001;
const HOST_RAW = (process.env.HOST || '').trim();
const HOST = (HOST_RAW
  .replace(/^https?:\/\//, '')
  .split('/')[0]
  .split(':')[0]
  .trim()) || '0.0.0.0';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/faqs', faqsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/galleries', galleriesRoutes);
app.use('/api/comparison', comparisonRoutes);
app.use('/api/options', optionsRoutes);
app.use('/api/instagram', instagramRoutes);

// Serve uploaded files
const UPLOADS_DIR = join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve frontend when the hosting proxies ALL traffic to Node.js.
// Web root is one level up from /server → / (contains index.html, assets/, etc.)
const WEB_ROOT = join(__dirname, '..');
app.use(express.static(WEB_ROOT));

// SPA fallback (do not hijack API routes)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const indexPath = join(WEB_ROOT, 'index.html');
  if (!existsSync(indexPath)) {
    return res.status(500).send('index.html not found on server');
  }
  res.sendFile(indexPath);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});

