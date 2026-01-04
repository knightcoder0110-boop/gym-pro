import { Router } from 'express';
import {
  getPayments,
  getPayment,
  createPayment,
  refundPayment,
  getPaymentStats,
  getMemberPayments,
} from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

router.get('/', getPayments);
router.get('/stats', getPaymentStats);
router.get('/:id', getPayment);
router.post('/', createPayment);
router.post('/:id/refund', refundPayment);
router.get('/member/:memberId', getMemberPayments);

export default router;
