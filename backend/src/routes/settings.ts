import { Router } from 'express';
import { getPublicSettings } from '../services/settings';

const router = Router();

router.get('/public', async (_req, res) => {
  try {
    const settings = await getPublicSettings();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch public settings' });
  }
});

export default router;
