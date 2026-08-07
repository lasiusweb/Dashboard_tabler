import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@firstcrop/db'
import { ProcurementService } from './procurement.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('ProcurementService', () => {
  let service: ProcurementService
  let prisma: {
    purchaseOrder: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
      aggregate: ReturnType<typeof vi.fn>
    }
    purchaseOrderItem: {
      update: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
    }
    party: { findMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> }
    rawMaterial: { update: ReturnType<typeof vi.fn> }
    inventoryMovement: { create: ReturnType<typeof vi.fn> }
  }

  beforeEach(() => {
    prisma = {
      purchaseOrder: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
      },
      purchaseOrderItem: { update: vi.fn(), findUnique: vi.fn() },
      party: { findMany: vi.fn(), findUnique: vi.fn() },
      rawMaterial: { update: vi.fn() },
      inventoryMovement: { create: vi.fn() },
    }
    service = new ProcurementService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('builds a flat where clause from filters', async () => {
      prisma.purchaseOrder.findMany.mockResolvedValue([])
      await service.findAll('org-1', { status: 'SUBMITTED', vendorId: 'v-1' })
      const arg = prisma.purchaseOrder.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({ organizationId: 'org-1', status: 'SUBMITTED', vendorId: 'v-1' })
      expect(arg.orderBy).toEqual({ createdAt: 'desc' })
    })
  })

  describe('findOne', () => {
    it('throws NotFoundException when the PO does not exist', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })

    it('returns the PO when found', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue({ id: 'po-1' })
      await expect(service.findOne('po-1')).resolves.toEqual({ id: 'po-1' })
    })
  })

  describe('findByPoNumber', () => {
    it('queries by the PO number', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue(null)
      await service.findByPoNumber('PO-001')
      expect(prisma.purchaseOrder.findUnique).toHaveBeenCalledWith({
        where: { poNumber: 'PO-001' },
        include: { vendor: true, items: true },
      })
    })
  })

  describe('create', () => {
    const validData = {
      organizationId: 'org-1',
      vendorId: 'v-1',
      items: [{ rawMaterialId: 'rm-1', quantity: 10, unit: 'kg', unitPrice: 50, gstRate: 18 }],
    }

    it('throws BadRequestException when the vendor does not exist', async () => {
      prisma.party.findUnique.mockResolvedValue(null)
      await expect(service.create(validData)).rejects.toThrow(BadRequestException)
      expect(prisma.purchaseOrder.create).not.toHaveBeenCalled()
    })

    it('computes totals and creates a DRAFT PO with nested items', async () => {
      prisma.party.findUnique.mockResolvedValue({ id: 'v-1' })
      prisma.purchaseOrder.count.mockResolvedValue(4)
      prisma.purchaseOrder.create.mockImplementation(({ data }: any) => ({ id: 'po-1', ...data }))

      const result = await service.create(validData)

      expect(result.status).toBe('DRAFT')
      expect(result.subtotal.toString()).toBe('500')
      expect(result.gstAmount.toString()).toBe('90')
      expect(result.totalAmount.toString()).toBe('590')
      expect(result.poNumber).toMatch(/^PO-\d+-0005$/)
      const items = prisma.purchaseOrder.create.mock.calls[0][0].data.items.create
      expect(items[0].totalAmount.toString()).toBe('500')
    })
  })

  describe('submit and confirm', () => {
    it('submit requires DRAFT', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue({ id: 'po-1', status: 'SUBMITTED' })
      await expect(service.submit('po-1')).rejects.toThrow(BadRequestException)
      prisma.purchaseOrder.findUnique.mockResolvedValue({ id: 'po-1', status: 'DRAFT' })
      prisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1' })
      await service.submit('po-1')
      expect(prisma.purchaseOrder.update.mock.calls[0][0].data.status).toBe('SUBMITTED')
    })

    it('confirm requires SUBMITTED', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue({ id: 'po-1', status: 'DRAFT' })
      await expect(service.confirm('po-1')).rejects.toThrow(BadRequestException)
      prisma.purchaseOrder.findUnique.mockResolvedValue({ id: 'po-1', status: 'SUBMITTED' })
      prisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1' })
      await service.confirm('po-1')
      expect(prisma.purchaseOrder.update.mock.calls[0][0].data.status).toBe('CONFIRMED')
    })
  })

  describe('receive', () => {
    it('throws BadRequestException when the PO is not in a receivable state', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue({ id: 'po-1', status: 'DRAFT' })
      await expect(service.receive('po-1', [{ itemId: 'poi-1', receivedQuantity: 10 }])).rejects.toThrow(BadRequestException)
    })

    it('updates stock, records a movement, and marks fully received', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValueOnce({ id: 'po-1', organizationId: 'org-1', poNumber: 'PO-001', status: 'CONFIRMED' }).mockResolvedValueOnce({
        id: 'po-1',
        organizationId: 'org-1',
        poNumber: 'PO-001',
        status: 'CONFIRMED',
        items: [
          {
            id: 'poi-1',
            rawMaterialId: 'rm-1',
            quantity: new Prisma.Decimal(10),
            receivedQuantity: new Prisma.Decimal(10),
            unit: 'kg',
          },
        ],
      })
      prisma.purchaseOrderItem.update.mockResolvedValue({ id: 'poi-1' })
      prisma.purchaseOrderItem.findUnique.mockResolvedValue({
        id: 'poi-1',
        rawMaterialId: 'rm-1',
        unit: 'kg',
      })
      prisma.rawMaterial.update.mockResolvedValue({ id: 'rm-1' })
      prisma.inventoryMovement.create.mockResolvedValue({ id: 'm-1' })
      prisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'FULLY_RECEIVED' })

      await service.receive('po-1', [{ itemId: 'poi-1', receivedQuantity: 10 }])

      expect(prisma.rawMaterial.update).toHaveBeenCalledWith({
        where: { id: 'rm-1' },
        data: { currentStock: { increment: 10 } },
      })
      const movement = prisma.inventoryMovement.create.mock.calls[0][0].data
      expect(movement).toMatchObject({ type: 'RECEIPT', rawMaterialId: 'rm-1', referenceType: 'PURCHASE_ORDER', referenceId: 'po-1' })
      expect(prisma.purchaseOrder.update.mock.calls[0][0].data.status).toBe('FULLY_RECEIVED')
    })

    it('marks the PO partially received when quantities are short', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValueOnce({ id: 'po-1', organizationId: 'org-1', poNumber: 'PO-001', status: 'CONFIRMED' }).mockResolvedValueOnce({
        id: 'po-1',
        status: 'CONFIRMED',
        items: [
          {
            id: 'poi-1',
            rawMaterialId: 'rm-1',
            quantity: new Prisma.Decimal(20),
            receivedQuantity: new Prisma.Decimal(5),
            unit: 'kg',
          },
        ],
      })
      prisma.purchaseOrderItem.update.mockResolvedValue({ id: 'poi-1' })
      prisma.purchaseOrderItem.findUnique.mockResolvedValue({ id: 'poi-1', rawMaterialId: 'rm-1', unit: 'kg' })
      prisma.rawMaterial.update.mockResolvedValue({ id: 'rm-1' })
      prisma.inventoryMovement.create.mockResolvedValue({ id: 'm-1' })
      prisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1' })

      await service.receive('po-1', [{ itemId: 'poi-1', receivedQuantity: 5 }])

      expect(prisma.purchaseOrder.update.mock.calls[0][0].data.status).toBe('PARTIALLY_RECEIVED')
    })
  })

  describe('cancel', () => {
    it('throws BadRequestException for a fully received PO', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue({ id: 'po-1', status: 'FULLY_RECEIVED' })
      await expect(service.cancel('po-1')).rejects.toThrow(BadRequestException)
    })

    it('cancels an open PO and appends the reason', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue({ id: 'po-1', status: 'SUBMITTED', notes: null })
      prisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1' })
      await service.cancel('po-1', 'vendor out of stock')
      const arg = prisma.purchaseOrder.update.mock.calls[0][0]
      expect(arg.data.status).toBe('CANCELLED')
      expect(arg.data.notes).toContain('Cancellation reason: vendor out of stock')
    })
  })

  describe('getVendorStats', () => {
    it('rolls up spend and pending orders per vendor', async () => {
      prisma.party.findMany.mockResolvedValue([
        {
          id: 'v-1',
          name: 'Vendor A',
          displayName: 'A',
          purchaseOrders: [
            { id: 'po-1', totalAmount: new Prisma.Decimal(1000), status: 'FULLY_RECEIVED' },
            { id: 'po-2', totalAmount: new Prisma.Decimal(500), status: 'SUBMITTED' },
          ],
        },
      ])

      const stats = await service.getVendorStats('org-1')

      expect(stats).toEqual([{ id: 'v-1', name: 'Vendor A', displayName: 'A', totalOrders: 2, totalSpent: 1500, pendingOrders: 1 }])
    })
  })

  describe('getProcurementStats', () => {
    it('aggregates PO counts, spend, and pending payment', async () => {
      prisma.purchaseOrder.count.mockResolvedValue(6)
      prisma.purchaseOrder.groupBy.mockResolvedValue([{ status: 'CONFIRMED', _count: 3, _sum: { totalAmount: 1500 } }])
      prisma.purchaseOrder.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 3000 } })
      prisma.purchaseOrder.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 900 } })

      const stats = await service.getProcurementStats('org-1')

      expect(stats.total).toBe(6)
      expect(stats.byStatus).toEqual([{ status: 'CONFIRMED', _count: 3, _sum: { totalAmount: 1500 } }])
      expect(stats.totalSpent).toBe(3000)
      expect(stats.pendingPayment).toBe(900)
    })
  })
})
