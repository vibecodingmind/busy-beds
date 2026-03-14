import { Router } from 'express';
import * as hotelModel from '../models/hotel';

const router = Router();

// GET /hotels/locations — unique countries, regions, cities for filter dropdowns
router.get('/locations', async (_req, res) => {
  try {
    const data = await hotelModel.getHotelLocations();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

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
    const north = req.query.north != null ? parseFloat(req.query.north as string) : undefined;
    const south = req.query.south != null ? parseFloat(req.query.south as string) : undefined;
    const east = req.query.east != null ? parseFloat(req.query.east as string) : undefined;
    const west = req.query.west != null ? parseFloat(req.query.west as string) : undefined;
    const minPrice = req.query.min_price != null ? parseFloat(req.query.min_price as string) : undefined;
    const maxPrice = req.query.max_price != null ? parseFloat(req.query.max_price as string) : undefined;
    const amenities = req.query.amenities ? (req.query.amenities as string).split(',') : undefined;
    const hasDiscount = req.query.has_discount === 'true' ? true : undefined;
    const country = req.query.country as string | undefined;
    const region = req.query.region as string | undefined;
    const city = req.query.city as string | undefined;
    const hotels = await hotelModel.findAllHotels(limit, offset, {
      search,
      sort,
      featured,
      min_rating: minRating,
      lat,
      lng,
      north,
      south,
      east,
      west,
      min_price: minPrice,
      max_price: maxPrice,
      amenities,
      has_discount: hasDiscount,
      country,
      region,
      city,
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
