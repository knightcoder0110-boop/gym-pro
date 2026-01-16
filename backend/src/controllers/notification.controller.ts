import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service.js';
import { prisma } from '../lib/prisma.js';
import cron from 'node-cron';

/**
 * Get notification logs
 * GET /notifications
 */
export const getNotificationLogs = async (req: Request, res: Response) => {
  try {
    const { memberId, type, status, page, limit } = req.query;
    const organizationId = (req as any).user.organizationId;

    const result = await notificationService.getNotificationLogs({
      organizationId,
      memberId: memberId as string,
      type: type as any,
      status: status as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.logs,
      meta: result.pagination,
    });
  } catch (error) {
    console.error('Get notification logs error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get notification logs' },
    });
  }
};

/**
 * Get notification stats
 * GET /notifications/stats
 */
export const getNotificationStats = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user.organizationId;

    const [total, sent, failed, byType] = await Promise.all([
      prisma.notificationLog.count({ where: { organizationId } }),
      prisma.notificationLog.count({ where: { organizationId, status: 'SENT' } }),
      prisma.notificationLog.count({ where: { organizationId, status: 'FAILED' } }),
      prisma.notificationLog.groupBy({
        by: ['type'],
        where: { organizationId },
        _count: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        sent,
        failed,
        successRate: total > 0 ? ((sent / total) * 100).toFixed(2) : 0,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get notification stats' },
    });
  }
};

/**
 * Send test email
 * POST /notifications/test
 */
export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const { email, template } = req.body;
    const organizationId = (req as any).user.organizationId;
    const user = (req as any).user;

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      return res.status(404).json({
        success: false,
        error: { message: 'Organization not found' },
      });
    }

    // Import email service directly for test emails
    const { emailService } = await import('../services/email.service.js');

    switch (template) {
      case 'welcome':
        await emailService.sendWelcomeEmail({
          to: email,
          memberName: 'Test User',
          gymName: org.name,
          memberId: 'TEST001',
          planName: 'Premium Membership',
          startDate: 'January 1, 2026',
          endDate: 'January 1, 2027',
        });
        break;
      case 'payment':
        await emailService.sendPaymentConfirmation({
          to: email,
          memberName: 'Test User',
          gymName: org.name,
          amount: 5000,
          currency: org.currency,
          paymentDate: 'January 16, 2026',
          paymentMethod: 'Card',
          description: 'Premium Membership - 6 Months',
        });
        break;
      case 'expiry':
        await emailService.sendExpiryReminder({
          to: email,
          memberName: 'Test User',
          gymName: org.name,
          planName: 'Premium Membership',
          expiryDate: 'January 23, 2026',
          daysLeft: 7,
        });
        break;
      case 'class':
        await emailService.sendClassBookingConfirmation({
          to: email,
          memberName: 'Test User',
          gymName: org.name,
          className: 'Morning Yoga',
          instructorName: 'John Trainer',
          classDate: 'Monday, January 20, 2026',
          classTime: '6:00 AM - 7:00 AM',
          location: 'Studio A',
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid template. Use: welcome, payment, expiry, class' },
        });
    }

    res.json({
      success: true,
      message: `Test ${template} email sent to ${email}`,
    });
  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to send test email' },
    });
  }
};

/**
 * Manually trigger expiry reminders
 * POST /notifications/send-expiry-reminders
 */
export const triggerExpiryReminders = async (req: Request, res: Response) => {
  try {
    // Default: send reminders for 7, 3, 1, and 0 days before expiry
    const daysArray = req.body.days || [7, 3, 1, 0];

    const results = await notificationService.sendExpiryReminders(daysArray);

    res.json({
      success: true,
      message: 'Expiry reminders processed',
      data: results,
    });
  } catch (error) {
    console.error('Trigger expiry reminders error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to trigger expiry reminders' },
    });
  }
};

/**
 * Resend a failed notification
 * POST /notifications/:id/resend
 */
export const resendNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    const log = await prisma.notificationLog.findFirst({
      where: { id, organizationId },
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        error: { message: 'Notification log not found' },
      });
    }

    // Re-trigger based on type
    let result;
    switch (log.type) {
      case 'WELCOME':
        result = await notificationService.sendWelcomeEmail({
          memberId: log.memberId!,
          organizationId,
        });
        break;
      case 'PAYMENT_CONFIRMATION':
        const metadata = log.metadata as any;
        result = await notificationService.sendPaymentConfirmation({
          paymentId: metadata?.paymentId,
          organizationId,
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: { message: 'Cannot resend this notification type' },
        });
    }

    res.json({
      success: true,
      message: 'Notification resent',
      data: result,
    });
  } catch (error) {
    console.error('Resend notification error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to resend notification' },
    });
  }
};

/**
 * Initialize cron jobs for automated notifications
 * Should be called once when the server starts
 */
export const initNotificationCrons = () => {
  // Run expiry reminders every day at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Running expiry reminder job...');
    try {
      const results = await notificationService.sendExpiryReminders([7, 3, 1, 0]);
      console.log('[CRON] Expiry reminder results:', results);
    } catch (error) {
      console.error('[CRON] Expiry reminder error:', error);
    }
  });

  console.log('[CRON] Notification cron jobs initialized');
};
