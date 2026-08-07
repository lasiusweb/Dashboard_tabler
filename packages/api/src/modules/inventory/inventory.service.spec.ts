import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@firstcrop/db'
import { InventoryService } from './inventory.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('InventoryService', () => {
  let service: InventoryService
  let prisma: {
    inventory: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      findFirst: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      aggregate: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
    }
    inventoryMovement: { findMany: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
    inventoryLocation: {
      findUnique: ReturnType<typeof vi.fn>
      findMany: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
    }
    rawMaterial: {
      findMany: ReturnType<typeof vi.fn>
      fields: { reorderLevel: string }
    }
  }

  beforeEach(() => {
    prisma = {
      inventory: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
      },
      inventoryMovement: { findMany: vi.fn(), create: vi.fn() },
      inventoryLocation: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
      rawMaterial: {
        findMany: vi.fn(),
        fields: { reorderLevel: 'reorderLevel' },
      },
    }
    service = new InventoryService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('builds a flat where clause from filters', async () => {
      prisma.inventory.findMany.mockResolvedValue([])
      await service.findAll('org-1', { locationId: 'loc-1', productId: 'p-1' })
      const arg = prisma.inventory.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({ organizationId: 'org-1', locationId: 'loc-1', productId: 'p-1' })
      expect(arg.orderBy).toEqual({ lastUpdated: 'desc' })
    })
  })

  describe('findOne', () => {
    it('throws NotFoundException when the item does not exist', async () => {
      prisma.inventory.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })

    it('returns the item when found', async () => {
      prisma.inventory.findUnique.mockResolvedValue({ id: 'i-1' })
      await expect(service.findOne('i-1')).resolves.toEqual({ id: 'i-1' })
    })
  })

  describe('getMovements', () => {
    it('scopes by date range when both dates are given', async () => {
      prisma.inventoryMovement.findMany.mockResolvedValue([])
      const start = new Date('2026-01-01')
      const end = new Date('2026-01-31')
      await service.getMovements('org-1', { type: 'RECEIPT', startDate: start, endDate: end })
      const arg = prisma.inventoryMovement.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({
        organizationId: 'org-1',
        type: 'RECEIPT',
        performedAt: { gte: start, lte: end },
      })
    })

    it('omits the date range when only one bound is given', async () => {
      prisma.inventoryMovement.findMany.mockResolvedValue([])
      await service.getMovements('org-1', { startDate: new Date('2026-01-01') })
      const arg = prisma.inventoryMovement.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({ organizationId: 'org-1' })
    })
  })

  describe('createMovement', () => {
    const baseData = {
      organizationId: 'org-1',
      type: 'TRANSFER',
      productId: 'p-1',
      quantity: 10,
      unit: 'kg',
    }

    it('throws BadRequestException when the from location is missing', async () => {
      prisma.inventoryLocation.findUnique.mockResolvedValue(null)
      await expect(service.createMovement({ ...baseData, fromLocationId: 'loc-a' })).rejects.toThrow(BadRequestException)
      expect(prisma.inventoryMovement.create).not.toHaveBeenCalled()
    })

    it('throws BadRequestException when the to location is missing', async () => {
      prisma.inventoryLocation.findUnique.mockResolvedValueOnce({ id: 'loc-a' })
      prisma.inventoryLocation.findUnique.mockResolvedValueOnce(null)
      await expect(service.createMovement({ ...baseData, fromLocationId: 'loc-a', toLocationId: 'loc-b' })).rejects.toThrow(BadRequestException)
    })

    it('creates the movement and adjusts quantities between locations', async () => {
      prisma.inventoryLocation.findUnique.mockResolvedValue({ id: 'loc' })
      prisma.inventoryMovement.create.mockResolvedValue({ id: 'm-1' })
      prisma.inventory.findFirst.mockResolvedValueOnce({ id: 'inv-a', quantity: new Prisma.Decimal(100) })
      prisma.inventory.findFirst.mockResolvedValueOnce({ id: 'inv-b', quantity: new Prisma.Decimal(5) })
      prisma.inventory.update.mockResolvedValue({ id: 'inv' })

      await service.createMovement({
        ...baseData,
        fromLocationId: 'loc-a',
        toLocationId: 'loc-b',
      })

      expect(prisma.inventoryMovement.create).toHaveBeenCalled()
      expect(prisma.inventory.update).toHaveBeenCalledTimes(2)
      const firstUpdate = prisma.inventory.update.mock.calls[0][0]
      const secondUpdate = prisma.inventory.update.mock.calls[1][0]
      expect(firstUpdate.data.quantity.toString()).toBe('90')
      expect(secondUpdate.data.quantity.toString()).toBe('15')
    })

    it('throws BadRequestException when a decrease would go negative', async () => {
      prisma.inventoryLocation.findUnique.mockResolvedValue({ id: 'loc' })
      prisma.inventoryMovement.create.mockResolvedValue({ id: 'm-1' })
      prisma.inventory.findFirst.mockResolvedValue({ id: 'inv-a', quantity: new Prisma.Decimal(5) })

      await expect(service.createMovement({ ...baseData, fromLocationId: 'loc-a', quantity: 10 })).rejects.toThrow(BadRequestException)
    })

    it('creates a new inventory record when none exists and quantity is positive', async () => {
      prisma.inventoryLocation.findUnique.mockResolvedValue({ id: 'loc' })
      prisma.inventoryMovement.create.mockResolvedValue({ id: 'm-1' })
      prisma.inventory.findFirst.mockResolvedValue(null)
      prisma.inventory.create.mockResolvedValue({ id: 'inv-new' })

      await service.createMovement({ ...baseData, toLocationId: 'loc-b' })

      expect(prisma.inventory.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          locationId: 'loc-b',
          productId: 'p-1',
          rawMaterialId: undefined,
          batchNumber: undefined,
          quantity: 10,
          unit: 'kg',
        },
      })
    })
  })

  describe('getLowStockItems', () => {
    it('returns raw materials at or below their reorder level', async () => {
      prisma.rawMaterial.findMany.mockResolvedValue([{ id: 'rm-1' }])
      await service.getLowStockItems('org-1')
      const arg = prisma.rawMaterial.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({
        isActive: true,
        currentStock: { lte: prisma.rawMaterial.fields.reorderLevel },
      })
    })
  })

  describe('getInventoryStats', () => {
    it('aggregates totals, locations, and expiring items', async () => {
      prisma.inventory.count.mockResolvedValue(3)
      prisma.inventory.aggregate.mockResolvedValue({ _sum: { quantity: 250 } })
      prisma.inventory.groupBy.mockResolvedValue([{ locationId: 'loc-1', _count: 3, _sum: { quantity: 250 } }])
      prisma.inventory.findMany.mockResolvedValue([{ id: 'i-1' }])

      const stats = await service.getInventoryStats('org-1')

      expect(stats.total).toBe(3)
      expect(stats.totalQuantity).toBe(250)
      expect(stats.byLocation).toEqual([{ locationId: 'loc-1', _count: 3, _sum: { quantity: 250 } }])
      expect(stats.expiringCount).toBe(1)
    })
  })

  describe('getLocations', () => {
    it('includes inventory counts ordered by name', async () => {
      prisma.inventoryLocation.findMany.mockResolvedValue([])
      await service.getLocations('org-1')
      expect(prisma.inventoryLocation.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: { _count: { select: { inventory: true } } },
        orderBy: { name: 'asc' },
      })
    })
  })

  describe('createLocation', () => {
    it('creates a location with temperature control defaulted to false', async () => {
      prisma.inventoryLocation.create.mockImplementation(({ data }: any) => ({ id: 'loc-1', ...data }))
      const result = await service.createLocation({ organizationId: 'org-1', name: 'Cold Store', type: 'COLD_STORAGE' })
      expect(result).toMatchObject({ id: 'loc-1', temperatureControlled: false })
    })
  })
})
