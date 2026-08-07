import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { ProductsService } from './products.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('ProductsService', () => {
  let service: ProductsService
  let prisma: {
    product: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    prisma = {
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
    }
    service = new ProductsService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('builds a flat where clause from filters', async () => {
      prisma.product.findMany.mockResolvedValue([])
      await service.findAll('org-1', { category: 'BIO_FERTILIZER', isActive: true })
      const arg = prisma.product.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({ organizationId: 'org-1', category: 'BIO_FERTILIZER', isActive: true })
      expect(arg.orderBy).toEqual({ createdAt: 'desc' })
    })

    it('searches across name, sku, and strain', async () => {
      prisma.product.findMany.mockResolvedValue([])
      await service.findAll('org-1', { search: 'azotobacter' })
      const arg = prisma.product.findMany.mock.calls[0][0]
      expect(arg.where.OR).toEqual([{ name: { contains: 'azotobacter', mode: 'insensitive' } }, { sku: { contains: 'azotobacter', mode: 'insensitive' } }, { strainName: { contains: 'azotobacter', mode: 'insensitive' } }])
    })
  })

  describe('findOne', () => {
    it('throws NotFoundException when the product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })

    it('returns the product when found', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p-1' })
      await expect(service.findOne('p-1')).resolves.toEqual({ id: 'p-1' })
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        include: { batches: { orderBy: { createdAt: 'desc' }, take: 10 }, inventory: true },
      })
    })
  })

  describe('findBySku', () => {
    it('queries by sku', async () => {
      prisma.product.findUnique.mockResolvedValue(null)
      await service.findBySku('SKU-001')
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { sku: 'SKU-001' } })
    })
  })

  describe('create, update, delete', () => {
    it('creates a product with the given data', async () => {
      prisma.product.create.mockResolvedValue({ id: 'p-1' })
      await service.create({ name: 'BioFert A', sku: 'BF-A', organization: { connect: { id: 'org-1' } } } as any)
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: { name: 'BioFert A', sku: 'BF-A', organization: { connect: { id: 'org-1' } } },
      })
    })

    it('updates a product', async () => {
      prisma.product.update.mockResolvedValue({ id: 'p-1' })
      await service.update('p-1', { name: 'Renamed' })
      expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p-1' }, data: { name: 'Renamed' } })
    })

    it('deletes a product', async () => {
      prisma.product.delete.mockResolvedValue({ id: 'p-1' })
      await expect(service.delete('p-1')).resolves.toBeUndefined()
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } })
    })
  })

  describe('getStats', () => {
    it('aggregates totals, categories, active, and low stock', async () => {
      prisma.product.count.mockResolvedValueOnce(10)
      prisma.product.groupBy.mockResolvedValue([{ category: 'BIO_FERTILIZER', _count: 7 }])
      prisma.product.count.mockResolvedValueOnce(6)
      prisma.product.findMany.mockResolvedValue([{ id: 'p-1' }])

      const stats = await service.getStats('org-1')

      expect(stats.total).toBe(10)
      expect(stats.active).toBe(6)
      expect(stats.byCategory).toEqual([{ category: 'BIO_FERTILIZER', _count: 7 }])
      expect(stats.lowStock).toEqual([{ id: 'p-1' }])
    })
  })

  describe('getStrainStats', () => {
    it('groups by strain with average CFU counts', async () => {
      prisma.product.groupBy.mockResolvedValue([{ strainName: 'Azotobacter', _count: 2 }])
      await expect(service.getStrainStats('org-1')).resolves.toEqual([{ strainName: 'Azotobacter', _count: 2 }])
      const arg = prisma.product.groupBy.mock.calls[0][0]
      expect(arg.where).toEqual({ organizationId: 'org-1', strainName: { not: null } })
    })
  })
})
