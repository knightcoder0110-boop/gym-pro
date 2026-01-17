import { Router } from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  generateInvoicePDF,
  saveInvoicePDF,
  updateInvoiceStatus,
  deleteInvoice,
} from '../controllers/invoice.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.get('/:id/pdf', generateInvoicePDF);
router.post('/:id/pdf/save', saveInvoicePDF);
router.patch('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);

export default router;
