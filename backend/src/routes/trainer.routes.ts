import { Router } from 'express';
import {
  getTrainers,
  getTrainer,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  getTrainerSchedule,
  getTrainerStats,
} from '../controllers/trainer.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

router.get('/', getTrainers);
router.get('/stats', getTrainerStats);
router.get('/:id', getTrainer);
router.get('/:id/schedule', getTrainerSchedule);
router.post('/', createTrainer);
router.patch('/:id', updateTrainer);
router.delete('/:id', deleteTrainer);

export default router;
