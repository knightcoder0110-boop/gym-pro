import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  differenceInDays,
} from 'date-fns';

// ============================================
// REVENUE ANALYTICS
// ============================================

export const getRevenueOverview = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;
  const orgId = req.user!.organizationId;

  const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
  const end = endDate ? new Date(endDate as string) : endOfDay(new Date());

  // Get current period revenue
  const currentPeriodPayments = await prisma.payment.findMany({
    where: {
      member: { organizationId: orgId },
      createdAt: { gte: start, lte: end },
      status: { in: ['SUCCESS', 'COMPLETED'] },
    },
    select: {
      amount: true,
      type: true,
      method: true,
      createdAt: true,
      refundedAmount: true,
    },
  });

  // Calculate previous period for comparison
  const periodDays = differenceInDays(end, start) || 1;
  const previousStart = subDays(start, periodDays);
  const previousEnd = subDays(end, periodDays);

  const previousPeriodPayments = await prisma.payment.findMany({
    where: {
      member: { organizationId: orgId },
      createdAt: { gte: previousStart, lte: previousEnd },
      status: { in: ['SUCCESS', 'COMPLETED'] },
    },
    select: { amount: true, refundedAmount: true },
  });

  // Calculate totals
  const currentRevenue = currentPeriodPayments.reduce((sum, p) => sum + p.amount - (p.refundedAmount || 0), 0);
  const previousRevenue = previousPeriodPayments.reduce((sum, p) => sum + p.amount - (p.refundedAmount || 0), 0);
  const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  // Group by time interval
  let intervals: Date[];
  let formatStr: string;

  if (groupBy === 'week') {
    intervals = eachWeekOfInterval({ start, end });
    formatStr = "'Week' w";
  } else if (groupBy === 'month') {
    intervals = eachMonthOfInterval({ start, end });
    formatStr = 'MMM yyyy';
  } else {
    intervals = eachDayOfInterval({ start, end });
    formatStr = 'MMM dd';
  }

  // Build trend data
  const trendData = intervals.map((intervalStart) => {
    let intervalEnd: Date;
    if (groupBy === 'week') {
      intervalEnd = endOfWeek(intervalStart);
    } else if (groupBy === 'month') {
      intervalEnd = endOfMonth(intervalStart);
    } else {
      intervalEnd = endOfDay(intervalStart);
    }

    const intervalPayments = currentPeriodPayments.filter(
      (p) => p.createdAt >= intervalStart && p.createdAt <= intervalEnd
    );

    const revenue = intervalPayments.reduce((sum, p) => sum + p.amount - (p.refundedAmount || 0), 0);
    const transactions = intervalPayments.length;

    return {
      date: format(intervalStart, formatStr),
      fullDate: intervalStart.toISOString(),
      revenue,
      transactions,
    };
  });

  // Revenue by payment type
  const byType = currentPeriodPayments.reduce((acc, p) => {
    if (!acc[p.type]) {
      acc[p.type] = { revenue: 0, count: 0 };
    }
    acc[p.type].revenue += p.amount - (p.refundedAmount || 0);
    acc[p.type].count += 1;
    return acc;
  }, {} as Record<string, { revenue: number; count: number }>);

  // Revenue by payment method
  const byMethod = currentPeriodPayments.reduce((acc, p) => {
    if (!acc[p.method]) {
      acc[p.method] = { revenue: 0, count: 0 };
    }
    acc[p.method].revenue += p.amount - (p.refundedAmount || 0);
    acc[p.method].count += 1;
    return acc;
  }, {} as Record<string, { revenue: number; count: number }>);

  res.json({
    success: true,
    data: {
      summary: {
        totalRevenue: currentRevenue,
        previousRevenue,
        revenueChange: parseFloat(revenueChange.toFixed(2)),
        totalTransactions: currentPeriodPayments.length,
        averageTransaction: currentPeriodPayments.length > 0 
          ? parseFloat((currentRevenue / currentPeriodPayments.length).toFixed(2)) 
          : 0,
      },
      trend: trendData,
      byType: Object.entries(byType).map(([type, data]) => ({
        type,
        ...data,
        percentage: parseFloat(((data.revenue / currentRevenue) * 100).toFixed(2)),
      })),
      byMethod: Object.entries(byMethod).map(([method, data]) => ({
        method,
        ...data,
        percentage: parseFloat(((data.revenue / currentRevenue) * 100).toFixed(2)),
      })),
      period: { start, end, days: periodDays },
    },
  });
});

