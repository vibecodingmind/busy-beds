import { Router } from 'express';
import { getPageContent, getContactDetails } from '../services/settings';

const router = Router();

const VALID_SLUGS = ['privacy', 'terms', 'about', 'contact'];

router.get('/:slug', async (req, res) => {
  const slug = (req.params.slug || '').toLowerCase();
  if (!VALID_SLUGS.includes(slug)) {
    return res.status(404).json({ error: 'Page not found' });
  }
  try {
    if (slug === 'contact') {
      const details = await getContactDetails();
      return res.json(details);
    }
    const content = await getPageContent(slug);
    res.json({ content: content ?? '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

export default router;
