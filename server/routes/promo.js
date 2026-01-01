import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Validate promo code and get discount percentage
router.post('/validate', async (req, res, next) => {
  try {
    const { code, items } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Promo code is required' });
    }

    // Get promo codes from settings (stored as JSON)
    // Format: { "skidka1": { "discount": 1.5, "products": ["product_code1", "product_code2"] } }
    const [settings] = await pool.execute(
      `SELECT value FROM settings WHERE key_name = 'promo_codes'`
    );

    let promoCodes = {};
    if (settings.length > 0) {
      try {
        promoCodes = JSON.parse(settings[0].value);
      } catch (e) {
        console.error('[Promo] Error parsing promo_codes setting:', e);
      }
    }

    const normalizedCode = code.toLowerCase().trim();
    const promo = promoCodes[normalizedCode];

    if (!promo) {
      return res.status(404).json({ error: 'Промокод не знайдено' });
    }

    // Check if promo code is valid for the items in cart
    if (items && items.length > 0 && promo.products && promo.products.length > 0) {
      const cartProductCodes = items.map(item => item.productId);
      const hasValidProduct = cartProductCodes.some(code => promo.products.includes(code));
      
      if (!hasValidProduct) {
        return res.status(400).json({ error: 'Цей промокод не діє для цього товару' });
      }
    }

    // Return discount percentage
    res.json({
      code: normalizedCode,
      discount: promo.discount || 0,
      message: `Промокод "${normalizedCode}" застосовано, знижка: ${promo.discount || 0}%`
    });
  } catch (error) {
    console.error('[Promo] Error validating promo code:', error);
    next(error);
  }
});

export default router;

