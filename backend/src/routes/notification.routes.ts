import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  getNotificationLogs,
  getNotificationStats,
  sendTestEmail,
  triggerExpiryReminders,
  resendNotification,
} from '../controllers/notification.controller.js';

const router: ReturnType<typeof Router> = Router();

// All routes require authentication
router.use(authenticate);

// GET /notifications - List notification logs
router.get('/', getNotificationLogs);

// GET /notifications/stats - Get notification statistics
router.get('/stats', getNotificationStats);

// POST /notifications/test - Send test email
router.post('/test', sendTestEmail);

// POST /notifications/send-expiry-reminders - Manually trigger expiry reminders
router.post('/send-expiry-reminders', triggerExpiryReminders);

// POST /notifications/:id/resend - Resend a failed notification
router.post('/:id/resend', resendNotification);

export default router;
