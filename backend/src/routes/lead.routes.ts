import { Router } from 'express';
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  addActivity,
  convertToMember,
  getLeadStats,
  getLeadsBySource,
} from '../controllers/lead.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

router.get('/', getLeads);
router.get('/stats', getLeadStats);
router.get('/by-source', getLeadsBySource);
router.get('/:id', getLead);
router.post('/', createLead);
router.patch('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/activity', addActivity);
router.post('/:id/convert', convertToMember);

export default router;
