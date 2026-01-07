import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
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
import textsRoutes from './routes/texts.js';
import novaPoshtaRoutes from './routes/nova-poshta.js';
import ukrposhtaRoutes from './routes/ukrposhta.js';
import wayforpayRoutes from './routes/wayforpay.js';
import promoRoutes from './routes/promo.js';
import emailTemplatesRoutes from './routes/email-templates.js';
import authRoutes from './routes/auth.js';
import adminAuthRoutes from './routes/admin-auth.js';

import { configurePassport, passport } from './utils/oauth.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { authenticate, authorize } from './middleware/auth.js';
import { adminGuard, validateAdminSession } from './middleware/adminGuard.js';

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

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Отключаем для development, включить для production
  crossOriginEmbedderPolicy: false,
}));

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport configuration
configurePassport();
app.use(passport.initialize());

// Специальный middleware для WayForPay callback - обрабатывает raw body
app.use('/api/wayforpay/callback', express.text({ type: '*/*' }), (req, res, next) => {
  // Если body пришел как строка (raw), преобразуем в объект с ключом
  if (req.body && typeof req.body === 'string' && req.body.startsWith('{')) {
    try {
      // WayForPay может отправить JSON строку как raw body
      req.body = { [req.body]: '' };
      console.log('[WayForPay Middleware] Converted string body to object with key');
    } catch (e) {
      // ignore
    }
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (не требуют авторизации)
app.use('/api/auth', authRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/faqs', faqsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/texts', textsRoutes);
app.use('/api/nova-poshta', novaPoshtaRoutes);
app.use('/api/ukrposhta', ukrposhtaRoutes);
app.use('/api/wayforpay', wayforpayRoutes);
app.use('/api/promo', promoRoutes);

// Protected routes (требуют авторизации)
app.use('/api/orders', apiRateLimiter, ordersRoutes);

// Admin routes (требуют роль admin)
app.use('/api/users', authenticate, authorize('admin'), usersRoutes);
app.use('/api/team', authenticate, authorize('admin'), teamRoutes);
app.use('/api/gallery', authenticate, authorize('admin'), galleryRoutes);
app.use('/api/galleries', authenticate, authorize('admin'), galleriesRoutes);
app.use('/api/comparison', authenticate, authorize('admin'), comparisonRoutes);
app.use('/api/options', authenticate, authorize('admin'), optionsRoutes);
app.use('/api/instagram', authenticate, authorize('admin'), instagramRoutes);
app.use('/api/email-templates', authenticate, authorize('admin'), emailTemplatesRoutes);

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

