import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler } from '../middlewares/error.middleware.js';

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { memberId, branchId, method = 'MANUAL' } = req.body;

  // Verify member belongs to organization
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

  if (member.status === 'BLOCKED') {
    throw new AppError('Member is blocked', 403, 'MEMBER_BLOCKED');
  }

  if (member.status === 'FROZEN') {
    throw new AppError('Membership is frozen', 403, 'MEMBERSHIP_FROZEN');
  }

  if (member.memberships.length === 0) {
    throw new AppError('No active membership', 403, 'NO_ACTIVE_MEMBERSHIP');
  }

  // Check if already checked in today without checkout
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingCheckIn = await prisma.attendance.findFirst({
    where: {
      memberId,
      checkInTime: {
        gte: today,
        lt: tomorrow,
      },
      checkOutTime: null,
    },
  });

  if (existingCheckIn) {
    throw new AppError('Already checked in', 400, 'ALREADY_CHECKED_IN');
  }

  const attendance = await prisma.attendance.create({
    data: {
      memberId,
      branchId: branchId || member.branchId,
      checkInTime: new Date(),
      checkInMethod: method,
    },
    include: {
      member: {
        select: { id: true, memberId: true, firstName: true, lastName: true, avatar: true },
      },
      branch: {
        select: { id: true, name: true },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: attendance,
    message: `Welcome, ${member.firstName}!`,
  });
});

export const checkOut = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { memberId, attendanceId } = req.body;

  let attendance;

  if (attendanceId) {
    attendance = await prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        member: { organizationId },
        checkOutTime: null,
      },
    });
  } else if (memberId) {
    // Find latest unchecked-out attendance for this member
    attendance = await prisma.attendance.findFirst({
      where: {
        memberId,
        member: { organizationId },
        checkOutTime: null,
      },
      orderBy: { checkInTime: 'desc' },
    });
  }

  if (!attendance) {
    throw new AppError('No active check-in found', 404, 'NO_ACTIVE_CHECKIN');
  }

  const checkOutTime = new Date();
  const duration = Math.round(
    (checkOutTime.getTime() - attendance.checkInTime.getTime()) / 60000
  ); // Duration in minutes

  const updatedAttendance = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOutTime,
      duration,
    },
    include: {
      member: {
        select: { id: true, memberId: true, firstName: true, lastName: true },
      },
    },
  });

  res.json({
    success: true,
    data: updatedAttendance,
    message: 'Checked out successfully',
  });
});

export const getAttendanceHistory = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { memberId, branchId, startDate, endDate, page = 1, limit = 50 } = req.query;

  const where: any = {
    member: { organizationId },
  };

  if (memberId) where.memberId = memberId;
  if (branchId) where.branchId = branchId;

  if (startDate || endDate) {
    where.checkInTime = {};
    if (startDate) where.checkInTime.gte = new Date(startDate as string);
    if (endDate) where.checkInTime.lte = new Date(endDate as string);
  }

  const [attendance, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        member: {
          select: { id: true, memberId: true, firstName: true, lastName: true, avatar: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
      orderBy: { checkInTime: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.attendance.count({ where }),
  ]);

  res.json({
    success: true,
    data: attendance,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getTodayAttendance = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { branchId } = req.query;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const where: any = {
    member: { organizationId },
    checkInTime: {
      gte: today,
      lt: tomorrow,
    },
  };

  if (branchId) where.branchId = branchId;

  const [attendance, stats] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        member: {
          select: { id: true, memberId: true, firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { checkInTime: 'desc' },
    }),
    prisma.attendance.aggregate({
      where,
      _count: true,
    }),
  ]);

  const currentlyIn = attendance.filter(a => !a.checkOutTime).length;

  res.json({
    success: true,
    data: {
      attendance,
      stats: {
        totalCheckIns: stats._count,
        currentlyIn,
        checkedOut: stats._count - currentlyIn,
      },
    },
  });
});

export const getMemberAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { memberId } = req.params;
  const organizationId = req.user!.organizationId;
  const { days = 30 } = req.query;

  // Verify member
  const member = await prisma.member.findFirst({
    where: { id: memberId, organizationId },
  });

  if (!member) {
    throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));

  const attendance = await prisma.attendance.findMany({
    where: {
      memberId,
      checkInTime: { gte: startDate },
    },
    include: {
      branch: {
        select: { name: true },
      },
    },
    orderBy: { checkInTime: 'desc' },
  });

  // Calculate stats
  const totalVisits = attendance.length;
  const totalDuration = attendance.reduce((sum, a) => sum + (a.duration || 0), 0);
  const avgDuration = totalVisits > 0 ? Math.round(totalDuration / totalVisits) : 0;

  res.json({
    success: true,
    data: {
      attendance,
      stats: {
        totalVisits,
        totalDuration,
        avgDuration,
        period: `${days} days`,
      },
    },
  });
});

export const checkInByQR = asyncHandler(async (req: Request, res: Response, next) => {
  const organizationId = req.user!.organizationId;
  const { qrCode, branchId } = req.body;

  // Find member by QR code
  const member = await prisma.member.findFirst({
    where: {
      qrCode,
      organizationId,
    },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  });

  if (!member) {
    throw new AppError('Invalid QR code', 404, 'INVALID_QR');
  }

  // Reuse check-in logic
  req.body.memberId = member.id;
  req.body.method = 'QR_CODE';

  // Call the checkIn handler
  return checkIn(req, res, next);
});

export const checkInByMemberId = asyncHandler(async (req: Request, res: Response, next) => {
  const organizationId = req.user!.organizationId;
  const { memberIdCode, branchId } = req.body;

  // Find member by member ID code
  const member = await prisma.member.findFirst({
    where: {
      memberId: memberIdCode,
      organizationId,
    },
  });

  if (!member) {
    throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
  }

  req.body.memberId = member.id;
  req.body.method = 'MEMBER_ID';

  return checkIn(req, res, next);
});
