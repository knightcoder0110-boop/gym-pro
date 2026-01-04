import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler } from '../middlewares/error.middleware.js';

export const getLeads = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { status, source, assignedTo, page = 1, limit = 50 } = req.query;

  const where: any = { organizationId };

  if (status) where.status = status;
  if (source) where.source = source;
  if (assignedTo) where.assignedToId = assignedTo;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        activities: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { activities: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.lead.count({ where }),
  ]);

  res.json({
    success: true,
    data: leads,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const lead = await prisma.lead.findFirst({
    where: { id, organizationId },
    include: {
      assignedTo: {
        select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!lead) {
    throw new AppError('Lead not found', 404, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: lead,
  });
});

export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const {
    firstName,
    lastName,
    email,
    phone,
    source,
    interestedIn,
    notes,
    assignedToId,
  } = req.body;

  const lead = await prisma.lead.create({
    data: {
      organizationId,
      firstName,
      lastName,
      email,
      phone,
      source: source || 'WALK_IN',
      interestedIn,
      notes,
      status: 'NEW',
      assignedToId: assignedToId || userId,
    },
    include: {
      assignedTo: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Create initial activity
  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      type: 'CREATED',
      description: 'Lead created',
      performedById: userId,
    },
  });

  res.status(201).json({
    success: true,
    data: lead,
    message: 'Lead created successfully',
  });
});

export const updateLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const updates = req.body;

  const lead = await prisma.lead.findFirst({
    where: { id, organizationId },
  });

  if (!lead) {
    throw new AppError('Lead not found', 404, 'NOT_FOUND');
  }

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: updates,
    include: {
      assignedTo: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Log status change
  if (updates.status && updates.status !== lead.status) {
    await prisma.leadActivity.create({
      data: {
        leadId: id,
        type: 'STATUS_CHANGE',
        description: `Status changed from ${lead.status} to ${updates.status}`,
        performedById: userId,
      },
    });
  }

  res.json({
    success: true,
    data: updatedLead,
    message: 'Lead updated successfully',
  });
});

export const deleteLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const lead = await prisma.lead.findFirst({
    where: { id, organizationId },
  });

  if (!lead) {
    throw new AppError('Lead not found', 404, 'NOT_FOUND');
  }

  await prisma.lead.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Lead deleted successfully',
  });
});

export const addActivity = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const { type, description, scheduledAt } = req.body;

  const lead = await prisma.lead.findFirst({
    where: { id, organizationId },
  });

  if (!lead) {
    throw new AppError('Lead not found', 404, 'NOT_FOUND');
  }

  const activity = await prisma.leadActivity.create({
    data: {
      leadId: id,
      type,
      description,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      performedById: userId,
    },
  });

  // Update lead's last contacted date
  if (['CALL', 'EMAIL', 'MEETING', 'TOUR'].includes(type)) {
    await prisma.lead.update({
      where: { id },
      data: { lastContactedAt: new Date() },
    });
  }

  res.status(201).json({
    success: true,
    data: activity,
    message: 'Activity added successfully',
  });
});

export const convertToMember = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const { planId, durationId } = req.body;

  const lead = await prisma.lead.findFirst({
    where: { id, organizationId },
  });

  if (!lead) {
    throw new AppError('Lead not found', 404, 'NOT_FOUND');
  }

  if (lead.status === 'CONVERTED') {
    throw new AppError('Lead already converted', 400, 'ALREADY_CONVERTED');
  }

  // Generate member ID
  const count = await prisma.member.count({ where: { organizationId } });
  const memberId = `GYM${(count + 1).toString().padStart(4, '0')}`;

  // Create member from lead
  const member = await prisma.member.create({
    data: {
      organizationId,
      branchId: lead.branchId || (await prisma.branch.findFirst({ where: { organizationId } }))?.id || '',
      memberId,
      firstName: lead.firstName,
      lastName: lead.lastName || '',
      email: lead.email || '',
      phone: lead.phone,
      source: lead.source,
      status: 'ACTIVE',
    },
  });

  // Update lead status
  await prisma.lead.update({
    where: { id },
    data: {
      status: 'CONVERTED',
      convertedAt: new Date(),
      convertedMemberId: member.id,
    },
  });

  // Log activity
  await prisma.leadActivity.create({
    data: {
      leadId: id,
      type: 'CONVERTED',
      description: `Converted to member: ${memberId}`,
      performedById: userId,
    },
  });

  res.json({
    success: true,
    data: { lead, member },
    message: 'Lead converted to member successfully',
  });
});

export const getLeadStats = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;

  const [
    totalLeads,
    newLeads,
    contactedLeads,
    qualifiedLeads,
    convertedLeads,
    lostLeads,
    recentLeads,
  ] = await Promise.all([
    prisma.lead.count({ where: { organizationId } }),
    prisma.lead.count({ where: { organizationId, status: 'NEW' } }),
    prisma.lead.count({ where: { organizationId, status: 'CONTACTED' } }),
    prisma.lead.count({ where: { organizationId, status: 'QUALIFIED' } }),
    prisma.lead.count({ where: { organizationId, status: 'CONVERTED' } }),
    prisma.lead.count({ where: { organizationId, status: 'LOST' } }),
    prisma.lead.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        source: true,
        createdAt: true,
      },
    }),
  ]);

  // Calculate conversion rate
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  res.json({
    success: true,
    data: {
      totalLeads,
      byStatus: {
        new: newLeads,
        contacted: contactedLeads,
        qualified: qualifiedLeads,
        converted: convertedLeads,
        lost: lostLeads,
      },
      conversionRate: conversionRate.toFixed(1),
      recentLeads,
    },
  });
});

export const getLeadsBySource = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;

  const sources = await prisma.lead.groupBy({
    by: ['source'],
    where: { organizationId },
    _count: true,
  });

  res.json({
    success: true,
    data: sources,
  });
});
