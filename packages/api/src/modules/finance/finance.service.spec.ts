import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@firstcrop/db'
import { FinanceService } from './finance.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('FinanceService', () => {
  let service: FinanceService
  let prisma: {
    invoice: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
      aggregate: ReturnType<typeof vi.fn>
    }
    payment: { count: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
  }

  beforeEach(() => {
    prisma = {
      invoice: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
      },
      payment: { count: vi.fn(), create: vi.fn() },
    }
    service = new FinanceService(prisma as unknown as PrismaService)
  })

  describe('findAllInvoices', () => {
    it('builds a flat where clause from filters', async () => {
      prisma.invoice.findMany.mockResolvedValue([])
      await service.findAllInvoices('org-1', { status: 'SENT', type: 'SALES', customerId: 'c-1' })
      const arg = prisma.invoice.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({
        organizationId: 'org-1',
        status: 'SENT',
        type: 'SALES',
        customerId: 'c-1',
      })
      expect(arg.orderBy).toEqual({ createdAt: 'desc' })
    })
  })

  describe('findOneInvoice', () => {
    it('throws NotFoundException when the invoice does not exist', async () => {
      prisma.invoice.findUnique.mockResolvedValue(null)
      await expect(service.findOneInvoice('missing')).rejects.toThrow(NotFoundException)
    })

    it('returns the invoice when found', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: 'inv-1' })
      await expect(service.findOneInvoice('inv-1')).resolves.toEqual({ id: 'inv-1' })
    })
  })

  describe('createInvoice', () => {
    it('computes subtotal and split CGST/SGST from item GST', async () => {
      prisma.invoice.count.mockResolvedValue(0)
      prisma.invoice.create.mockImplementation(({ data }: any) => ({ id: 'inv-1', ...data }))

      const result = await service.createInvoice({
        organizationId: 'org-1',
        customerId: 'c-1',
        type: 'SALES',
        items: [
          { description: 'Bio fertilizer', quantity: 2, unitPrice: 100, gstRate: 18 },
          { description: 'Bio pesticide', quantity: 1, unitPrice: 50, gstRate: 5 },
        ],
      })

      expect(result.subtotal.toString()).toBe('250')
      expect(result.cgstAmount.toString()).toBe('19.25')
      expect(result.sgstAmount.toString()).toBe('19.25')
      expect(result.totalTax.toString()).toBe('38.5')
      expect(result.totalAmount.toString()).toBe('288.5')
      expect(result.status).toBe('DRAFT')
      expect(result.invoiceNumber).toMatch(/^INV-\d+-0001$/)
    })

    it('generates a padded invoice number from the count', async () => {
      prisma.invoice.count.mockResolvedValue(12)
      prisma.invoice.create.mockImplementation(({ data }: any) => ({ id: 'inv-1', ...data }))
      const result = await service.createInvoice({ organizationId: 'org-1', type: 'SALES' })
      expect(result.invoiceNumber).toMatch(/^INV-\d+-0013$/)
    })
  })

  describe('sendInvoice', () => {
    it('throws BadRequestException when the invoice is not DRAFT', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: 'inv-1', status: 'SENT' })
      await expect(service.sendInvoice('inv-1')).rejects.toThrow(BadRequestException)
    })

    it('moves a DRAFT invoice to SENT', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: 'inv-1', status: 'DRAFT' })
      prisma.invoice.update.mockResolvedValue({ id: 'inv-1' })
      await service.sendInvoice('inv-1')
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: 'SENT' },
        include: { customer: true, vendor: true, payments: true },
      })
    })
  })

  describe('cancelInvoice', () => {
    it('throws BadRequestException for a paid invoice', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: 'inv-1', status: 'PAID' })
      await expect(service.cancelInvoice('inv-1')).rejects.toThrow(BadRequestException)
    })

    it('appends the cancellation reason to notes', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: 'inv-1', status: 'SENT', notes: 'original' })
      prisma.invoice.update.mockResolvedValue({ id: 'inv-1' })
      await service.cancelInvoice('inv-1', 'customer request')
      const arg = prisma.invoice.update.mock.calls[0][0]
      expect(arg.data.status).toBe('CANCELLED')
      expect(arg.data.notes).toContain('Cancellation reason: customer request')
    })
  })

  describe('createPayment', () => {
    it('throws BadRequestException for a cancelled invoice', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: 'inv-1', status: 'CANCELLED', payments: [] })
      await expect(service.createPayment('inv-1', { amount: 100, method: 'UPI' })).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException for a non-positive amount', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: 'inv-1', status: 'SENT', payments: [] })
      await expect(service.createPayment('inv-1', { amount: 0, method: 'UPI' })).rejects.toThrow(BadRequestException)
    })

    it('marks the invoice PAID when the total covers the amount', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        status: 'SENT',
        totalAmount: new Prisma.Decimal(1000),
        payments: [{ amount: new Prisma.Decimal(400) }],
      })
      prisma.payment.count.mockResolvedValue(0)
      prisma.payment.create.mockImplementation(({ data }: any) => ({ id: 'pay-1', ...data }))
      prisma.invoice.update.mockResolvedValue({ id: 'inv-1' })

      await service.createPayment('inv-1', { amount: 600, method: 'UPI' })

      const arg = prisma.invoice.update.mock.calls[0][0]
      expect(arg.data.status).toBe('PAID')
      expect(arg.data.paidAmount.toString()).toBe('1000')
      expect(arg.data.paidDate).toBeInstanceOf(Date)
    })

    it('marks the invoice PARTIAL when partially covered', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        status: 'SENT',
        totalAmount: new Prisma.Decimal(1000),
        payments: [],
      })
      prisma.payment.count.mockResolvedValue(0)
      prisma.payment.create.mockResolvedValue({ id: 'pay-1' })
      prisma.invoice.update.mockResolvedValue({ id: 'inv-1' })

      await service.createPayment('inv-1', { amount: 200, method: 'UPI' })

      const arg = prisma.invoice.update.mock.calls[0][0]
      expect(arg.data.status).toBe('PARTIAL')
      expect(arg.data.paidDate).toBeUndefined()
    })
  })

  describe('getFinanceStats', () => {
    it('aggregates revenue, expenses, and pending balances', async () => {
      prisma.invoice.count.mockResolvedValueOnce(10)
      prisma.invoice.groupBy.mockResolvedValue([{ status: 'SENT', _count: 2, _sum: { totalAmount: 500 } }])
      prisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 5000 } })
      prisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 2000 } })
      prisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 800 } })
      prisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 300 } })
      prisma.invoice.count.mockResolvedValueOnce(1)

      const stats = await service.getFinanceStats('org-1')

      expect(stats.total).toBe(10)
      expect(stats.byStatus).toEqual([{ status: 'SENT', _count: 2, _sum: { totalAmount: 500 } }])
      expect(stats.totalRevenue).toBe(5000)
      expect(stats.totalExpenses).toBe(2000)
      expect(stats.pendingReceivables).toBe(800)
      expect(stats.pendingPayables).toBe(300)
      expect(stats.overdueCount).toBe(1)
    })
  })

  describe('calculateGST', () => {
    it('splits intrastate tax into CGST and SGST', () => {
      const result = service.calculateGST(1000, 18, false)
      expect(result).toEqual({
        cgst: 90,
        sgst: 90,
        igst: 0,
        totalTax: 180,
        totalAmount: 1180,
      })
    })

    it('charges only IGST for interstate sales', () => {
      const result = service.calculateGST(1000, 18, true)
      expect(result.igst).toBe(180)
      expect(result.cgst).toBe(0)
      expect(result.sgst).toBe(0)
      expect(result.totalAmount).toBe(1180)
    })
  })

  describe('getGSTSummary', () => {
    it('totals tax by type and splits interstate vs intrastate', async () => {
      prisma.invoice.findMany.mockResolvedValue([
        { igstAmount: new Prisma.Decimal(180), cgstAmount: new Prisma.Decimal(0), sgstAmount: new Prisma.Decimal(0), subtotal: new Prisma.Decimal(1000) },
        { igstAmount: new Prisma.Decimal(0), cgstAmount: new Prisma.Decimal(90), sgstAmount: new Prisma.Decimal(90), subtotal: new Prisma.Decimal(1000) },
      ])

      const summary = await service.getGSTSummary('org-1', new Date('2026-01-01'), new Date('2026-01-31'))

      expect(summary.totalInvoices).toBe(2)
      expect(summary.totalIGST).toBe(180)
      expect(summary.totalCGST).toBe(90)
      expect(summary.totalSGST).toBe(90)
      expect(summary.summary.interstate).toEqual({ count: 1, amount: 180 })
      expect(summary.summary.intrastate).toEqual({ count: 1, amount: 180 })
    })
  })

  describe('calculateTDS', () => {
    it('computes TDS and net amount', () => {
      const result = service.calculateTDS(10000, 10, '194J')
      expect(result).toEqual({ tdsAmount: 1000, netAmount: 9000, section: '194J' })
    })
  })

  describe('getTDSSummary', () => {
    it('aggregates TDS from purchase invoices', async () => {
      prisma.invoice.findMany.mockResolvedValue([
        { tdsAmount: new Prisma.Decimal(100), totalAmount: new Prisma.Decimal(1000) },
        { tdsAmount: new Prisma.Decimal(50), totalAmount: new Prisma.Decimal(500) },
      ])

      const summary = await service.getTDSSummary('org-1', new Date('2026-01-01'), new Date('2026-01-31'))

      expect(summary.totalInvoices).toBe(2)
      expect(summary.totalPayable).toBe(1500)
      expect(summary.totalTDS).toBe(150)
      expect(summary.netPayable).toBe(1350)
      expect(summary.sections['194C']).toBeDefined()
    })
  })

  describe('getGSTR1Data', () => {
    it('splits B2B and B2C invoices by GSTIN presence', async () => {
      prisma.invoice.findMany.mockResolvedValue([
        { invoiceNumber: 'INV-1', customer: { gstin: '27AAAAA1234A1Z5' }, subtotal: new Prisma.Decimal(1000), cgstAmount: new Prisma.Decimal(90), sgstAmount: new Prisma.Decimal(90), igstAmount: new Prisma.Decimal(0), totalAmount: new Prisma.Decimal(1180) },
        { invoiceNumber: 'INV-2', customer: { gstin: null }, subtotal: new Prisma.Decimal(500), cgstAmount: new Prisma.Decimal(45), sgstAmount: new Prisma.Decimal(45), igstAmount: new Prisma.Decimal(0), totalAmount: new Prisma.Decimal(590) },
      ])

      const report = await service.getGSTR1Data('org-1', 6, 2026)

      expect(report.period).toBe('6/2026')
      expect(report.b2b.count).toBe(1)
      expect(report.b2c.count).toBe(1)
      expect(report.b2b.invoices[0].customerGstin).toBe('27AAAAA1234A1Z5')
      expect(report.totals.taxable).toBe(1500)
      expect(report.totals.cgst).toBe(135)
    })
  })
})
