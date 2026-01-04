import { Router } from 'express';
import {
  getMemberships,
  getMembership,
  createMembership,
  renewMembership,
  freezeMembership,
  unfreezeMembership,
  cancelMembership,
  upgradeMembership,
} from '../controllers/membership.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

router.get('/', getMemberships);
router.get('/:id', getMembership);
router.post('/', createMembership);
router.post('/:id/renew', renewMembership);
router.post('/:id/freeze', freezeMembership);
router.post('/:id/unfreeze', unfreezeMembership);
router.post('/:id/cancel', cancelMembership);
router.post('/:id/upgrade', upgradeMembership);

export default router;
