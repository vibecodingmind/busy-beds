import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import * as waitlistModel from '../models/waitlist';

const router = Router();

router.post(
  '/',
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email } = req.body;
      await waitlistModel.addToWaitlist(email);
      res.json({ success: true, message: "You're on the list! We'll notify you when new hotels join." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to join waitlist' });
    }
  }
);

export default router;
