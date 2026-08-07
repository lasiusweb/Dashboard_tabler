import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@firstcrop/db'
import { RawMaterialsService } from './raw-materials.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('RawMaterialsService', () => {
  let service: RawMaterialsService
  let prisma: {
    rawMaterial: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
      aggregate: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    prisma = {
      rawMaterial: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
      },
    }
    service = new RawMaterialsService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('builds a flat where clause from filters', async () => {
      prisma.rawMaterial.findMany.mockResolvedValue([])
      await service.findAll('org-1', { category: 'STRAIN' })
      const arg = prisma.rawMaterial.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({ organizationId: 'org-1', category: 'STRAIN' })
      expect(arg.orderBy).toEqual({ createdAt: 'desc' })
    })

    it('searches across name and code', async () => {
      prisma.rawMaterial.findMany.mockResolvedValue([])
      await service.findAll('org-1', { search: 'media' })
      const arg = prisma.rawMaterial.findMany.mock.calls[0][0]
      expect(arg.where.OR).toEqual([{ name: { contains: 'media', mode: 'insensitive' } }, { code: { contains: 'media', mode: 'insensitive' } }])
    })
  })

  describe('findOne', () => {
    it('throws NotFoundException when the material does not exist', async () => {
      prisma.rawMaterial.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })

    it('returns the material when found', async () => {
      prisma.rawMaterial.findUnique.mockResolvedValue({ id: 'rm-1' })
      await expect(service.findOne('rm-1')).resolves.toEqual({ id: 'rm-1' })
      expect(prisma.rawMaterial.findUnique).toHaveBeenCalledWith({
        where: { id: 'rm-1' },
        include: { batchIngredients: true, inventory: true },
      })
    })
  })

  describe('create', () => {
    it('throws BadRequestException when the code already exists', async () => {
      prisma.rawMaterial.findUnique.mockResolvedValue({ id: 'existing' })
      await expect(service.create({ code: 'RM-001', organization: { connect: { id: 'org-1' } } } as any)).rejects.toThrow(BadRequestException)
      expect(prisma.rawMaterial.create).not.toHaveBeenCalled()
    })

    it('creates a material with a fresh code', async () => {
      prisma.rawMaterial.findUnique.mockResolvedValue(null)
      prisma.rawMaterial.create.mockResolvedValue({ id: 'rm-1' })
      const data = { code: 'RM-001', name: 'Media X', organization: { connect: { id: 'org-1' } } }
      await service.create(data as any)
      expect(prisma.rawMaterial.create).toHaveBeenCalledWith({ data })
    })
  })

  describe('update', () => {
    it('throws NotFoundException when the material does not exist', async () => {
      prisma.rawMaterial.findUnique.mockResolvedValue(null)
      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException)
    })

    it('updates an existing material', async () => {
      prisma.rawMaterial.findUnique.mockResolvedValue({ id: 'rm-1' })
      prisma.rawMaterial.update.mockResolvedValue({ id: 'rm-1' })
      await service.update('rm-1', { name: 'Renamed' })
      expect(prisma.rawMaterial.update).toHaveBeenCalledWith({ where: { id: 'rm-1' }, data: { name: 'Renamed' } })
    })
  })

  describe('remove', () => {
    it('throws NotFoundException when the material does not exist', async () => {
      prisma.rawMaterial.findUnique.mockResolvedValue(null)
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException)
    })

    it('throws BadRequestException when the material has dependencies', async () => {
      prisma.rawMaterial.findUnique.mockResolvedValue({
        id: 'rm-1',
        batchIngredients: [{ id: 'bi-1' }],
        inventory: [],
        purchaseOrderItems: [],
        inventoryMovements: [],
      })
      await expect(service.remove('rm-1')).rejects.toThrow(BadRequestException)
      expect(prisma.rawMaterial.delete).not.toHaveBeenCalled()
    })

    it('deletes a material without dependencies', async () => {
      prisma.rawMaterial.findUnique.mockResolvedValue({
        id: 'rm-1',
        batchIngredients: [],
        inventory: [],
        purchaseOrderItems: [],
        inventoryMovements: [],
      })
      prisma.rawMaterial.delete.mockResolvedValue({ id: 'rm-1' })
      await expect(service.remove('rm-1')).resolves.toEqual({ id: 'rm-1' })
      expect(prisma.rawMaterial.delete).toHaveBeenCalledWith({ where: { id: 'rm-1' } })
    })
  })

  describe('getStats', () => {
    it('aggregates counts, categories, and stock value', async () => {
      prisma.rawMaterial.count.mockResolvedValue(5)
      prisma.rawMaterial.groupBy.mockResolvedValue([{ category: 'STRAIN', _count: 3 }])
      prisma.rawMaterial.aggregate.mockResolvedValue({ _sum: { currentStock: 120 } })

      await expect(service.getStats('org-1')).resolves.toEqual({
        total: 5,
        byCategory: [{ category: 'STRAIN', _count: 3 }],
        totalStockValue: 120,
      })
    })
  })

  describe('getLowStock', () => {
    it('filters active materials at or below their reorder level', async () => {
      prisma.rawMaterial.findMany.mockResolvedValue([
        { id: 'rm-1', currentStock: new Prisma.Decimal(5), reorderLevel: new Prisma.Decimal(10) },
        { id: 'rm-2', currentStock: new Prisma.Decimal(20), reorderLevel: new Prisma.Decimal(10) },
      ])
      const lowStock = await service.getLowStock('org-1')
      expect(lowStock.map((m: any) => m.id)).toEqual(['rm-1'])
    })
  })
})
