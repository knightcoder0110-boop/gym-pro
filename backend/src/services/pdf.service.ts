/**
 * PDF Generation Service
 * Generates PDF documents for invoices, reports, etc.
 * Uses PDFKit for PDF generation
 */

import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma.js';
import { format } from 'date-fns';

interface InvoiceData {
  invoice: {
    id: string;
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date | null;
    subtotal: number;
    discount: number;
    taxAmount: number;
    total: number;
    status: string;
    notes: string | null;
  };
  organization: {
    name: string;
    email: string;
    phone: string;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    zipCode: string | null;
    logo: string | null;
    taxName: string;
    taxNumber: string | null;
    taxPercentage: number;
  };
  member: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export const pdfService = {
  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(invoiceId: string, organizationId: string): Promise<Buffer> {
    // Fetch invoice data
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: {
        member: true,
        organization: true,
        items: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const invoiceData: InvoiceData = {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        status: invoice.status,
        notes: invoice.notes,
      },
      organization: {
        name: invoice.organization.name,
        email: invoice.organization.email,
        phone: invoice.organization.phone,
        address: invoice.organization.address,
        city: invoice.organization.city,
        state: invoice.organization.state,
        country: invoice.organization.country,
        zipCode: invoice.organization.zipCode,
        logo: invoice.organization.logo,
        taxName: invoice.organization.taxName,
        taxNumber: invoice.organization.taxNumber,
        taxPercentage: invoice.organization.taxPercentage,
      },
      member: {
        firstName: invoice.member.firstName,
        lastName: invoice.member.lastName,
        email: invoice.member.email,
        phone: invoice.member.phone,
        address: invoice.member.address,
        city: invoice.member.city,
        state: invoice.member.state,
        zipCode: invoice.member.zipCode,
      },
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    };

    return this.createInvoicePDF(invoiceData);
  },

  /**
   * Create invoice PDF from data
   */
  createInvoicePDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Colors
        const primaryColor = '#f97316'; // Orange
        const darkGray = '#18181b';
        const lightGray = '#71717a';
        const borderColor = '#e4e4e7';

        // Header
        doc
          .fontSize(28)
          .fillColor(darkGray)
          .text(data.organization.name, 50, 50, { width: 300 });

        doc
          .fontSize(10)
          .fillColor(lightGray)
          .text(data.organization.address || '', 50, 85)
          .text(
            `${data.organization.city || ''}${data.organization.state ? ', ' + data.organization.state : ''} ${data.organization.zipCode || ''}`,
            50,
            100
          )
          .text(data.organization.phone, 50, 115)
          .text(data.organization.email, 50, 130);

        // Invoice title and number
        doc
          .fontSize(36)
          .fillColor(primaryColor)
          .text('INVOICE', 350, 50, { align: 'right' });

        doc
          .fontSize(12)
          .fillColor(darkGray)
          .text(`#${data.invoice.invoiceNumber}`, 350, 95, { align: 'right' });

        // Status badge
        const statusColors: Record<string, string> = {
          PAID: '#10b981',
          PENDING: '#f59e0b',
          PARTIAL: '#3b82f6',
          CANCELLED: '#ef4444',
          REFUNDED: '#6b7280',
        };
        const statusColor = statusColors[data.invoice.status] || lightGray;

        doc
          .fontSize(10)
          .fillColor(statusColor)
          .text(data.invoice.status, 350, 115, { align: 'right' });

        // Horizontal line
        doc
          .strokeColor(borderColor)
          .lineWidth(1)
          .moveTo(50, 160)
          .lineTo(545, 160)
          .stroke();

        // Bill To section
        doc
          .fontSize(12)
          .fillColor(lightGray)
          .text('BILL TO:', 50, 180);

        doc
          .fontSize(11)
          .fillColor(darkGray)
          .text(`${data.member.firstName} ${data.member.lastName}`, 50, 200)
          .fontSize(10)
          .fillColor(lightGray)
          .text(data.member.email, 50, 215)
          .text(data.member.phone, 50, 230);

        if (data.member.address) {
          doc
            .text(data.member.address, 50, 245)
            .text(
              `${data.member.city || ''}${data.member.state ? ', ' + data.member.state : ''} ${data.member.zipCode || ''}`,
              50,
              260
            );
        }

        // Invoice details
        const detailsX = 350;
        let detailsY = 180;

        doc.fontSize(10).fillColor(lightGray);

        doc.text('Issue Date:', detailsX, detailsY);
        doc
          .fillColor(darkGray)
          .text(format(data.invoice.issueDate, 'MMM dd, yyyy'), detailsX + 80, detailsY, { align: 'right' });
        detailsY += 20;

        if (data.invoice.dueDate) {
          doc.fillColor(lightGray).text('Due Date:', detailsX, detailsY);
          doc
            .fillColor(darkGray)
            .text(format(data.invoice.dueDate, 'MMM dd, yyyy'), detailsX + 80, detailsY, { align: 'right' });
          detailsY += 20;
        }

        if (data.organization.taxNumber) {
          doc.fillColor(lightGray).text(`${data.organization.taxName} No:`, detailsX, detailsY);
          doc.fillColor(darkGray).text(data.organization.taxNumber, detailsX + 80, detailsY, { align: 'right' });
        }

        // Items table
        const tableTop = 320;
        let tableY = tableTop;

        // Table header
        doc
          .fontSize(10)
          .fillColor('#ffffff')
          .rect(50, tableY, 495, 25)
          .fill(primaryColor);

        doc
          .fillColor('#ffffff')
          .text('DESCRIPTION', 60, tableY + 8, { width: 250 })
          .text('QTY', 320, tableY + 8, { width: 50, align: 'center' })
          .text('RATE', 380, tableY + 8, { width: 70, align: 'right' })
          .text('AMOUNT', 460, tableY + 8, { width: 75, align: 'right' });

        tableY += 25;

        // Table rows
        doc.fillColor(darkGray).fontSize(10);

        data.items.forEach((item, index) => {
          const rowY = tableY + index * 30;

          // Alternate row background
          if (index % 2 === 0) {
            doc.rect(50, rowY, 495, 30).fill('#fafafa');
          }

          doc
            .fillColor(darkGray)
            .text(item.description, 60, rowY + 10, { width: 250 })
            .text(item.quantity.toString(), 320, rowY + 10, { width: 50, align: 'center' })
            .text(`₹${item.unitPrice.toLocaleString()}`, 380, rowY + 10, { width: 70, align: 'right' })
            .text(`₹${item.total.toLocaleString()}`, 460, rowY + 10, { width: 75, align: 'right' });
        });

        tableY += data.items.length * 30 + 20;

        // Totals section
        const totalsX = 380;
        let totalsY = tableY;

        // Subtotal
        doc
          .fontSize(10)
          .fillColor(lightGray)
          .text('Subtotal:', totalsX, totalsY)
          .fillColor(darkGray)
          .text(`₹${data.invoice.subtotal.toLocaleString()}`, totalsX + 80, totalsY, { align: 'right' });
        totalsY += 20;

        // Discount
        if (data.invoice.discount > 0) {
          doc
            .fillColor(lightGray)
            .text('Discount:', totalsX, totalsY)
            .fillColor(darkGray)
            .text(`-₹${data.invoice.discount.toLocaleString()}`, totalsX + 80, totalsY, { align: 'right' });
          totalsY += 20;
        }

        // Tax
        if (data.invoice.taxAmount > 0) {
          doc
            .fillColor(lightGray)
            .text(`${data.organization.taxName} (${data.organization.taxPercentage}%):`, totalsX, totalsY)
            .fillColor(darkGray)
            .text(`₹${data.invoice.taxAmount.toLocaleString()}`, totalsX + 80, totalsY, { align: 'right' });
          totalsY += 20;
        }

        // Line before total
        doc
          .strokeColor(borderColor)
          .lineWidth(1)
          .moveTo(totalsX, totalsY)
          .lineTo(545, totalsY)
          .stroke();
        totalsY += 15;

        // Total
        doc
          .fontSize(14)
          .fillColor(darkGray)
          .text('Total:', totalsX, totalsY)
          .fontSize(16)
          .fillColor(primaryColor)
          .text(`₹${data.invoice.total.toLocaleString()}`, totalsX + 80, totalsY, { align: 'right' });

        // Notes
        if (data.invoice.notes) {
          totalsY += 50;
          doc
            .fontSize(10)
            .fillColor(lightGray)
            .text('NOTES:', 50, totalsY)
            .fontSize(9)
            .fillColor(darkGray)
            .text(data.invoice.notes, 50, totalsY + 15, { width: 495 });
        }

        // Footer
        const footerY = 750;
        doc
          .fontSize(8)
          .fillColor(lightGray)
          .text('Thank you for your business!', 50, footerY, { align: 'center', width: 495 })
          .text(
            `This invoice was generated on ${format(new Date(), 'MMM dd, yyyy')}`,
            50,
            footerY + 15,
            { align: 'center', width: 495 }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Generate and save invoice PDF to storage
   */
  async generateAndSaveInvoicePDF(
    invoiceId: string,
    organizationId: string
  ): Promise<{ url: string; key: string }> {
    const pdfBuffer = await this.generateInvoicePDF(invoiceId, organizationId);

    // Upload to storage
    const { uploadService } = await import('./upload.service.js');
    const { storageProvider } = await import('../lib/storage.provider.js');

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const key = `${organizationId}/invoices/${invoice.invoiceNumber}.pdf`;

    // Upload directly to storage
    await storageProvider.uploadBuffer(key, pdfBuffer, 'application/pdf');

    // Create file upload record
    const fileUpload = await prisma.fileUpload.create({
      data: {
        organizationId,
        key,
        originalName: `${invoice.invoiceNumber}.pdf`,
        mimeType: 'application/pdf',
        size: pdfBuffer.length,
        category: 'INVOICE_PDF',
        entityType: 'invoice',
        entityId: invoiceId,
        status: 'CONFIRMED',
        isPublic: false,
        uploadedAt: new Date(),
        confirmedAt: new Date(),
      },
    });

    // Get signed URL
    const url = await storageProvider.getPresignedDownloadUrl(key, 3600); // 1 hour

    return { url, key };
  },
};

export default pdfService;
