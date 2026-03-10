import { Router } from 'express';
import * as promoModel from '../models/promo';

const router = Router();

router.get('/validate', async (req, res) => {
  try {
    const code = (req.query.code as string)?.trim();
    if (!code) return res.status(400).json({ error: 'Code required' });
    const promo = await promoModel.findPromoByCode(code);
    if (!promo) return res.json({ valid: false });
    res.json({
      valid: promo.valid,
      discount_type: promo.discount_type,
      discount_value: Number(promo.discount_value),
      message:
        promo.discount_type === 'percent'
          ? `${promo.discount_value}% off`
          : promo.discount_type === 'fixed'
            ? `$${promo.discount_value} off`
            : 'First month free',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to validate promo' });
  }
});

export default router;
