import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler } from '../middlewares/error.middleware.js';

export const getMembers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, search, planId } = req.query;
  const organizationId = req.user!.organizationId;

  const where: any = { organizationId };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
      { phone: { contains: search as string } },
      { memberId: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: { select: { name: true } } },
          take: 1,
          orderBy: { endDate: 'desc' },
        },
        trainer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.member.count({ where }),
  ]);

  res.json({
    success: true,
    data: members.map((member) => ({
      ...member,
      currentMembership: member.memberships[0] || null,
      memberships: undefined,
    })),
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getMember = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const member = await prisma.member.findFirst({
    where: { id, organizationId },
    include: {
      memberships: {
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      },
      trainer: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      branch: { select: { id: true, name: true } },
    },
  });

  if (!member) {
    throw new AppError('Member not found', 404, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: member,
  });
});

export const createMember = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const data = req.body;

  // Generate member ID
  const lastMember = await prisma.member.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    select: { memberId: true },
  });

  let nextNumber = 1;
  if (lastMember?.memberId) {
    const match = lastMember.memberId.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }
  const memberId = `GYM${nextNumber.toString().padStart(4, '0')}`;

  // Convert dateOfBirth string to DateTime if present
  const memberData: any = {
    ...data,
    memberId,
    organizationId,
  };

  if (data.dateOfBirth) {
    // Convert "YYYY-MM-DD" to ISO DateTime
    memberData.dateOfBirth = new Date(data.dateOfBirth);
  }

  const member = await prisma.member.create({
    data: memberData,
    include: {
      branch: { select: { id: true, name: true } },
    },
  });

  // Send welcome email (async - don't block response)
  import('../services/notification.service.js').then(({ notificationService }) => {
    notificationService.sendWelcomeEmail({
      memberId: member.id,
      organizationId,
    }).catch(err => console.error('Failed to send welcome email:', err));
  });

  res.status(201).json({
    success: true,
    data: member,
    message: 'Member created successfully',
  });
});

export const updateMember = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const data = req.body;

  const existing = await prisma.member.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new AppError('Member not found', 404, 'NOT_FOUND');
  }

  const member = await prisma.member.update({
    where: { id },
    data,
  });

  res.json({
    success: true,
    data: member,
    message: 'Member updated successfully',
  });
});

export const deleteMember = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const existing = await prisma.member.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new AppError('Member not found', 404, 'NOT_FOUND');
  }

  await prisma.member.update({
    where: { id },
    data: { status: 'INACTIVE' },
  });

  res.json({
    success: true,
    message: 'Member deleted successfully',
  });
});
