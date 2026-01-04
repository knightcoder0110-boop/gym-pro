import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler } from '../middlewares/error.middleware.js';

// Generate invoice number
const generateInvoiceNumber = async (organizationId: string): Promise<string> => {
  const count = await prisma.payment.count({
    where: { member: { organizationId } },
  });
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `INV${year}${month}${(count + 1).toString().padStart(5, '0')}`;
};

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { memberId, status, type, page = 1, limit = 20 } = req.query;

  const where: any = {
    member: { organizationId },
  };

  if (memberId) where.memberId = memberId;
  if (status) where.status = status;
  if (type) where.type = type;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        member: {
          select: { id: true, memberId: true, firstName: true, lastName: true },
        },
        membership: {
          select: { id: true, plan: { select: { name: true } } },
        },
        collectedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({
    success: true,
    data: payments,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getPayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const payment = await prisma.payment.findFirst({
    where: {
      id,
      member: { organizationId },
    },
    include: {
      member: {
        select: { id: true, memberId: true, firstName: true, lastName: true, email: true, phone: true },
      },
      membership: {
        include: { plan: true },
      },
      collectedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: payment,
  });
});

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const {
    memberId,
    membershipId,
    amount,
    type,
    paymentMethod,
    notes,
    discount = 0,
    tax = 0,
  } = req.body;

  // Verify member belongs to organization
  const member = await prisma.member.findFirst({
    where: { id: memberId, organizationId },
  });

  if (!member) {
    throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
  }

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(organizationId);

  // Calculate totals
  const subtotal = amount;
  const discountAmount = (subtotal * discount) / 100;
  const taxAmount = ((subtotal - discountAmount) * tax) / 100;
  const totalAmount = subtotal - discountAmount + taxAmount;

  const payment = await prisma.payment.create({
    data: {
      memberId,
      membershipId,
      amount: totalAmount,
      type: type || 'MEMBERSHIP',
      method: paymentMethod || 'CASH',
      status: 'SUCCESS',
      notes,
      collectedById: userId,
    },
    include: {
      member: {
        select: { id: true, memberId: true, firstName: true, lastName: true },
      },
      membership: {
        select: { id: true, plan: { select: { name: true } } },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: payment,
    message: 'Payment recorded successfully',
  });
});

export const refundPayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const { reason, refundAmount } = req.body;

  const payment = await prisma.payment.findFirst({
    where: {
      id,
      member: { organizationId },
    },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404, 'NOT_FOUND');
  }

  if (payment.status === 'REFUNDED') {
    throw new AppError('Payment already refunded', 400, 'ALREADY_REFUNDED');
  }

  const actualRefundAmount = refundAmount || payment.amount;

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: {
      status: 'REFUNDED',
      refundedAmount: actualRefundAmount,
      refundReason: reason,
      refundedAt: new Date(),
    },
    include: {
      member: {
        select: { id: true, memberId: true, firstName: true, lastName: true },
      },
    },
  });

  res.json({
    success: true,
    data: updatedPayment,
    message: 'Payment refunded successfully',
  });
});

export const getPaymentStats = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { startDate, endDate } = req.query;

  const dateFilter: any = {};
  if (startDate) dateFilter.gte = new Date(startDate as string);
  if (endDate) dateFilter.lte = new Date(endDate as string);

  const where: any = {
    member: { organizationId },
    status: 'COMPLETED',
  };

  if (Object.keys(dateFilter).length > 0) {
    where.createdAt = dateFilter;
  }

  const [totalRevenue, paymentsByMethod, paymentsByType, recentPayments] = await Promise.all([
    prisma.payment.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.groupBy({
      by: ['method'],
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.findMany({
      where: { member: { organizationId } },
      include: {
        member: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalRevenue: totalRevenue._sum.amount || 0,
      totalTransactions: totalRevenue._count,
      byMethod: paymentsByMethod,
      byType: paymentsByType,
      recentPayments,
    },
  });
});

export const getMemberPayments = asyncHandler(async (req: Request, res: Response) => {
  const { memberId } = req.params;
  const organizationId = req.user!.organizationId;

  // Verify member
  const member = await prisma.member.findFirst({
    where: { id: memberId, organizationId },
  });

  if (!member) {
    throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
  }

  const payments = await prisma.payment.findMany({
    where: { memberId },
    include: {
      membership: {
        select: { plan: { select: { name: true } } },
      },
      collectedBy: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalPaid = payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  res.json({
    success: true,
    data: {
      payments,
      summary: {
        totalPaid,
        transactionCount: payments.length,
      },
    },
  });
});