export const getRevenueByPlan = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const orgId = req.user!.organizationId;

  const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
  const end = endDate ? new Date(endDate as string) : endOfDay(new Date());

  const payments = await prisma.payment.findMany({
    where: {
      member: { organizationId: orgId },
      createdAt: { gte: start, lte: end },
      status: { in: ['SUCCESS', 'COMPLETED'] },
      type: { in: ['MEMBERSHIP', 'RENEWAL'] },
      membership: { isNot: null },
    },
    include: {
      membership: {
        include: {
          plan: { select: { id: true, name: true, color: true } },
        },
      },
    },
  });

  const byPlan = payments.reduce((acc, p) => {
    const planName = p.membership?.plan?.name || 'Unknown';
    const planId = p.membership?.plan?.id || 'unknown';
    const color = p.membership?.plan?.color || '#6B7280';
    
    if (!acc[planId]) {
      acc[planId] = { name: planName, color, revenue: 0, count: 0 };
    }
    acc[planId].revenue += p.amount - (p.refundedAmount || 0);
    acc[planId].count += 1;
    return acc;
  }, {} as Record<string, { name: string; color: string; revenue: number; count: number }>);

  const totalRevenue = Object.values(byPlan).reduce((sum, p) => sum + p.revenue, 0);

  res.json({
    success: true,
    data: Object.entries(byPlan)
      .map(([id, data]) => ({
        planId: id,
        ...data,
        percentage: totalRevenue > 0 ? parseFloat(((data.revenue / totalRevenue) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue),
  });
});

// ============================================
// MEMBER ANALYTICS
// ============================================

export const getMemberAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;
  const orgId = req.user!.organizationId;

  const start = startDate ? new Date(startDate as string) : subMonths(new Date(), 3);
  const end = endDate ? new Date(endDate as string) : endOfDay(new Date());

  // Get all members
  const allMembers = await prisma.member.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      status: true,
      joinDate: true,
      createdAt: true,
      gender: true,
      source: true,
      memberships: {
        select: { status: true, endDate: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // Current status distribution
  const statusDistribution = {
    ACTIVE: allMembers.filter((m) => m.status === 'ACTIVE').length,
    INACTIVE: allMembers.filter((m) => m.status === 'INACTIVE').length,
    FROZEN: allMembers.filter((m) => m.status === 'FROZEN').length,
    EXPIRED: allMembers.filter((m) => m.status === 'EXPIRED').length,
    BLOCKED: allMembers.filter((m) => m.status === 'BLOCKED').length,
  };

  // Gender distribution
  const genderDistribution = {
    MALE: allMembers.filter((m) => m.gender === 'MALE').length,
    FEMALE: allMembers.filter((m) => m.gender === 'FEMALE').length,
    OTHER: allMembers.filter((m) => m.gender === 'OTHER').length,
    UNKNOWN: allMembers.filter((m) => !m.gender).length,
  };

  // Source distribution
  const sourceDistribution = allMembers.reduce((acc, m) => {
    const source = m.source || 'UNKNOWN';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // New members in period
  const newMembersInPeriod = allMembers.filter(
    (m) => m.joinDate >= start && m.joinDate <= end
  );

  // Growth trend
  let intervals: Date[];
  let formatStr: string;

  if (groupBy === 'week') {
    intervals = eachWeekOfInterval({ start, end });
    formatStr = "'Week' w";
  } else if (groupBy === 'month') {
    intervals = eachMonthOfInterval({ start, end });
    formatStr = 'MMM yyyy';
  } else {
    intervals = eachDayOfInterval({ start, end });
    formatStr = 'MMM dd';
  }

  const growthTrend = intervals.map((intervalStart) => {
    let intervalEnd: Date;
    if (groupBy === 'week') {
      intervalEnd = endOfWeek(intervalStart);
    } else if (groupBy === 'month') {
      intervalEnd = endOfMonth(intervalStart);
    } else {
      intervalEnd = endOfDay(intervalStart);
    }

    const newMembers = newMembersInPeriod.filter(
      (m) => m.joinDate >= intervalStart && m.joinDate <= intervalEnd
    ).length;

    // Calculate total members up to this point
    const totalAtPoint = allMembers.filter((m) => m.joinDate <= intervalEnd).length;

    return {
      date: format(intervalStart, formatStr),
      fullDate: intervalStart.toISOString(),
      newMembers,
      totalMembers: totalAtPoint,
    };
  });

  // Expiring memberships (next 30 days)
  const now = new Date();
  const thirtyDaysFromNow = subDays(now, -30);
  const expiringMemberships = await prisma.membership.findMany({
    where: {
      member: { organizationId: orgId },
      status: 'ACTIVE',
      endDate: { gte: now, lte: thirtyDaysFromNow },
    },
    include: {
      member: { select: { firstName: true, lastName: true, email: true, phone: true } },
      plan: { select: { name: true } },
    },
    orderBy: { endDate: 'asc' },
    take: 20,
  });

  // Calculate retention rate (active / total * 100)
  const retentionRate = allMembers.length > 0 
    ? parseFloat(((statusDistribution.ACTIVE / allMembers.length) * 100).toFixed(2))
    : 0;

  // Calculate churn (expired + inactive in last 30 days)
  const recentlyChurned = allMembers.filter(
    (m) => (m.status === 'EXPIRED' || m.status === 'INACTIVE') && 
           m.memberships[0]?.endDate && 
           m.memberships[0].endDate >= subDays(now, 30)
  ).length;

  res.json({
    success: true,
    data: {
      summary: {
        totalMembers: allMembers.length,
        activeMembers: statusDistribution.ACTIVE,
        newMembersInPeriod: newMembersInPeriod.length,
        retentionRate,
        churnedLast30Days: recentlyChurned,
      },
      statusDistribution,
      genderDistribution,
      sourceDistribution: Object.entries(sourceDistribution)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count),
      growthTrend,
      expiringMemberships: expiringMemberships.map((m) => ({
        id: m.id,
        memberName: `${m.member.firstName} ${m.member.lastName}`,
        email: m.member.email,
        phone: m.member.phone,
        planName: m.plan.name,
        endDate: m.endDate,
        daysRemaining: differenceInDays(m.endDate, now),
      })),
    },
  });
});

export const getMemberRetention = asyncHandler(async (req: Request, res: Response) => {
  const { months = 6 } = req.query;
  const orgId = req.user!.organizationId;
  const numMonths = parseInt(months as string, 10);

  const retentionData = [];
  const now = new Date();

  for (let i = numMonths - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));

    // Members who joined before or during this month
    const totalMembersAtMonth = await prisma.member.count({
      where: {
        organizationId: orgId,
        joinDate: { lte: monthEnd },
      },
    });

    // Active members at end of month
    const activeMembersAtMonth = await prisma.member.count({
      where: {
        organizationId: orgId,
        joinDate: { lte: monthEnd },
        OR: [
          { status: 'ACTIVE' },
          {
            memberships: {
              some: {
                status: 'ACTIVE',
                endDate: { gte: monthEnd },
              },
            },
          },
        ],
      },
    });

    // New members that month
    const newMembers = await prisma.member.count({
      where: {
        organizationId: orgId,
        joinDate: { gte: monthStart, lte: monthEnd },
      },
    });

    // Churned members (memberships that ended that month)
    const churned = await prisma.membership.count({
      where: {
        member: { organizationId: orgId },
        endDate: { gte: monthStart, lte: monthEnd },
        status: { in: ['EXPIRED', 'CANCELLED'] },
      },
    });

    retentionData.push({
      month: format(monthStart, 'MMM yyyy'),
      totalMembers: totalMembersAtMonth,
      activeMembers: activeMembersAtMonth,
      newMembers,
      churned,
      retentionRate: totalMembersAtMonth > 0 
        ? parseFloat(((activeMembersAtMonth / totalMembersAtMonth) * 100).toFixed(2))
        : 0,
    });
  }

  res.json({
    success: true,
    data: retentionData,
  });
});

// ============================================
// ATTENDANCE ANALYTICS
// ============================================

export const getAttendanceAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;
  const orgId = req.user!.organizationId;

  const start = startDate ? new Date(startDate as string) : subDays(new Date(), 30);
  const end = endDate ? new Date(endDate as string) : endOfDay(new Date());

  const attendance = await prisma.attendance.findMany({
    where: {
      member: { organizationId: orgId },
      checkInTime: { gte: start, lte: end },
    },
    select: {
      id: true,
      checkInTime: true,
      checkOutTime: true,
      duration: true,
      checkInMethod: true,
    },
  });

  // Summary stats
  const totalCheckIns = attendance.length;
  const uniqueDays = new Set(attendance.map((a) => format(a.checkInTime, 'yyyy-MM-dd'))).size;
  const avgDailyCheckIns = uniqueDays > 0 ? parseFloat((totalCheckIns / uniqueDays).toFixed(2)) : 0;
  
  const completedSessions = attendance.filter((a) => a.duration && a.duration > 0);
  const avgDuration = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, a) => sum + (a.duration || 0), 0) / completedSessions.length)
    : 0;

  // Check-in method distribution
  const byMethod = attendance.reduce((acc, a) => {
    acc[a.checkInMethod] = (acc[a.checkInMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Trend data
  let intervals: Date[];
  let formatStr: string;

  if (groupBy === 'week') {
    intervals = eachWeekOfInterval({ start, end });
    formatStr = "'Week' w";
  } else if (groupBy === 'month') {
    intervals = eachMonthOfInterval({ start, end });
    formatStr = 'MMM yyyy';
  } else {
    intervals = eachDayOfInterval({ start, end });
    formatStr = 'EEE, MMM dd';
  }

  const trendData = intervals.map((intervalStart) => {
    let intervalEnd: Date;
    if (groupBy === 'week') {
      intervalEnd = endOfWeek(intervalStart);
    } else if (groupBy === 'month') {
      intervalEnd = endOfMonth(intervalStart);
    } else {
      intervalEnd = endOfDay(intervalStart);
    }

    const intervalAttendance = attendance.filter(
      (a) => a.checkInTime >= intervalStart && a.checkInTime <= intervalEnd
    );

    return {
      date: format(intervalStart, formatStr),
      fullDate: intervalStart.toISOString(),
      checkIns: intervalAttendance.length,
      avgDuration: intervalAttendance.length > 0
        ? Math.round(
            intervalAttendance
              .filter((a) => a.duration)
              .reduce((sum, a) => sum + (a.duration || 0), 0) /
              intervalAttendance.filter((a) => a.duration).length || 0
          )
        : 0,
    };
  });

  // Peak hours analysis
  const hourlyDistribution = attendance.reduce((acc, a) => {
    const hour = a.checkInTime.getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const peakHours = Object.entries(hourlyDistribution)
    .map(([hour, count]) => ({ hour: parseInt(hour, 10), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Day of week distribution
  const dayOfWeekDistribution = attendance.reduce((acc, a) => {
    const day = format(a.checkInTime, 'EEEE');
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    success: true,
    data: {
      summary: {
        totalCheckIns,
        uniqueDays,
        avgDailyCheckIns,
        avgSessionDuration: avgDuration,
      },
      trend: trendData,
      byMethod: Object.entries(byMethod).map(([method, count]) => ({
        method,
        count,
        percentage: parseFloat(((count / totalCheckIns) * 100).toFixed(2)),
      })),
      peakHours: peakHours.map((h) => ({
        hour: `${h.hour.toString().padStart(2, '0')}:00`,
        checkIns: h.count,
      })),
      dayOfWeekDistribution: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
        (day) => ({
          day,
          checkIns: dayOfWeekDistribution[day] || 0,
        })
      ),
    },
  });
});

// ============================================
// CLASS ANALYTICS
// ============================================

export const getClassAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const orgId = req.user!.organizationId;

  const start = startDate ? new Date(startDate as string) : subDays(new Date(), 30);
  const end = endDate ? new Date(endDate as string) : endOfDay(new Date());

  // Get all classes
  const classes = await prisma.class.findMany({
    where: { organizationId: orgId },
    include: {
      schedules: {
        include: {
          bookings: {
            where: { classDate: { gte: start, lte: end } },
          },
          instructor: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  // Calculate class performance
  const classPerformance = classes.map((cls) => {
    const totalBookings = cls.schedules.reduce((sum, s) => sum + s.bookings.length, 0);
    const attendedBookings = cls.schedules.reduce(
      (sum, s) => sum + s.bookings.filter((b) => b.attended === true).length,
      0
    );
    const cancelledBookings = cls.schedules.reduce(
      (sum, s) => sum + s.bookings.filter((b) => b.status === 'CANCELLED').length,
      0
    );
    const totalSchedules = cls.schedules.filter((s) => s.isActive).length;
    const avgOccupancy = totalSchedules > 0 && cls.maxCapacity > 0
      ? parseFloat(((totalBookings / (totalSchedules * cls.maxCapacity)) * 100).toFixed(2))
      : 0;

    return {
      id: cls.id,
      name: cls.name,
      category: cls.category,
      color: cls.color,
      totalBookings,
      attendedBookings,
      cancelledBookings,
      attendanceRate: totalBookings > 0 
        ? parseFloat(((attendedBookings / totalBookings) * 100).toFixed(2))
        : 0,
      avgOccupancy,
      schedulesPerWeek: totalSchedules,
    };
  });

  // Category distribution
  const byCategory = classes.reduce((acc, cls) => {
    const bookings = cls.schedules.reduce((sum, s) => sum + s.bookings.length, 0);
    if (!acc[cls.category]) {
      acc[cls.category] = { count: 0, bookings: 0 };
    }
    acc[cls.category].count += 1;
    acc[cls.category].bookings += bookings;
    return acc;
  }, {} as Record<string, { count: number; bookings: number }>);

  // Top classes by bookings
  const topClasses = [...classPerformance]
    .sort((a, b) => b.totalBookings - a.totalBookings)
    .slice(0, 10);

  // Most popular times
  const schedules = await prisma.classSchedule.findMany({
    where: { class: { organizationId: orgId }, isActive: true },
    include: {
      bookings: { where: { classDate: { gte: start, lte: end } } },
    },
  });

  const timeSlotPopularity = schedules.reduce((acc, s) => {
    const slot = s.startTime;
    if (!acc[slot]) {
      acc[slot] = 0;
    }
    acc[slot] += s.bookings.length;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    success: true,
    data: {
      summary: {
        totalClasses: classes.length,
        totalBookings: classPerformance.reduce((sum, c) => sum + c.totalBookings, 0),
        avgAttendanceRate: classPerformance.length > 0
          ? parseFloat(
              (classPerformance.reduce((sum, c) => sum + c.attendanceRate, 0) / classPerformance.length).toFixed(2)
            )
          : 0,
        avgOccupancy: classPerformance.length > 0
          ? parseFloat(
              (classPerformance.reduce((sum, c) => sum + c.avgOccupancy, 0) / classPerformance.length).toFixed(2)
            )
          : 0,
      },
      classPerformance,
      topClasses,
      byCategory: Object.entries(byCategory)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.bookings - a.bookings),
      popularTimeSlots: Object.entries(timeSlotPopularity)
        .map(([time, bookings]) => ({ time, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5),
    },
  });
});

// ============================================
// TRAINER ANALYTICS
// ============================================

export const getTrainerAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const orgId = req.user!.organizationId;

  const start = startDate ? new Date(startDate as string) : subDays(new Date(), 30);
  const end = endDate ? new Date(endDate as string) : endOfDay(new Date());

  const trainers = await prisma.user.findMany({
    where: { organizationId: orgId, isTrainer: true, isActive: true },
    include: {
      classesInstructed: {
        include: {
          bookings: {
            where: { classDate: { gte: start, lte: end } },
          },
          class: { select: { name: true, category: true } },
        },
      },
      ptSessions: {
        where: { scheduledDate: { gte: start, lte: end } },
      },
      assignedMembers: {
        select: { id: true, status: true },
      },
    },
  });

  const trainerPerformance = trainers.map((trainer) => {
    const totalClasses = trainer.classesInstructed.length;
    const totalClassBookings = trainer.classesInstructed.reduce(
      (sum, s) => sum + s.bookings.length,
      0
    );
    const totalPTSessions = trainer.ptSessions.length;
    const completedPTSessions = trainer.ptSessions.filter(
      (s) => s.status === 'COMPLETED'
    ).length;
    const activeAssignedMembers = trainer.assignedMembers.filter(
      (m) => m.status === 'ACTIVE'
    ).length;

    return {
      id: trainer.id,
      name: `${trainer.firstName} ${trainer.lastName}`,
      avatar: trainer.avatar,
      specializations: trainer.specializations,
      totalClasses,
      totalClassBookings,
      avgBookingsPerClass: totalClasses > 0 
        ? parseFloat((totalClassBookings / totalClasses).toFixed(2))
        : 0,
      totalPTSessions,
      completedPTSessions,
      ptCompletionRate: totalPTSessions > 0
        ? parseFloat(((completedPTSessions / totalPTSessions) * 100).toFixed(2))
        : 0,
      activeAssignedMembers,
    };
  });

  // Top trainers by engagement
  const topByClassBookings = [...trainerPerformance]
    .sort((a, b) => b.totalClassBookings - a.totalClassBookings)
    .slice(0, 5);

  const topByPTSessions = [...trainerPerformance]
    .sort((a, b) => b.completedPTSessions - a.completedPTSessions)
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      summary: {
        totalTrainers: trainers.length,
        totalClassesTaught: trainerPerformance.reduce((sum, t) => sum + t.totalClasses, 0),
        totalPTSessions: trainerPerformance.reduce((sum, t) => sum + t.totalPTSessions, 0),
        avgClassBookings: trainerPerformance.length > 0
          ? parseFloat(
              (trainerPerformance.reduce((sum, t) => sum + t.avgBookingsPerClass, 0) / trainerPerformance.length).toFixed(2)
            )
          : 0,
      },
      trainerPerformance,
      topByClassBookings,
      topByPTSessions,
    },
  });
});

// ============================================
// LEADS ANALYTICS
// ============================================

export const getLeadsAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const orgId = req.user!.organizationId;

  const start = startDate ? new Date(startDate as string) : subMonths(new Date(), 3);
  const end = endDate ? new Date(endDate as string) : endOfDay(new Date());

  const leads = await prisma.lead.findMany({
    where: {
      organizationId: orgId,
      createdAt: { gte: start, lte: end },
    },
    include: {
      activities: true,
    },
  });

  // Status distribution
  const statusDistribution = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Source distribution
  const sourceDistribution = leads.reduce((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Conversion funnel
  const totalLeads = leads.length;
  const contacted = leads.filter((l) => 
    ['CONTACTED', 'INTERESTED', 'QUALIFIED', 'TOUR_SCHEDULED', 'TOUR_DONE', 'NEGOTIATION', 'CONVERTED', 'WON'].includes(l.status)
  ).length;
  const interested = leads.filter((l) =>
    ['INTERESTED', 'QUALIFIED', 'TOUR_SCHEDULED', 'TOUR_DONE', 'NEGOTIATION', 'CONVERTED', 'WON'].includes(l.status)
  ).length;
  const tourDone = leads.filter((l) =>
    ['TOUR_DONE', 'NEGOTIATION', 'CONVERTED', 'WON'].includes(l.status)
  ).length;
  const converted = leads.filter((l) => ['CONVERTED', 'WON'].includes(l.status)).length;

  // Conversion rate by source
  const conversionBySource = Object.entries(sourceDistribution).map(([source, total]) => {
    const convertedFromSource = leads.filter(
      (l) => l.source === source && ['CONVERTED', 'WON'].includes(l.status)
    ).length;
    return {
      source,
      total,
      converted: convertedFromSource,
      conversionRate: total > 0 ? parseFloat(((convertedFromSource / total) * 100).toFixed(2)) : 0,
    };
  });

  // Trend
  const intervals = eachWeekOfInterval({ start, end });
  const trendData = intervals.map((intervalStart: Date) => {
    const intervalEnd = endOfWeek(intervalStart);
    const newLeads = leads.filter(
      (l) => l.createdAt >= intervalStart && l.createdAt <= intervalEnd
    ).length;
    const convertedLeads = leads.filter(
      (l) => l.convertedAt && l.convertedAt >= intervalStart && l.convertedAt <= intervalEnd
    ).length;

    return {
      week: format(intervalStart, "'Week' w"),
      newLeads,
      convertedLeads,
    };
  });

  res.json({
    success: true,
    data: {
      summary: {
        totalLeads,
        newLeads: leads.filter((l) => l.status === 'NEW').length,
        convertedLeads: converted,
        conversionRate: totalLeads > 0 ? parseFloat(((converted / totalLeads) * 100).toFixed(2)) : 0,
        avgTimeToConvert: 0, // Could calculate if we track conversion time
      },
      funnel: [
        { stage: 'Total Leads', count: totalLeads, percentage: 100 },
        { stage: 'Contacted', count: contacted, percentage: totalLeads > 0 ? parseFloat(((contacted / totalLeads) * 100).toFixed(2)) : 0 },
        { stage: 'Interested', count: interested, percentage: totalLeads > 0 ? parseFloat(((interested / totalLeads) * 100).toFixed(2)) : 0 },
        { stage: 'Tour Done', count: tourDone, percentage: totalLeads > 0 ? parseFloat(((tourDone / totalLeads) * 100).toFixed(2)) : 0 },
        { stage: 'Converted', count: converted, percentage: totalLeads > 0 ? parseFloat(((converted / totalLeads) * 100).toFixed(2)) : 0 },
      ],
      statusDistribution: Object.entries(statusDistribution)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
      sourceDistribution: Object.entries(sourceDistribution)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count),
      conversionBySource: conversionBySource.sort((a, b) => b.conversionRate - a.conversionRate),
      trend: trendData,
    },
  });
});

// ============================================
// EXPORT REPORT
// ============================================

export const exportReport = asyncHandler(async (req: Request, res: Response) => {
  const { type, format: exportFormat = 'json', startDate, endDate } = req.query;
  const orgId = req.user!.organizationId;

  const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
  const end = endDate ? new Date(endDate as string) : endOfDay(new Date());

  let data: any = {};

  switch (type) {
    case 'revenue':
      const payments = await prisma.payment.findMany({
        where: {
          member: { organizationId: orgId },
          createdAt: { gte: start, lte: end },
          status: { in: ['SUCCESS', 'COMPLETED'] },
        },
        include: {
          member: { select: { firstName: true, lastName: true, memberId: true } },
          membership: { include: { plan: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
      data = {
        reportType: 'Revenue Report',
        period: { start, end },
        generatedAt: new Date(),
        totalRevenue: payments.reduce((sum, p) => sum + p.amount - (p.refundedAmount || 0), 0),
        totalTransactions: payments.length,
        transactions: payments.map((p) => ({
          date: p.createdAt,
          memberId: p.member.memberId,
          memberName: `${p.member.firstName} ${p.member.lastName}`,
          amount: p.amount,
          refunded: p.refundedAmount || 0,
          netAmount: p.amount - (p.refundedAmount || 0),
          type: p.type,
          method: p.method,
          plan: p.membership?.plan?.name || 'N/A',
        })),
      };
      break;

    case 'members':
      const members = await prisma.member.findMany({
        where: { organizationId: orgId },
        include: {
          memberships: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { plan: { select: { name: true } } },
          },
        },
        orderBy: { joinDate: 'desc' },
      });
      data = {
        reportType: 'Members Report',
        generatedAt: new Date(),
        totalMembers: members.length,
        members: members.map((m) => ({
          memberId: m.memberId,
          name: `${m.firstName} ${m.lastName}`,
          email: m.email,
          phone: m.phone,
          status: m.status,
          joinDate: m.joinDate,
          currentPlan: m.memberships[0]?.plan?.name || 'None',
          membershipStatus: m.memberships[0]?.status || 'None',
          membershipEnd: m.memberships[0]?.endDate || null,
        })),
      };
      break;

    case 'attendance':
      const attendance = await prisma.attendance.findMany({
        where: {
          member: { organizationId: orgId },
          checkInTime: { gte: start, lte: end },
        },
        include: {
          member: { select: { firstName: true, lastName: true, memberId: true } },
        },
        orderBy: { checkInTime: 'desc' },
      });
      data = {
        reportType: 'Attendance Report',
        period: { start, end },
        generatedAt: new Date(),
        totalCheckIns: attendance.length,
        records: attendance.map((a) => ({
          date: a.checkInTime,
          memberId: a.member.memberId,
          memberName: `${a.member.firstName} ${a.member.lastName}`,
          checkIn: a.checkInTime,
          checkOut: a.checkOutTime,
          duration: a.duration,
          method: a.checkInMethod,
        })),
      };
      break;

    default:
      data = { error: 'Invalid report type' };
  }

  if (exportFormat === 'csv') {
    // Convert to CSV
    const records = data.transactions || data.members || data.records || [];
    if (records.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
      res.send('No data available');
      return;
    }

    const headers = Object.keys(records[0]);
    const csvRows = [headers.join(',')];
    
    records.forEach((record: any) => {
      const values = headers.map((h) => {
        const val = record[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    res.send(csvRows.join('\n'));
    return;
  }

  res.json({
    success: true,
    data,
  });
});
