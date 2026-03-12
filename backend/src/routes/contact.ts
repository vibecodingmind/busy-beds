import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { contactFormLimiter } from '../middleware/rateLimiter';
import { getSetting } from '../services/settings';
import { sendContactFormEmail } from '../services/email';
import { pool } from '../config/db';

const router = Router();
router.use(contactFormLimiter);

router.post(
  '/',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const msg = errors.array().map((e) => (e as { msg?: string }).msg || 'Invalid').join(' ');
        return res.status(400).json({ error: msg });
      }
      const { name, email, message } = req.body;
      const insert = await pool.query(
        `INSERT INTO contact_submissions (name, email, message) VALUES ($1, $2, $3) RETURNING id, created_at`,
        [name, email, message]
      );
      const to = await getSetting('support_email');
      if (to) {
        await sendContactFormEmail(to, name, email, message);
      }
      res.json({ success: true, message: 'Message sent successfully.', id: insert.rows[0]?.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

export default router;
