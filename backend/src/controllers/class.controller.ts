import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler } from '../middlewares/error.middleware.js';

// ==================== CLASS MANAGEMENT ====================

export const getClasses = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { includeInactive } = req.query;

  const classes = await prisma.class.findMany({
    where: {
      organizationId,
      ...(includeInactive !== 'true' && { isActive: true }),
    },
    include: {
      schedules: {
        where: { isActive: true },
        include: {
          branch: { select: { id: true, name: true } },
          instructor: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      },
      _count: {
        select: { schedules: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  res.json({
    success: true,
    data: classes,
  });
});

export const getClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const classData = await prisma.class.findFirst({
    where: { id, organizationId },
    include: {
      schedules: {
        include: {
          branch: { select: { id: true, name: true } },
          instructor: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
          bookings: {
            include: {
              member: {
                select: { id: true, memberId: true, firstName: true, lastName: true },
              },
            },
          },
        },
      },
    },
  });

  if (!classData) {
    throw new AppError('Class not found', 404, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: classData,
  });
});

export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const {
    name,
    description,
    category,
    durationMinutes,
    maxCapacity,
    color,
    difficulty,
    dropInPrice,
  } = req.body;

  const classData = await prisma.class.create({
    data: {
      organizationId,
      name,
      description,
      category: category || 'OTHER',
      durationMinutes: durationMinutes || 60,
      maxCapacity: maxCapacity || 20,
      color: color || '#1db954',
      difficulty: difficulty || 'ALL_LEVELS',
      dropInPrice,
    },
  });

  res.status(201).json({
    success: true,
    data: classData,
    message: 'Class created successfully',
  });
});

export const updateClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const updates = req.body;

  const existingClass = await prisma.class.findFirst({
    where: { id, organizationId },
  });

  if (!existingClass) {
    throw new AppError('Class not found', 404, 'NOT_FOUND');
  }

  const updatedClass = await prisma.class.update({
    where: { id },
    data: updates,
  });

  res.json({
    success: true,
    data: updatedClass,
    message: 'Class updated successfully',
  });
});

export const deleteClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const existingClass = await prisma.class.findFirst({
    where: { id, organizationId },
  });

  if (!existingClass) {
    throw new AppError('Class not found', 404, 'NOT_FOUND');
  }

  // Soft delete by marking inactive
  await prisma.class.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({
    success: true,
    message: 'Class deleted successfully',
  });
});

// ==================== SCHEDULE MANAGEMENT ====================

export const getSchedules = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { branchId, classId, startDate, endDate, dayOfWeek } = req.query;

  const where: any = {
    class: { organizationId },
    isActive: true,
  };

  if (branchId) where.branchId = branchId;
  if (classId) where.classId = classId;
  if (dayOfWeek) where.dayOfWeek = parseInt(dayOfWeek as string);

  const schedules = await prisma.classSchedule.findMany({
    where,
    include: {
      class: {
        select: { id: true, name: true, color: true, durationMinutes: true, category: true },
      },
      branch: {
        select: { id: true, name: true },
      },
      instructor: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  res.json({
    success: true,
    data: schedules,
  });
});

export const createSchedule = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const {
    classId,
    branchId,
    instructorId,
    dayOfWeek,
    startTime,
    endTime,
    maxCapacity,
    room,
  } = req.body;

  // Verify class belongs to organization
  const classData = await prisma.class.findFirst({
    where: { id: classId, organizationId },
  });

  if (!classData) {
    throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
  }

  const schedule = await prisma.classSchedule.create({
    data: {
      classId,
      branchId,
      instructorId,
      dayOfWeek,
      startTime,
      endTime,
      location: room,
    },
    include: {
      class: {
        select: { id: true, name: true, color: true },
      },
      branch: {
        select: { id: true, name: true },
      },
      instructor: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: schedule,
    message: 'Schedule created successfully',
  });
});

export const updateSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const updates = req.body;

  const schedule = await prisma.classSchedule.findFirst({
    where: { id, class: { organizationId } },
  });

  if (!schedule) {
    throw new AppError('Schedule not found', 404, 'NOT_FOUND');
  }

  const updatedSchedule = await prisma.classSchedule.update({
    where: { id },
    data: updates,
    include: {
      class: {
        select: { id: true, name: true, color: true },
      },
      instructor: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  res.json({
    success: true,
    data: updatedSchedule,
    message: 'Schedule updated successfully',
  });
});

export const deleteSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const schedule = await prisma.classSchedule.findFirst({
    where: { id, class: { organizationId } },
  });

  if (!schedule) {
    throw new AppError('Schedule not found', 404, 'NOT_FOUND');
  }

  await prisma.classSchedule.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({
    success: true,
    message: 'Schedule deleted successfully',
  });
});

// ==================== BOOKING MANAGEMENT ====================

