import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@firstcrop/db'
import { OrdersService } from './orders.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('OrdersService', () => {
  let service: OrdersService
  let prisma: {
    salesOrder: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
      aggregate: ReturnType<typeof vi.fn>
    }
    party: { findMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> }
    product: { findMany: ReturnType<typeof vi.fn> }
  }

  beforeEach(() => {
    prisma = {
      salesOrder: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
      },
      party: { findMany: vi.fn(), findUnique: vi.fn() },
      product: { findMany: vi.fn() },
    }
    service = new OrdersService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('builds a flat where clause from filters', async () => {
      prisma.salesOrder.findMany.mockResolvedValue([])
      await service.findAll('org-1', { status: 'CONFIRMED', customerId: 'c-1', orderType: 'DISTRIBUTOR' })
      const arg = prisma.salesOrder.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({
        organizationId: 'org-1',
        status: 'CONFIRMED',
        customerId: 'c-1',
        orderType: 'DISTRIBUTOR',
      })
      expect(arg.orderBy).toEqual({ createdAt: 'desc' })
    })
  })

  describe('findOne', () => {
    it('throws NotFoundException when the order does not exist', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })

    it('returns the order when found', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1' })
      await expect(service.findOne('so-1')).resolves.toEqual({ id: 'so-1' })
    })
  })

  describe('findByOrderNumber', () => {
    it('queries by the order number', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(null)
      await service.findByOrderNumber('SO-001')
      expect(prisma.salesOrder.findUnique).toHaveBeenCalledWith({
        where: { orderNumber: 'SO-001' },
        include: { customer: true, items: true },
      })
    })
  })

  describe('create', () => {
    const validData = {
      organizationId: 'org-1',
      customerId: 'c-1',
      items: [
        { productId: 'p-1', quantity: 2, unit: 'kg', unitPrice: 100 },
        { productId: 'p-2', quantity: 1, unit: 'l', unitPrice: 50, discount: 10, gstRate: 5 },
      ],
    }

    it('throws BadRequestException when the customer does not exist', async () => {
      prisma.party.findUnique.mockResolvedValue(null)
      await expect(service.create(validData)).rejects.toThrow(BadRequestException)
      expect(prisma.salesOrder.create).not.toHaveBeenCalled()
    })

    it('uses the product GST rate when the item does not provide one', async () => {
      prisma.party.findUnique.mockResolvedValue({ id: 'c-1' })
      prisma.product.findMany.mockResolvedValue([{ id: 'p-1', gstRate: new Prisma.Decimal(12) }])
      prisma.salesOrder.count.mockResolvedValue(0)
      prisma.salesOrder.create.mockImplementation(({ data }: any) => ({ id: 'so-1', ...data }))

      const result = await service.create(validData)

      expect(result.subtotal.toString()).toBe('240')
      expect(result.gstAmount.toString()).toBe('26')
      expect(result.totalAmount.toString()).toBe('266')
      expect(result.orderType).toBe('DISTRIBUTOR')
      expect(result.status).toBe('PLACED')
      expect(result.orderNumber).toMatch(/^SO-\d+-0001$/)
    })

    it('defaults the GST rate to 18% when unavailable', async () => {
      prisma.party.findUnique.mockResolvedValue({ id: 'c-1' })
      prisma.product.findMany.mockResolvedValue([])
      prisma.salesOrder.count.mockResolvedValue(0)
      prisma.salesOrder.create.mockImplementation(({ data }: any) => ({ id: 'so-1', ...data }))
      const result = await service.create({
        organizationId: 'org-1',
        customerId: 'c-1',
        items: [
          { productId: 'p-1', quantity: 2, unit: 'kg', unitPrice: 100 },
          { productId: 'p-2', quantity: 1, unit: 'l', unitPrice: 50, discount: 10 },
        ],
      })
      expect(result.gstAmount.toString()).toBe('43.2')
    })
  })

  describe('status transitions', () => {
    it('confirm requires PLACED', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'CONFIRMED' })
      await expect(service.confirm('so-1')).rejects.toThrow(BadRequestException)
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'PLACED' })
      prisma.salesOrder.update.mockResolvedValue({ id: 'so-1' })
      await service.confirm('so-1')
      expect(prisma.salesOrder.update.mock.calls[0][0].data.status).toBe('CONFIRMED')
    })

    it('startProduction requires CONFIRMED', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'PLACED' })
      await expect(service.startProduction('so-1')).rejects.toThrow(BadRequestException)
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'CONFIRMED' })
      prisma.salesOrder.update.mockResolvedValue({ id: 'so-1' })
      await service.startProduction('so-1')
      expect(prisma.salesOrder.update.mock.calls[0][0].data.status).toBe('IN_PRODUCTION')
    })

    it('readyForDispatch requires IN_PRODUCTION', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'CONFIRMED' })
      await expect(service.readyForDispatch('so-1')).rejects.toThrow(BadRequestException)
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'IN_PRODUCTION' })
      prisma.salesOrder.update.mockResolvedValue({ id: 'so-1' })
      await service.readyForDispatch('so-1')
      expect(prisma.salesOrder.update.mock.calls[0][0].data.status).toBe('READY_FOR_DISPATCH')
    })

    it('dispatch requires READY_FOR_DISPATCH', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'IN_PRODUCTION' })
      await expect(service.dispatch('so-1')).rejects.toThrow(BadRequestException)
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'READY_FOR_DISPATCH' })
      prisma.salesOrder.update.mockResolvedValue({ id: 'so-1' })
      await service.dispatch('so-1')
      const arg = prisma.salesOrder.update.mock.calls[0][0]
      expect(arg.data).toMatchObject({ status: 'FULLY_SHIPPED', dispatchedAt: expect.any(Date) })
    })

    it('deliver requires FULLY_SHIPPED', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'CONFIRMED' })
      await expect(service.deliver('so-1')).rejects.toThrow(BadRequestException)
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'FULLY_SHIPPED' })
      prisma.salesOrder.update.mockResolvedValue({ id: 'so-1' })
      await service.deliver('so-1')
      const arg = prisma.salesOrder.update.mock.calls[0][0]
      expect(arg.data).toMatchObject({ status: 'DELIVERED', deliveredAt: expect.any(Date) })
    })
  })

  describe('cancel', () => {
    it('throws BadRequestException for a delivered order', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'DELIVERED' })
      await expect(service.cancel('so-1')).rejects.toThrow(BadRequestException)
    })

    it('cancels an open order and appends the reason', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'CONFIRMED', notes: 'original' })
      prisma.salesOrder.update.mockResolvedValue({ id: 'so-1' })
      await service.cancel('so-1', 'buyer cancelled')
      const arg = prisma.salesOrder.update.mock.calls[0][0]
      expect(arg.data.status).toBe('CANCELLED')
      expect(arg.data.notes).toContain('Cancellation reason: buyer cancelled')
    })
  })

  describe('getOrderStats', () => {
    it('aggregates counts, revenue, and pending payment', async () => {
      prisma.salesOrder.count.mockResolvedValue(8)
      prisma.salesOrder.groupBy.mockResolvedValueOnce([{ status: 'DELIVERED', _count: 5, _sum: { totalAmount: 5000 } }])
      prisma.salesOrder.groupBy.mockResolvedValueOnce([{ orderType: 'DISTRIBUTOR', _count: 8, _sum: { totalAmount: 6000 } }])
      prisma.salesOrder.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 6000 } })
      prisma.salesOrder.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 1500 } })

      const stats = await service.getOrderStats('org-1')

      expect(stats.total).toBe(8)
      expect(stats.byStatus).toEqual([{ status: 'DELIVERED', _count: 5, _sum: { totalAmount: 5000 } }])
      expect(stats.byOrderType).toEqual([{ orderType: 'DISTRIBUTOR', _count: 8, _sum: { totalAmount: 6000 } }])
      expect(stats.totalRevenue).toBe(6000)
      expect(stats.pendingPayment).toBe(1500)
    })
  })

  describe('getCustomers', () => {
    it('joins order counts and revenue onto each customer', async () => {
      prisma.party.findMany.mockResolvedValue([
        { id: 'c-1', name: 'Farmer A', displayName: 'A', gstin: null, city: 'Lko', state: 'UP' },
        { id: 'c-2', name: 'Farmer B', displayName: 'B', gstin: null, city: 'Lko', state: 'UP' },
      ])
      prisma.salesOrder.groupBy.mockResolvedValue([{ customerId: 'c-1', _count: 3, _sum: { totalAmount: 900 } }])

      const customers = await service.getCustomers('org-1')

      expect(customers[0]).toMatchObject({ id: 'c-1', orderCount: 3, revenue: 900 })
      expect(customers[1]).toMatchObject({ id: 'c-2', orderCount: 0, revenue: null })
    })
  })
})
