import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getStats, getRecentActivity } from '../controllers/dashboard.controller.js';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/recent-activity', getRecentActivity);

export default router;
