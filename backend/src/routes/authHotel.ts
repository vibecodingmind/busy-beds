import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import * as hotelAccountModel from '../models/hotelAccount';
import * as hotelModel from '../models/hotel';
import { hotelAuthMiddleware, HotelJwtPayload } from '../middleware/auth';
import { config } from '../config';

const router = Router();

router.post(
  '/register',
  body('hotel_id').isInt(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { hotel_id, email, password, name } = req.body;

      const hotel = await hotelModel.findHotelById(hotel_id);
      if (!hotel) {
        return res.status(400).json({ error: 'Hotel not found' });
      }

      const existingAccount = await hotelAccountModel.findHotelAccountByEmail(email);
      if (existingAccount) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const hotelHasAccount = await hotelAccountModel.findHotelAccountByHotelId(hotel_id);
      if (hotelHasAccount) {
        return res.status(400).json({ error: 'This hotel already has an account' });
      }

      const hash = await bcrypt.hash(password, 10);
      const account = await hotelAccountModel.createHotelAccount(hotel_id, email, hash, name);

      const payload: HotelJwtPayload = {
        hotelAccountId: account.id,
        hotelId: account.hotel_id,
        email: account.email,
        type: 'hotel',
      };
      const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);

      res.status(201).json({
        hotelAccount: { id: account.id, hotelId: account.hotel_id, email: account.email, name: account.name },
        hotel: { id: hotel.id, name: hotel.name },
        token,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password } = req.body;

      const account = await hotelAccountModel.findHotelAccountByEmail(email);
      if (!account) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const match = await bcrypt.compare(password, account.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const hotel = await hotelModel.findHotelById(account.hotel_id);

      const payload: HotelJwtPayload = {
        hotelAccountId: account.id,
        hotelId: account.hotel_id,
        email: account.email,
        type: 'hotel',
      };
      const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);

      res.json({
        hotelAccount: { id: account.id, hotelId: account.hotel_id, email: account.email, name: account.name },
        hotel: hotel ? { id: hotel.id, name: hotel.name } : null,
        token,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Hotels without accounts (for registration dropdown)
router.get('/hotels-without-account', async (_req, res) => {
  try {
    const hotels = await hotelAccountModel.findHotelsWithoutAccount();
    res.json({ hotels });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

router.get('/me', hotelAuthMiddleware, async (req, res) => {
  if (!req.hotel) return res.status(401).json({ error: 'Not authenticated' });
  const account = await hotelAccountModel.findHotelAccountById(req.hotel.hotelAccountId);
  if (!account) return res.status(404).json({ error: 'Hotel account not found' });
  const hotel = await hotelModel.findHotelById(account.hotel_id);
  res.json({
    hotelAccount: { id: account.id, hotelId: account.hotel_id, email: account.email, name: account.name },
    hotel: hotel ? { id: hotel.id, name: hotel.name } : null,
  });
});

export default router;
