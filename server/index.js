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

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const app = express();
// Use PORT from environment (set by hosting) or fallback to 3001
const PORT = process.env.PORT || 3001;

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

