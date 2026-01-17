import { Router } from 'express';
import authRoutes from './auth.routes.js';
import memberRoutes from './member.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import planRoutes from './plan.routes.js';
import membershipRoutes from './membership.routes.js';
import paymentRoutes from './payment.routes.js';
import attendanceRoutes from './attendance.routes.js';
import classRoutes from './class.routes.js';
import trainerRoutes from './trainer.routes.js';
import leadRoutes from './lead.routes.js';
import settingRoutes from './setting.routes.js';
import reportRoutes from './report.routes.js';
import notificationRoutes from './notification.routes.js';
import uploadRoutes from './upload.routes.js';
import invoiceRoutes from './invoice.routes.js';

const router: ReturnType<typeof Router> = Router();

router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/plans', planRoutes);
router.use('/memberships', membershipRoutes);
router.use('/payments', paymentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/classes', classRoutes);
router.use('/trainers', trainerRoutes);
router.use('/leads', leadRoutes);
router.use('/settings', settingRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/uploads', uploadRoutes);
router.use('/invoices', invoiceRoutes);

export default router;