export const getBookings = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { scheduleId, memberId, classDate, status } = req.query;

  const where: any = {
    schedule: { class: { organizationId } },
  };

  if (scheduleId) where.scheduleId = scheduleId;
  if (memberId) where.memberId = memberId;
  if (classDate) where.classDate = new Date(classDate as string);
  if (status) where.status = status;

  const bookings = await prisma.classBooking.findMany({
    where,
    include: {
      schedule: {
        include: {
          class: {
            select: { id: true, name: true, color: true, durationMinutes: true },
          },
        },
      },
      member: {
        select: { id: true, memberId: true, firstName: true, lastName: true, avatar: true },
      },
    },
    orderBy: { classDate: 'desc' },
  });

  res.json({
    success: true,
    data: bookings,
  });
});

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { scheduleId, memberId, classDate } = req.body;

  // Verify schedule exists
  const schedule = await prisma.classSchedule.findFirst({
    where: { id: scheduleId, class: { organizationId } },
    include: {
      class: { select: { name: true, maxCapacity: true } },
      _count: { select: { bookings: true } },
    },
  });

  if (!schedule) {
    throw new AppError('Schedule not found', 404, 'SCHEDULE_NOT_FOUND');
  }

  // Verify member exists and has active membership
  const member = await prisma.member.findFirst({
    where: { id: memberId, organizationId },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  });

  if (!member) {
    throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
  }

  if (member.memberships.length === 0) {
    throw new AppError('Member has no active membership', 403, 'NO_ACTIVE_MEMBERSHIP');
  }

  // Check if already booked
  const existingBooking = await prisma.classBooking.findFirst({
    where: {
      scheduleId,
      memberId,
      classDate: new Date(classDate),
      status: { not: 'CANCELLED' },
    },
  });

  if (existingBooking) {
    throw new AppError('Already booked for this class', 400, 'ALREADY_BOOKED');
  }

  // Check capacity
  const bookingsCount = await prisma.classBooking.count({
    where: {
      scheduleId,
      classDate: new Date(classDate),
      status: { not: 'CANCELLED' },
    },
  });

  if (bookingsCount >= (schedule.class?.maxCapacity || 20)) {
    throw new AppError('Class is full', 400, 'CLASS_FULL');
  }

  const booking = await prisma.classBooking.create({
    data: {
      scheduleId,
      memberId,
      classDate: new Date(classDate),
      status: 'CONFIRMED',
    },
    include: {
      schedule: {
        include: {
          class: { select: { name: true, color: true } },
        },
      },
      member: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: booking,
    message: `Booked for ${schedule.class.name}`,
  });
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const { reason } = req.body;

  const booking = await prisma.classBooking.findFirst({
    where: { id, schedule: { class: { organizationId } } },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404, 'NOT_FOUND');
  }

  if (booking.status === 'CANCELLED') {
    throw new AppError('Booking already cancelled', 400, 'ALREADY_CANCELLED');
  }

  const updatedBooking = await prisma.classBooking.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  });

  res.json({
    success: true,
    data: updatedBooking,
    message: 'Booking cancelled successfully',
  });
});

export const markAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const { attended } = req.body;

  const booking = await prisma.classBooking.findFirst({
    where: { id, schedule: { class: { organizationId } } },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404, 'NOT_FOUND');
  }

  const updatedBooking = await prisma.classBooking.update({
    where: { id },
    data: {
      status: attended ? 'ATTENDED' : 'NO_SHOW',
      checkedInAt: attended ? new Date() : null,
    },
    include: {
      member: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  res.json({
    success: true,
    data: updatedBooking,
    message: attended ? 'Marked as attended' : 'Marked as no-show',
  });
});

// ==================== CALENDAR VIEW ====================

export const getWeeklySchedule = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { branchId, weekStart } = req.query;

  const startDate = weekStart ? new Date(weekStart as string) : new Date();
  startDate.setHours(0, 0, 0, 0);
  
  // Get day of week (0 = Sunday)
  const dayOffset = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOffset);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  const where: any = {
    class: { organizationId },
    isActive: true,
  };

  if (branchId) where.branchId = branchId;

  const schedules = await prisma.classSchedule.findMany({
    where,
    include: {
      class: {
        select: { id: true, name: true, color: true, durationMinutes: true, category: true, difficulty: true, maxCapacity: true },
      },
      instructor: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
      branch: {
        select: { id: true, name: true },
      },
      bookings: {
        where: {
          classDate: {
            gte: startDate,
            lt: endDate,
          },
          status: { not: 'CANCELLED' },
        },
        select: { id: true, status: true },
      },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  // Group by day of week
  const weeklySchedule = Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
    schedules: schedules
      .filter((s) => s.dayOfWeek === i)
      .map((s) => ({
        ...s,
        bookedCount: s.bookings.length,
        availableSpots: (s.class?.maxCapacity || 20) - s.bookings.length,
      })),
  }));

  res.json({
    success: true,
    data: {
      weekStart: startDate,
      weekEnd: endDate,
      schedule: weeklySchedule,
    },
  });
});
