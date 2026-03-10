import { Router } from 'express';
import * as hotelModel from '../models/hotel';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string | undefined;
    const sortVal = req.query.sort as string;
    const sort = ['name', 'location', 'rating', 'distance'].includes(sortVal) ? sortVal as 'name' | 'location' | 'rating' | 'distance' : undefined;
    const featured = req.query.featured === 'true' ? true : undefined;
    const minRating = req.query.min_rating != null ? parseFloat(req.query.min_rating as string) : undefined;
    const lat = req.query.lat != null ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng != null ? parseFloat(req.query.lng as string) : undefined;
    const hotels = await hotelModel.findAllHotels(limit, offset, {
      search,
      sort,
      featured,
      min_rating: minRating,
      lat,
      lng,
    });
    res.json({ hotels });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const hotel = await hotelModel.findHotelById(parseInt(req.params?.id ?? '0'));
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hotel' });
  }
});

export default router;
