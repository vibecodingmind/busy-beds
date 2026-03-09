import { Router } from 'express';
import * as hotelModel from '../models/hotel';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const hotels = await hotelModel.findAllHotels(limit, offset);
    res.json({ hotels });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const hotel = await hotelModel.findHotelById(parseInt(req.params.id));
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hotel' });
  }
});

export default router;
