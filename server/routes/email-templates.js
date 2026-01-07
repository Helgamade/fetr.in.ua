import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all email templates
router.get('/', async (req, res, next) => {
  try {
    const [templates] = await pool.execute(`
      SELECT * FROM email_templates ORDER BY event_type
    `);
    
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// Get template by event type
router.get('/:eventType', async (req, res, next) => {
  try {
    const { eventType } = req.params;
    const [templates] = await pool.execute(`
      SELECT * FROM email_templates WHERE event_type = ?
    `, [eventType]);
    
    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(templates[0]);
  } catch (error) {
    next(error);
  }
});

// Update template
router.put('/:eventType', async (req, res, next) => {
  try {
    const { eventType } = req.params;
    const { subject, body_html, body_text, is_active, description } = req.body;
    
    if (!subject || !body_html) {
      return res.status(400).json({ error: 'Subject та body_html обов\'язкові' });
    }
    
    await pool.execute(`
      UPDATE email_templates 
      SET subject = ?, body_html = ?, body_text = ?, 
          is_active = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE event_type = ?
    `, [
      subject,
      body_html,
      body_text || null,
      is_active !== undefined ? is_active : true,
      description || null,
      eventType
    ]);
    
    const [updated] = await pool.execute(`
      SELECT * FROM email_templates WHERE event_type = ?
    `, [eventType]);
    
    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
});

// Test email template (send test email)
router.post('/:eventType/test', async (req, res, next) => {
  try {
    const { eventType } = req.params;
    const { testEmail, testData } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'Test email обов\'язковий' });
    }
    
    const { sendEmail } = await import('../utils/emailService.js');
    const result = await sendEmail(eventType, testEmail, testData || {});
    
    if (result.success) {
      res.json({ message: 'Test email відправлено', messageId: result.messageId });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

