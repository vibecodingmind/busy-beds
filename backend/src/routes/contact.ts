import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { contactFormLimiter } from '../middleware/rateLimiter';
import { getSetting } from '../services/settings';
import { sendContactFormEmail } from '../services/email';

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
      const to = await getSetting('support_email');
      if (!to) {
        return res.status(503).json({ error: 'Contact form is not configured. Please set support email in admin.' });
      }
      const { name, email, message } = req.body;
      const sent = await sendContactFormEmail(to, name, email, message);
      if (!sent) {
        return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
      }
      res.json({ success: true, message: 'Message sent successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

export default router;
