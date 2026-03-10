import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import type { JwtPayload } from '../middleware/auth';
import * as favoriteModel from '../models/favorite';
import * as hotelModel from '../models/hotel';

const router = Router();

router.post('/:hotelId', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as JwtPayload).userId;
    const hotelId = parseInt(req.params.hotelId || '0');
    if (!hotelId) return res.status(400).json({ error: 'Invalid hotel' });
    await favoriteModel.addFavorite(userId, hotelId);
    res.json({ favorited: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

router.delete('/:hotelId', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as JwtPayload).userId;
    const hotelId = parseInt(req.params.hotelId || '0');
    if (!hotelId) return res.status(400).json({ error: 'Invalid hotel' });
    await favoriteModel.removeFavorite(userId, hotelId);
    res.json({ favorited: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

router.get('/check/:hotelId', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as JwtPayload).userId;
    const hotelId = parseInt(req.params.hotelId || '0');
    const favorited = await favoriteModel.isFavorite(userId, hotelId);
    res.json({ favorited });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check favorite' });
  }
});

router.get('/ids', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as JwtPayload).userId;
    const ids = await favoriteModel.getFavoriteHotelIds(userId);
    res.json({ hotelIds: ids });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

router.get('/hotels', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as JwtPayload).userId;
    const ids = await favoriteModel.getFavoriteHotelIds(userId);
    if (ids.length === 0) return res.json({ hotels: [] });
    const hotels = await hotelModel.findHotelsByIds(ids);
    res.json({ hotels });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

export default router;
