import { Router, Request, Response } from 'express';
import * as roomModel from '../models/room';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get all rooms for a hotel (public)
router.get('/hotels/:hotelId/rooms', asyncHandler(async (req: Request, res: Response) => {
  const hotelId = parseInt(req.params.hotelId, 10);
  if (isNaN(hotelId)) {
    return res.status(400).json({ error: 'Invalid hotel ID' });
  }

  const rooms = await roomModel.findRoomsByHotelId(hotelId);
  res.json({ rooms });
}));

export default router;
