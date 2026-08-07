import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@firstcrop/db'
import { BatchesService } from './batches.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('BatchesService', () => {
  let service: BatchesService
  let prisma: {
    batch: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
      aggregate: ReturnType<typeof vi.fn>
    }
    rawMaterial: {
      findUnique: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
    }
    inventoryMovement: { create: ReturnType<typeof vi.fn> }
    inventoryLocation: {
      findFirst: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
    }
    inventory: { create: ReturnType<typeof vi.fn> }
  }

  beforeEach(() => {
    prisma = {
      batch: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
      },
      rawMaterial: { findUnique: vi.fn(), update: vi.fn() },
      inventoryMovement: { create: vi.fn() },
      inventoryLocation: { findFirst: vi.fn(), create: vi.fn() },
      inventory: { create: vi.fn() },
    }
    service = new BatchesService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('builds a flat where clause from direct filters', async () => {
      prisma.batch.findMany.mockResolvedValue([])
      await service.findAll('org-1', { status: 'QC_PENDING', productId: 'p-1' })
      const arg = prisma.batch.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({ organizationId: 'org-1', status: 'QC_PENDING', productId: 'p-1' })
      expect(arg.orderBy).toEqual({ createdAt: 'desc' })
    })

    it('adds an expiry warning window when requested', async () => {
      prisma.batch.findMany.mockResolvedValue([])
      await service.findAll('org-1', { expiryWarning: true })
      const arg = prisma.batch.findMany.mock.calls[0][0]
      expect(arg.where.organizationId).toBe('org-1')
      expect(arg.where.expiryDate.lte).toBeInstanceOf(Date)
    })
  })

  describe('findOne', () => {
    it('returns the batch when found', async () => {
      prisma.batch.findUnique.mockResolvedValue({ id: 'b-1' })
      await expect(service.findOne('b-1')).resolves.toEqual({ id: 'b-1' })
      expect(prisma.batch.findUnique).toHaveBeenCalledWith({
        where: { id: 'b-1' },
        include: {
          product: true,
          ingredients: { include: { rawMaterial: true } },
          qcTests: { orderBy: { testedAt: 'desc' } },
        },
      })
    })

    it('throws NotFoundException when the batch does not exist', async () => {
      prisma.batch.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('findByBatchNumber', () => {
    it('queries by the batch number', async () => {
      prisma.batch.findUnique.mockResolvedValue(null)
      await service.findByBatchNumber('BATCH-001')
      expect(prisma.batch.findUnique).toHaveBeenCalledWith({
        where: { batchNumber: 'BATCH-001' },
        include: { product: true, ingredients: true, qcTests: true },
      })
    })
  })

  describe('create', () => {
    const validData = {
      organizationId: 'org-1',
      productId: 'p-1',
      plannedQuantity: 100,
      unit: 'kg',
      expiryDate: new Date('2027-01-01'),
    }

    it('creates a batch with default PLANNED status and generated number', async () => {
      prisma.batch.findUnique.mockResolvedValue(null)
      prisma.batch.create.mockImplementation(({ data }: any) => ({ id: 'b-1', ...data }))
      const result = await service.create(validData)
      expect(result.status).toBe('PLANNED')
      expect(result.batchNumber).toMatch(/^BATCH-\d+$/)
      expect(prisma.batch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-1',
          productId: 'p-1',
          plannedQuantity: 100,
          status: 'PLANNED',
        }),
        include: { product: true },
      })
    })

    it('throws BadRequestException when the batch number already exists', async () => {
      prisma.batch.findUnique.mockResolvedValue({ id: 'existing' })
      await expect(service.create({ ...validData, batchNumber: 'BATCH-001' })).rejects.toThrow(BadRequestException)
      expect(prisma.batch.create).not.toHaveBeenCalled()
    })
  })

  describe('startProduction', () => {
    const ingredient = {
      rawMaterialId: 'rm-1',
      plannedQuantity: new Prisma.Decimal(10),
      unit: 'kg',
    }

    it('throws BadRequestException when the batch is not PLANNED', async () => {
      prisma.batch.findUnique.mockResolvedValue({ id: 'b-1', status: 'IN_PROGRESS' })
      await expect(service.startProduction('b-1')).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when a raw material is missing', async () => {
      prisma.batch.findUnique.mockResolvedValue({
        id: 'b-1',
        status: 'PLANNED',
        ingredients: [ingredient],
      })
      prisma.rawMaterial.findUnique.mockResolvedValue(null)
      await expect(service.startProduction('b-1')).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when stock is insufficient', async () => {
      prisma.batch.findUnique.mockResolvedValue({
        id: 'b-1',
        status: 'PLANNED',
        ingredients: [ingredient],
      })
      prisma.rawMaterial.findUnique.mockResolvedValue({
        id: 'rm-1',
        name: 'Media',
        currentStock: new Prisma.Decimal(5),
      })
      await expect(service.startProduction('b-1')).rejects.toThrow(BadRequestException)
      expect(prisma.rawMaterial.update).not.toHaveBeenCalled()
    })

    it('deducts stock, records movements, and moves the batch to IN_PROGRESS', async () => {
      prisma.batch.findUnique.mockResolvedValue({
        id: 'b-1',
        organizationId: 'org-1',
        batchNumber: 'BATCH-001',
        status: 'PLANNED',
        ingredients: [ingredient],
      })
      prisma.rawMaterial.findUnique.mockResolvedValue({
        id: 'rm-1',
        name: 'Media',
        currentStock: new Prisma.Decimal(50),
      })
      prisma.rawMaterial.update.mockResolvedValue({ id: 'rm-1' })
      prisma.inventoryMovement.create.mockResolvedValue({ id: 'm-1' })
      prisma.batch.update.mockResolvedValue({ id: 'b-1', status: 'IN_PROGRESS' })

      await service.startProduction('b-1')

      expect(prisma.rawMaterial.update).toHaveBeenCalledWith({
        where: { id: 'rm-1' },
        data: { currentStock: { decrement: new Prisma.Decimal(10) } },
      })
      const movement = prisma.inventoryMovement.create.mock.calls[0][0].data
      expect(movement.type).toBe('PRODUCTION_OUTPUT')
      expect(movement.quantity.toString()).toBe('-10')
      expect(prisma.batch.update).toHaveBeenCalledWith({
        where: { id: 'b-1' },
        data: { status: 'IN_PROGRESS', actualStartDate: expect.any(Date) },
        include: { product: true },
      })
    })
  })

  describe('completeProduction', () => {
    it('throws BadRequestException when the batch is not in production', async () => {
      prisma.batch.findUnique.mockResolvedValue({ id: 'b-1', status: 'PLANNED' })
      await expect(service.completeProduction('b-1', 90)).rejects.toThrow(BadRequestException)
    })

    it('marks the batch QC_PENDING with a computed yield percentage', async () => {
      prisma.batch.findUnique.mockResolvedValue({
        id: 'b-1',
        status: 'IN_PROGRESS',
        plannedQuantity: new Prisma.Decimal(100),
      })
      prisma.batch.update.mockResolvedValue({ id: 'b-1' })
      await service.completeProduction('b-1', 90)
      const arg = prisma.batch.update.mock.calls[0][0]
      expect(arg.data.status).toBe('QC_PENDING')
      expect(arg.data.actualQuantity).toBe(90)
      expect(arg.data.yieldPercentage.toString()).toBe('90')
    })
  })

  describe('updateQCStatus', () => {
    it('throws BadRequestException when the batch is not QC_PENDING', async () => {
      prisma.batch.findUnique.mockResolvedValue({ id: 'b-1', status: 'QC_PASSED' })
      await expect(service.updateQCStatus('b-1', 'PASS')).rejects.toThrow(BadRequestException)
    })

    it('maps PASS to QC_PASSED', async () => {
      prisma.batch.findUnique.mockResolvedValue({ id: 'b-1', status: 'QC_PENDING' })
      prisma.batch.update.mockResolvedValue({ id: 'b-1' })
      await service.updateQCStatus('b-1', 'PASS', 'CERT-1')
      const arg = prisma.batch.update.mock.calls[0][0]
      expect(arg.data).toMatchObject({ status: 'QC_PASSED', qcStatus: 'PASS', certificateNumber: 'CERT-1' })
    })

    it('maps FAIL to QC_REJECTED', async () => {
      prisma.batch.findUnique.mockResolvedValue({ id: 'b-1', status: 'QC_PENDING' })
      prisma.batch.update.mockResolvedValue({ id: 'b-1' })
      await service.updateQCStatus('b-1', 'FAIL')
      expect(prisma.batch.update.mock.calls[0][0].data.status).toBe('QC_REJECTED')
    })
  })

  describe('packageBatch', () => {
    it('throws BadRequestException when the batch is not QC_PASSED', async () => {
      prisma.batch.findUnique.mockResolvedValue({ id: 'b-1', status: 'QC_PENDING' })
      await expect(service.packageBatch('b-1', { packagingType: 'pouch', unitsProduced: 1000 })).rejects.toThrow(BadRequestException)
    })

    it('moves the batch to PACKAGING', async () => {
      prisma.batch.findUnique.mockResolvedValue({ id: 'b-1', status: 'QC_PASSED' })
      prisma.batch.update.mockResolvedValue({ id: 'b-1' })
      await service.packageBatch('b-1', { packagingType: 'pouch', unitsProduced: 1000 })
      const arg = prisma.batch.update.mock.calls[0][0]
      expect(arg.data).toMatchObject({
        status: 'PACKAGING',
        packagingType: 'pouch',
        unitsProduced: 1000,
        packagingDate: expect.any(Date),
      })
    })
  })

  describe('readyForDispatch', () => {
    it('throws BadRequestException when the batch is not PACKAGING', async () => {
      prisma.batch.findUnique.mockResolvedValue({ id: 'b-1', status: 'QC_PASSED' })
      await expect(service.readyForDispatch('b-1')).rejects.toThrow(BadRequestException)
    })

    it('creates a finished goods location when none exists', async () => {
      prisma.batch.findUnique.mockResolvedValue({
        id: 'b-1',
        organizationId: 'org-1',
        productId: 'p-1',
        batchNumber: 'BATCH-001',
        actualQuantity: new Prisma.Decimal(90),
        plannedQuantity: new Prisma.Decimal(100),
        unit: 'kg',
        expiryDate: new Date('2027-01-01'),
        status: 'PACKAGING',
      })
      prisma.inventoryLocation.findFirst.mockResolvedValue(null)
      prisma.inventoryLocation.create.mockResolvedValue({ id: 'loc-1' })
      prisma.inventory.create.mockResolvedValue({ id: 'inv-1' })
      prisma.batch.update.mockResolvedValue({ id: 'b-1', status: 'READY_FOR_DISPATCH' })

      await service.readyForDispatch('b-1')

      expect(prisma.inventoryLocation.create).toHaveBeenCalledWith({
        data: { organizationId: 'org-1', name: 'Finished Goods Warehouse', type: 'FINISHED_GOODS' },
      })
      const inventory = prisma.inventory.create.mock.calls[0][0].data
      expect(inventory).toMatchObject({
        organizationId: 'org-1',
        locationId: 'loc-1',
        productId: 'p-1',
        batchNumber: 'BATCH-001',
        unit: 'kg',
      })
      expect(prisma.batch.update).toHaveBeenCalledWith({
        where: { id: 'b-1' },
        data: { status: 'READY_FOR_DISPATCH' },
        include: { product: true },
      })
    })

    it('reuses an existing finished goods location', async () => {
      prisma.batch.findUnique.mockResolvedValue({
        id: 'b-1',
        organizationId: 'org-1',
        productId: 'p-1',
        batchNumber: 'BATCH-001',
        actualQuantity: new Prisma.Decimal(90),
        unit: 'kg',
        expiryDate: new Date('2027-01-01'),
        status: 'PACKAGING',
      })
      prisma.inventoryLocation.findFirst.mockResolvedValue({ id: 'loc-1' })
      prisma.inventory.create.mockResolvedValue({ id: 'inv-1' })
      prisma.batch.update.mockResolvedValue({ id: 'b-1' })

      await service.readyForDispatch('b-1')

      expect(prisma.inventoryLocation.create).not.toHaveBeenCalled()
      expect(prisma.inventory.create.mock.calls[0][0].data.locationId).toBe('loc-1')
    })
  })

  describe('getExpiringBatches', () => {
    it('scopes to dispatchable statuses with an expiry window', async () => {
      prisma.batch.findMany.mockResolvedValue([])
      await service.getExpiringBatches('org-1', 45)
      const arg = prisma.batch.findMany.mock.calls[0][0]
      expect(arg.where.organizationId).toBe('org-1')
      expect(arg.where.status).toEqual({ in: ['QC_PASSED', 'PACKAGING', 'READY_FOR_DISPATCH'] })
      expect(arg.where.expiryDate.lte).toBeInstanceOf(Date)
      expect(arg.orderBy).toEqual({ expiryDate: 'asc' })
    })
  })

  describe('getStats', () => {
    it('aggregates count, status distribution, expiring, and average yield', async () => {
      prisma.batch.count.mockResolvedValue(5)
      prisma.batch.groupBy.mockResolvedValue([{ status: 'QC_PASSED', _count: 2 }])
      prisma.batch.findMany.mockResolvedValue([{ id: 'b-1' }])
      prisma.batch.aggregate.mockResolvedValue({ _avg: { yieldPercentage: 87.5 } })

      await expect(service.getStats('org-1')).resolves.toEqual({
        total: 5,
        byStatus: [{ status: 'QC_PASSED', _count: 2 }],
        expiringCount: 1,
        averageYield: 87.5,
      })
    })
  })
})
