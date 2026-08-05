import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Invoice, Payment, Prisma } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async findAllInvoices(
    organizationId: string,
    filters?: {
      status?: string;
      type?: string;
      customerId?: string;
      vendorId?: string;
    },
  ): Promise<Invoice[]> {
    const where: Prisma.InvoiceWhereInput = {
      organizationId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.customerId && { customerId: filters.customerId }),
      ...(filters?.vendorId && { vendorId: filters.vendorId }),
    };

    return this.prisma.invoice.findMany({
      where,
      include: {
        salesOrder: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        salesOrder: {
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        customer: true,
        vendor: true,
        payments: {
          include: {
            vendorAccount: true,
          },
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async createInvoice(data: {
    organizationId: string;
    salesOrderId?: string;
    purchaseOrderId?: string;
    customerId?: string;
    vendorId?: string;
    type: string;
    items?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      gstRate: number;
    }>;
    dueDate?: Date;
    notes?: string;
  }): Promise<Invoice> {
    // Calculate totals
    let subtotal = new Prisma.Decimal(0);
    let totalCGST = new Prisma.Decimal(0);
    let totalSGST = new Prisma.Decimal(0);

    for (const item of data.items || []) {
      const itemTotal = new Prisma.Decimal(item.unitPrice).mul(item.quantity);
      subtotal = subtotal.add(itemTotal);

      const gstAmount = itemTotal.mul(item.gstRate).div(100);
      const cgst = gstAmount.div(2);
      const sgst = gstAmount.div(2);

      totalCGST = totalCGST.add(cgst);
      totalSGST = totalSGST.add(sgst);
    }

    const totalTax = totalCGST.add(totalSGST);
    const totalAmount = subtotal.add(totalTax);

    // Generate invoice number
    const invoiceCount = await this.prisma.invoice.count({
      where: { organizationId: data.organizationId },
    });
    const invoiceNumber = `INV-${Date.now()}-${(invoiceCount + 1).toString().padStart(4, '0')}`;

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        organizationId: data.organizationId,
        salesOrderId: data.salesOrderId,
        purchaseOrderId: data.purchaseOrderId,
        customerId: data.customerId,
        vendorId: data.vendorId,
        type: data.type,
        status: 'DRAFT',
        subtotal,
        cgstAmount: totalCGST,
        sgstAmount: totalSGST,
        totalTax,
        totalAmount,
        dueDate: data.dueDate,
        notes: data.notes,
      },
      include: {
        customer: true,
        vendor: true,
        payments: true,
      },
    });
  }

  async updateInvoice(
    id: string,
    data: Prisma.InvoiceUpdateInput,
  ): Promise<Invoice> {
    return this.prisma.invoice.update({
      where: { id },
      data,
      include: {
        customer: true,
        vendor: true,
        payments: true,
      },
    });
  }

  async sendInvoice(id: string): Promise<Invoice> {
    const invoice = await this.findOneInvoice(id);

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Invoice must be in DRAFT status to send');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'SENT',
      },
      include: {
        customer: true,
        vendor: true,
        payments: true,
      },
    });
  }

  async cancelInvoice(id: string, reason?: string): Promise<Invoice> {
    const invoice = await this.findOneInvoice(id);

    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot cancel a paid or cancelled invoice');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${invoice.notes || ''}\nCancellation reason: ${reason}` : invoice.notes,
      },
      include: {
        customer: true,
        vendor: true,
        payments: true,
      },
    });
  }

  async createPayment(invoiceId: string, data: {
    amount: number;
    method: string;
    referenceNumber?: string;
    notes?: string;
    vendorAccountId?: string;
  }): Promise<Payment> {
    const invoice = await this.findOneInvoice(invoiceId);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot add payment to a cancelled invoice');
    }

    if (data.amount <= 0) {
      throw new BadRequestException('Payment amount must be positive');
    }

    // Generate payment number
    const paymentCount = await this.prisma.payment.count();
    const paymentNumber = `PAY-${Date.now()}-${(paymentCount + 1).toString().padStart(4, '0')}`;

    const payment = await this.prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId,
        amount: data.amount,
        method: data.method,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        vendorAccountId: data.vendorAccountId,
      },
      include: {
        invoice: true,
        vendorAccount: true,
      },
    });

    // Update invoice paid amount
    const totalPaid = invoice.payments.reduce(
      (sum: any, p: any) => sum.add(p.amount),
      new Prisma.Decimal(data.amount),
    );

    const newStatus = totalPaid.gte(invoice.totalAmount) ? 'PAID' : 'PARTIAL';

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: totalPaid,
        status: newStatus,
        paidDate: newStatus === 'PAID' ? new Date() : undefined,
      },
    });

    return payment;
  }

  async getFinanceStats(organizationId: string) {
    const totalInvoices = await this.prisma.invoice.count({
      where: { organizationId },
    });

    const byStatus = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
      _sum: {
        totalAmount: true,
      },
    });

    const totalRevenue = await this.prisma.invoice.aggregate({
      where: {
        organizationId,
        type: 'SALES',
        status: { notIn: ['CANCELLED'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalExpenses = await this.prisma.invoice.aggregate({
      where: {
        organizationId,
        type: 'PURCHASE',
        status: { notIn: ['CANCELLED'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const pendingReceivables = await this.prisma.invoice.aggregate({
      where: {
        organizationId,
        type: 'SALES',
        status: { in: ['SENT', 'OVERDUE'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const pendingPayables = await this.prisma.invoice.aggregate({
      where: {
        organizationId,
        type: 'PURCHASE',
        status: { in: ['SENT', 'OVERDUE'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const overdueInvoices = await this.prisma.invoice.count({
      where: {
        organizationId,
        status: 'OVERDUE',
      },
    });

    return {
      total: totalInvoices,
      byStatus,
      totalRevenue: totalRevenue._sum.totalAmount,
      totalExpenses: totalExpenses._sum.totalAmount,
      pendingReceivables: pendingReceivables._sum.totalAmount,
      pendingPayables: pendingPayables._sum.totalAmount,
      overdueCount: overdueInvoices,
    };
  }

  async getOverdueInvoices(organizationId: string) {
    return this.prisma.invoice.findMany({
      where: {
        organizationId,
        status: 'OVERDUE',
      },
      include: {
        customer: true,
        vendor: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  // ─── GST Calculation ──────────────────────────────────────────────────

  /**
   * Calculate GST for an invoice
   */
  calculateGST(
    subtotal: number,
    gstRate: number,
    isInterstate: boolean,
  ): {
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    totalAmount: number;
  } {
    const gstAmount = subtotal * (gstRate / 100);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterstate) {
      // Interstate: IGST only
      igst = gstAmount;
    } else {
      // Intrastate: CGST + SGST
      cgst = gstAmount / 2;
      sgst = gstAmount / 2;
    }

    const totalTax = cgst + sgst + igst;
    const totalAmount = subtotal + totalTax;

    return {
      cgst,
      sgst,
      igst,
      totalTax,
      totalAmount,
    };
  }

  /**
   * Get GST summary for a period
   */
  async getGSTSummary(organizationId: string, startDate: Date, endDate: Date) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { notIn: ['CANCELLED'] },
      },
    });

    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalTaxable = 0;

    for (const invoice of invoices) {
      totalCGST += Number(invoice.cgstAmount);
      totalSGST += Number(invoice.sgstAmount);
      totalIGST += Number(invoice.igstAmount);
      totalTaxable += Number(invoice.subtotal);
    }

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      totalInvoices: invoices.length,
      totalTaxable,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTax: totalCGST + totalSGST + totalIGST,
      summary: {
        interstate: {
          count: invoices.filter((i) => Number(i.igstAmount) > 0).length,
          amount: totalIGST,
        },
        intrastate: {
          count: invoices.filter((i) => Number(i.igstAmount) === 0).length,
          amount: totalCGST + totalSGST,
        },
      },
    };
  }

  // ─── TDS Calculation ──────────────────────────────────────────────────

  /**
   * Calculate TDS for a payment
   */
  calculateTDS(
    amount: number,
    tdsRate: number,
    section: string,
  ): {
    tdsAmount: number;
    netAmount: number;
    section: string;
  } {
    const tdsAmount = amount * (tdsRate / 100);
    const netAmount = amount - tdsAmount;

    return {
      tdsAmount,
      netAmount,
      section,
    };
  }

  /**
   * Get TDS summary for a period
   */
  async getTDSSummary(organizationId: string, startDate: Date, endDate: Date) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        type: 'PURCHASE',
        status: { notIn: ['CANCELLED'] },
      },
    });

    let totalTDS = 0;
    let totalPayable = 0;

    for (const invoice of invoices) {
      totalTDS += Number(invoice.tdsAmount);
      totalPayable += Number(invoice.totalAmount);
    }

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      totalInvoices: invoices.length,
      totalPayable,
      totalTDS,
      netPayable: totalPayable - totalTDS,
      sections: {
        '194C': { description: 'Contractors', rate: 1 },
        '194J': { description: 'Professional Fees', rate: 10 },
        '194I': { description: 'Rent', rate: 10 },
      },
    };
  }

  // ─── Compliance Reports ───────────────────────────────────────────────

  /**
   * Generate GSTR-1 report data
   */
  async getGSTR1Data(organizationId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        type: 'SALES',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        customer: {
          select: {
            gstin: true,
            state: true,
          },
        },
      },
    });

    const b2b = invoices.filter((i) => i.customer?.gstin);
    const b2c = invoices.filter((i) => !i.customer?.gstin);

    return {
      period: `${month}/${year}`,
      totalInvoices: invoices.length,
      b2b: {
        count: b2b.length,
        invoices: b2b.map((i) => ({
          invoiceNumber: i.invoiceNumber,
          customerGstin: i.customer?.gstin,
          taxableAmount: Number(i.subtotal),
          cgst: Number(i.cgstAmount),
          sgst: Number(i.sgstAmount),
          igst: Number(i.igstAmount),
          total: Number(i.totalAmount),
        })),
      },
      b2c: {
        count: b2c.length,
        invoices: b2c.map((i) => ({
          invoiceNumber: i.invoiceNumber,
          taxableAmount: Number(i.subtotal),
          cgst: Number(i.cgstAmount),
          sgst: Number(i.sgstAmount),
          igst: Number(i.igstAmount),
          total: Number(i.totalAmount),
        })),
      },
      totals: {
        taxable: b2b.reduce((sum, i) => sum + Number(i.subtotal), 0) +
                 b2c.reduce((sum, i) => sum + Number(i.subtotal), 0),
        cgst: b2b.reduce((sum, i) => sum + Number(i.cgstAmount), 0) +
              b2c.reduce((sum, i) => sum + Number(i.cgstAmount), 0),
        sgst: b2b.reduce((sum, i) => sum + Number(i.sgstAmount), 0) +
              b2c.reduce((sum, i) => sum + Number(i.sgstAmount), 0),
        igst: b2b.reduce((sum, i) => sum + Number(i.igstAmount), 0) +
              b2c.reduce((sum, i) => sum + Number(i.igstAmount), 0),
      },
    };
  }
}
