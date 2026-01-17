import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { pdfService } from '../services/pdf.service.js';

/**
 * Get all invoices
 * GET /invoices
 */
export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { memberId, status, page = 1, limit = 20 } = req.query;
    const organizationId = (req as any).user.organizationId;

    const where: any = { organizationId };
    if (memberId) where.memberId = memberId;
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
          items: true,
        },
        orderBy: { issueDate: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      data: invoices,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get invoices' },
    });
  }
};

/**
 * Get single invoice
 * GET /invoices/:id
 */
export const getInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        member: true,
        organization: true,
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invoice not found' },
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get invoice' },
    });
  }
};

/**
 * Create invoice
 * POST /invoices
 */
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { memberId, items, discount, discountType, discountValue, notes, dueDate } = req.body;
    const organizationId = (req as any).user.organizationId;

    // Validate member exists
    const member = await prisma.member.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        error: { message: 'Member not found' },
      });
    }

    // Get organization for tax settings
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      return res.status(404).json({
        success: false,
        error: { message: 'Organization not found' },
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
    const discountAmount = discount || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = org.taxEnabled ? (taxableAmount * org.taxPercentage) / 100 : 0;
    const total = taxableAmount + taxAmount;

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    const invoiceNumber = lastInvoice
      ? `INV-${(parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1).toString().padStart(6, '0')}`
      : 'INV-000001';

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        organizationId,
        memberId,
        subtotal,
        discount: discountAmount,
        discountType,
        discountValue,
        taxAmount,
        total,
        status: 'PENDING',
        notes,
        dueDate: dueDate ? new Date(dueDate) : null,
        items: {
          create: items.map((item: any) => ({
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            referenceId: item.referenceId,
            referenceType: item.referenceType,
          })),
        },
      },
      include: {
        member: true,
        items: true,
      },
    });

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create invoice' },
    });
  }
};

/**
 * Generate invoice PDF
 * GET /invoices/:id/pdf
 */
export const generateInvoicePDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    // Generate PDF buffer
    const pdfBuffer = await pdfService.generateInvoicePDF(id, organizationId);

    // Get invoice for filename
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
      select: { invoiceNumber: true },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invoice not found' },
      });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate invoice PDF error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate invoice PDF' },
    });
  }
};

/**
 * Generate and save invoice PDF to storage
 * POST /invoices/:id/pdf/save
 */
export const saveInvoicePDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    const result = await pdfService.generateAndSaveInvoicePDF(id, organizationId);

    res.json({
      success: true,
      data: {
        url: result.url,
        key: result.key,
        message: 'Invoice PDF saved successfully',
      },
    });
  } catch (error) {
    console.error('Save invoice PDF error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to save invoice PDF' },
    });
  }
};

/**
 * Update invoice status
 * PATCH /invoices/:id/status
 */
export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const organizationId = (req as any).user.organizationId;

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invoice not found' },
      });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        paidDate: status === 'PAID' ? new Date() : null,
      },
      include: {
        member: true,
        items: true,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update invoice status' },
    });
  }
};

/**
 * Delete invoice
 * DELETE /invoices/:id
 */
export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invoice not found' },
      });
    }

    // Check if invoice has payments
    const hasPayments = await prisma.payment.count({
      where: { invoiceId: id },
    });

    if (hasPayments > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot delete invoice with payments. Cancel it instead.' },
      });
    }

    await prisma.invoice.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete invoice' },
    });
  }
};
