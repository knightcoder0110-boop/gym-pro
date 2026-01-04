import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
} from '../controllers/member.controller.js';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

router.get('/', getMembers);
router.get('/:id', getMember);
router.post('/', createMember);
router.patch('/:id', updateMember);
router.delete('/:id', deleteMember);

export default router;
