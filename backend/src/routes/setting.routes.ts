import { Router } from 'express';
import { updateProfile, updateOrganization, changePassword } from '../controllers/setting.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

router.put('/profile', updateProfile);
router.put('/organization', updateOrganization);
router.put('/password', changePassword);

export default router;
