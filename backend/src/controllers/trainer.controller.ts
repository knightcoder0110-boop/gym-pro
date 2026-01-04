import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler } from '../middlewares/error.middleware.js';

export const getTrainers = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { includeInactive } = req.query;

  const trainers = await prisma.user.findMany({
    where: {
      organizationId,
      isTrainer: true,
      ...(includeInactive !== 'true' && { isActive: true }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      isActive: true,
      createdAt: true,
      classesInstructed: {
        where: { isActive: true },
        include: {
          class: { select: { id: true, name: true, category: true } },
        },
      },
      ptSessions: {
        where: {
          scheduledDate: { gte: new Date() },
          status: 'SCHEDULED',
        },
        take: 5,
        orderBy: { scheduledDate: 'asc' },
      },
      _count: {
        select: {
          classesInstructed: true,
          ptSessions: true,
        },
      },
    },
    orderBy: { firstName: 'asc' },
  });

  res.json({
    success: true,
    data: trainers,
  });
});

export const getTrainer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const trainer = await prisma.user.findFirst({
    where: {
      id,
      organizationId,
      isTrainer: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      isActive: true,
      createdAt: true,
      classesInstructed: {
        include: {
          class: { select: { id: true, name: true, category: true, color: true } },
          branch: { select: { id: true, name: true } },
        },
      },
      ptSessions: {
        include: {
          member: {
            select: { id: true, memberId: true, firstName: true, lastName: true },
          },
        },
        orderBy: { scheduledDate: 'desc' },
        take: 20,
      },
    },
  });

  if (!trainer) {
    throw new AppError('Trainer not found', 404, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: trainer,
  });
});

export const createTrainer = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const {
    email,
    firstName,
    lastName,
    phone,
    branchId,
    specializations,
    bio,
    certifications,
    hourlyRate,
  } = req.body;

  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new AppError('Email already in use', 400, 'EMAIL_EXISTS');
  }

  // Create trainer as a user with TRAINER role
  const trainer = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      phone,
      passwordHash: '', // They'll set password on first login
      isTrainer: true,
      role: 'TRAINER',
      organizationId,
      branchId,
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  res.status(201).json({
    success: true,
    data: trainer,
    message: 'Trainer added successfully',
  });
});

export const updateTrainer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const updates = req.body;

  const trainer = await prisma.user.findFirst({
    where: {
      id,
      organizationId,
      isTrainer: true,
    },
  });

  if (!trainer) {
    throw new AppError('Trainer not found', 404, 'NOT_FOUND');
  }

  // Remove sensitive fields from updates
  delete updates.password;
  delete updates.role;
  delete updates.organizationId;

  const updatedTrainer = await prisma.user.update({
    where: { id },
    data: updates,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      isActive: true,
    },
  });

  res.json({
    success: true,
    data: updatedTrainer,
    message: 'Trainer updated successfully',
  });
});

export const deleteTrainer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const trainer = await prisma.user.findFirst({
    where: {
      id,
      organizationId,
      isTrainer: true,
    },
  });

  if (!trainer) {
    throw new AppError('Trainer not found', 404, 'NOT_FOUND');
  }

  // Soft delete
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({
    success: true,
    message: 'Trainer deactivated successfully',
  });
});

export const getTrainerSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const { startDate, endDate } = req.query;

  const trainer = await prisma.user.findFirst({
    where: {
      id,
      organizationId,
      isTrainer: true,
    },
  });

  if (!trainer) {
    throw new AppError('Trainer not found', 404, 'NOT_FOUND');
  }

  // Get class schedules
  const classSchedules = await prisma.classSchedule.findMany({
    where: {
      instructorId: id,
      isActive: true,
    },
    include: {
      class: { select: { id: true, name: true, category: true, color: true, durationMinutes: true } },
      branch: { select: { id: true, name: true } },
    },
  });

  // Get PT sessions
  const whereDate: any = {};
  if (startDate) whereDate.gte = new Date(startDate as string);
  if (endDate) whereDate.lte = new Date(endDate as string);

  const ptSessions = await prisma.pTSession.findMany({
    where: {
      trainerId: id,
      ...(Object.keys(whereDate).length > 0 && { scheduledDate: whereDate }),
    },
    include: {
      member: {
        select: { id: true, memberId: true, firstName: true, lastName: true, avatar: true },
      },
    },
    orderBy: { scheduledDate: 'asc' },
  });

  res.json({
    success: true,
    data: {
      classSchedules,
      ptSessions,
    },
  });
});

export const getTrainerStats = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;

  const [totalTrainers, activeTrainers, totalClasses, totalPTSessions] = await Promise.all([
    prisma.user.count({
      where: { organizationId, isTrainer: true },
    }),
    prisma.user.count({
      where: { organizationId, isTrainer: true, isActive: true },
    }),
    prisma.classSchedule.count({
      where: { class: { organizationId }, isActive: true },
    }),
    prisma.pTSession.count({
      where: {
        trainer: { organizationId },
        scheduledDate: { gte: new Date() },
        status: 'SCHEDULED',
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalTrainers,
      activeTrainers,
      totalClasses,
      upcomingPTSessions: totalPTSessions,
    },
  });
});
