import { Router } from 'express';
import {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  getPublicPlans,
} from '../controllers/plan.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

// Protected routes (require authentication)
router.get('/', authenticate, getPlans);
router.get('/:id', authenticate, getPlan);
router.post('/', authenticate, createPlan);
router.patch('/:id', authenticate, updatePlan);
router.delete('/:id', authenticate, deletePlan);

// Public routes (no auth required)
router.get('/public/:organizationSlug', getPublicPlans);

export default router;
