import { Router } from 'express';
import { login, register, logout, me, refreshToken } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, me);

export default router;
