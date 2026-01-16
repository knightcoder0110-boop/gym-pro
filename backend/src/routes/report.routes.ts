import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  getRevenueOverview,
  getRevenueByPlan,
  getMemberAnalytics,
  getMemberRetention,
  getAttendanceAnalytics,
  getClassAnalytics,
  getTrainerAnalytics,
  getLeadsAnalytics,
  exportReport,
} from '../controllers/report.controller.js';

const router: ReturnType<typeof Router> = Router();

// All routes require authentication
router.use(authenticate);

// Revenue Analytics
router.get('/revenue', getRevenueOverview);
router.get('/revenue/by-plan', getRevenueByPlan);

// Member Analytics
router.get('/members', getMemberAnalytics);
router.get('/members/retention', getMemberRetention);

// Attendance Analytics
router.get('/attendance', getAttendanceAnalytics);

// Class Analytics
router.get('/classes', getClassAnalytics);

// Trainer Analytics
router.get('/trainers', getTrainerAnalytics);

// Leads Analytics
router.get('/leads', getLeadsAnalytics);

// Export
router.get('/export', exportReport);

export default router;
