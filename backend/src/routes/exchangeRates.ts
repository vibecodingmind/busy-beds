import { Router } from 'express';
import * as exchangeRateModel from '../models/exchangeRate';

const router = Router();

router.get('/public', async (_req, res) => {
    try {
        const rates = await exchangeRateModel.findAllRates();
        res.json({ rates });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch exchange rates' });
    }
});

export default router;
