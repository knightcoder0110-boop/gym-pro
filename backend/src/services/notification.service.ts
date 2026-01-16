import { prisma } from '../lib/prisma.js';
import { emailService } from './email.service.js';
import { NotificationType, NotificationStatus, NotificationChannel } from '@prisma/client';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Notification Service
 * Handles all notifications with proper logging and error handling
 */
export const notificationService = {
  /**
   * Send welcome email when a new member is created
   */
  async sendWelcomeEmail(params: {
    memberId: string;
    organizationId: string;
  }) {
    const member = await prisma.member.findUnique({
      where: { id: params.memberId },
      include: {
        organization: true,
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    const membership = member.memberships[0];
    if (!membership) {
      console.warn('No active membership found for welcome email');
    }

    // Create notification log entry
    const log = await prisma.notificationLog.create({
      data: {
        organizationId: params.organizationId,
        memberId: params.memberId,
        type: NotificationType.WELCOME,
        channel: NotificationChannel.EMAIL,
        recipient: member.email,
        subject: `Welcome to ${member.organization.name}!`,
        status: NotificationStatus.PENDING,
        metadata: {
          memberName: `${member.firstName} ${member.lastName}`,
          planName: membership?.plan.name || 'N/A',
        },
      },
    });

    try {
      await emailService.sendWelcomeEmail({
        to: member.email,
        memberName: `${member.firstName} ${member.lastName}`,
        gymName: member.organization.name,
        memberId: member.memberId,
        planName: membership?.plan.name || 'No plan assigned',
        startDate: membership ? format(membership.startDate, 'MMMM d, yyyy') : 'N/A',
        endDate: membership ? format(membership.endDate, 'MMMM d, yyyy') : 'N/A',
      });

      // Update log as sent
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });

      return { success: true, logId: log.id };
    } catch (error) {
      // Update log with error
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  },

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(params: {
    paymentId: string;
    organizationId: string;
  }) {
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: {
        member: {
          include: { organization: true },
        },
        membership: {
          include: { plan: true },
        },
      },
    });

    if (!payment || !payment.member) {
      throw new Error('Payment or member not found');
    }

    const member = payment.member;
    const org = member.organization;

    // Create notification log
    const log = await prisma.notificationLog.create({
      data: {
        organizationId: params.organizationId,
        memberId: member.id,
        type: NotificationType.PAYMENT_CONFIRMATION,
        channel: NotificationChannel.EMAIL,
        recipient: member.email,
        subject: `Payment Received - ${org.currency} ${payment.amount.toLocaleString()}`,
        status: NotificationStatus.PENDING,
        metadata: {
          paymentId: payment.id,
          amount: payment.amount,
        },
      },
    });

    try {
      await emailService.sendPaymentConfirmation({
        to: member.email,
        memberName: `${member.firstName} ${member.lastName}`,
        gymName: org.name,
        amount: payment.amount,
        currency: org.currency,
        paymentDate: format(payment.createdAt, 'MMMM d, yyyy'),
        paymentMethod: payment.method.replace('_', ' '),
        invoiceNumber: payment.invoiceId || undefined,
        description: payment.membership
          ? `${payment.membership.plan.name} Membership`
          : payment.type.replace('_', ' '),
      });

      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });

      return { success: true, logId: log.id };
    } catch (error) {
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  },

  /**
   * Send membership expiry reminders
   * Called by cron job for 7, 3, 1, and 0 days before expiry
   */
  async sendExpiryReminders(daysBeforeExpiry: number[]) {
    const results: { sent: number; failed: number; skipped: number } = {
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    for (const days of daysBeforeExpiry) {
      const targetDate = addDays(new Date(), days);

      // Find memberships expiring on target date
      const expiringMemberships = await prisma.membership.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: startOfDay(targetDate),
            lte: endOfDay(targetDate),
          },
        },
        include: {
          member: {
            include: { organization: true },
          },
          plan: true,
        },
      });

      for (const membership of expiringMemberships) {
        const member = membership.member;
        const org = member.organization;

        // Check if we already sent this reminder
        const existingNotification = await prisma.notificationLog.findFirst({
          where: {
            memberId: member.id,
            type: NotificationType.MEMBERSHIP_EXPIRY_REMINDER,
            createdAt: {
              gte: startOfDay(new Date()),
            },
            metadata: {
              path: ['daysLeft'],
              equals: days,
            },
          },
        });

        if (existingNotification) {
          results.skipped++;
          continue;
        }

        // Create log entry
        const log = await prisma.notificationLog.create({
          data: {
            organizationId: org.id,
            memberId: member.id,
            type: NotificationType.MEMBERSHIP_EXPIRY_REMINDER,
            channel: NotificationChannel.EMAIL,
            recipient: member.email,
            subject: `Your membership expires in ${days} day${days !== 1 ? 's' : ''}`,
            status: NotificationStatus.PENDING,
            metadata: {
              membershipId: membership.id,
              daysLeft: days,
            },
          },
        });

        try {
          await emailService.sendExpiryReminder({
            to: member.email,
            memberName: `${member.firstName} ${member.lastName}`,
            gymName: org.name,
            planName: membership.plan.name,
            expiryDate: format(membership.endDate, 'MMMM d, yyyy'),
            daysLeft: days,
          });

          await prisma.notificationLog.update({
            where: { id: log.id },
            data: {
              status: NotificationStatus.SENT,
              sentAt: new Date(),
            },
          });

          results.sent++;
        } catch (error) {
          await prisma.notificationLog.update({
            where: { id: log.id },
            data: {
              status: NotificationStatus.FAILED,
              error: error instanceof Error ? error.message : 'Unknown error',
              retryCount: { increment: 1 },
            },
          });

          results.failed++;
        }
      }
    }

    return results;
  },

  /**
   * Send class booking confirmation
   */
  async sendClassBookingConfirmation(params: {
    bookingId: string;
    organizationId: string;
  }) {
    const booking = await prisma.classBooking.findUnique({
      where: { id: params.bookingId },
      include: {
        member: {
          include: { organization: true },
        },
        schedule: {
          include: {
            class: true,
            instructor: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const member = booking.member;
    const org = member.organization;
    const classInfo = booking.schedule.class;
    const instructor = booking.schedule.instructor;

    const log = await prisma.notificationLog.create({
      data: {
        organizationId: params.organizationId,
        memberId: member.id,
        type: NotificationType.CLASS_BOOKING_CONFIRMATION,
        channel: NotificationChannel.EMAIL,
        recipient: member.email,
        subject: `Class Booked: ${classInfo.name}`,
        status: NotificationStatus.PENDING,
        metadata: {
          bookingId: booking.id,
          classId: classInfo.id,
        },
      },
    });

    try {
      await emailService.sendClassBookingConfirmation({
        to: member.email,
        memberName: `${member.firstName} ${member.lastName}`,
        gymName: org.name,
        className: classInfo.name,
        instructorName: `${instructor.firstName} ${instructor.lastName}`,
        classDate: format(booking.classDate, 'EEEE, MMMM d, yyyy'),
        classTime: `${booking.schedule.startTime} - ${booking.schedule.endTime}`,
        location: booking.schedule.location || 'Main Studio',
      });

      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });

      return { success: true, logId: log.id };
    } catch (error) {
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  },

  /**
   * Get notification logs for an organization
   */
  async getNotificationLogs(params: {
    organizationId: string;
    memberId?: string;
    type?: NotificationType;
    status?: NotificationStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;

    const where: any = {
      organizationId: params.organizationId,
    };

    if (params.memberId) where.memberId = params.memberId;
    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;

    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notificationLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};

export default notificationService;
