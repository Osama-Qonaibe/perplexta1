import express from 'express';
import { getCachedActivePlans, DEFAULT_FALLBACK_PLANS } from '../db/queries.js';

const router = express.Router();

router.get("/", async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  try {
    const plans = await getCachedActivePlans();
    res.json(plans && plans.length > 0 ? plans : DEFAULT_FALLBACK_PLANS);
  } catch (error) {
    res.json(DEFAULT_FALLBACK_PLANS);
  }
});

export default router;
