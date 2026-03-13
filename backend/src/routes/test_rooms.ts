import { Router, Request, Response } from 'express';
import * as roomModel from '../models/room';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Test endpoint to check room counts
router.get('/test/rooms-count', asyncHandler(async (req: Request, res: Response) => {
  const count = await roomModel.countRooms();
  res.json({ roomCount: count });
}));

// Test endpoint to list first few rooms
router.get('/test/rooms-list', asyncHandler(async (req: Request, res: Response) => {
  const rooms = await roomModel.listRooms(10);
  res.json({ rooms });
}));

export default router;