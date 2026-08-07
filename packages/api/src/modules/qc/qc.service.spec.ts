import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { QcService } from './qc.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('QcService', () => {
  let service: QcService
  let prisma: {
    qCTest: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
      aggregate: ReturnType<typeof vi.fn>
    }
    batch: { findUnique: ReturnType<typeof vi.fn> }
  }

  beforeEach(() => {
    prisma = {
      qCTest: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
      },
      batch: { findUnique: vi.fn() },
    }
    service = new QcService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('scopes to the organization through the batch relation', async () => {
      prisma.qCTest.findMany.mockResolvedValue([])
      await service.findAll('org-1', { batchId: 'b-1', testType: 'CFU_COUNT', result: 'PASS' })
      const arg = prisma.qCTest.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({
        batch: { organizationId: 'org-1' },
        batchId: 'b-1',
        testType: 'CFU_COUNT',
        result: 'PASS',
      })
      expect(arg.orderBy).toEqual({ testedAt: 'desc' })
    })
  })

  describe('findOne', () => {
    it('throws NotFoundException when the test does not exist', async () => {
      prisma.qCTest.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })

    it('returns the test when found', async () => {
      prisma.qCTest.findUnique.mockResolvedValue({ id: 't-1' })
      await expect(service.findOne('t-1')).resolves.toEqual({ id: 't-1' })
    })
  })

  describe('findByBatchId', () => {
    it('filters by batch', async () => {
      prisma.qCTest.findMany.mockResolvedValue([])
      await service.findByBatchId('b-1')
      expect(prisma.qCTest.findMany).toHaveBeenCalledWith({
        where: { batchId: 'b-1' },
        include: { tester: { select: { id: true, name: true } } },
        orderBy: { testedAt: 'desc' },
      })
    })
  })

  describe('create', () => {
    const validData = {
      batchId: 'b-1',
      testType: 'CFU_COUNT',
      parameter: 'CFU per gram',
      testedById: 'u-1',
    }

    it('throws BadRequestException when the batch does not exist', async () => {
      prisma.batch.findUnique.mockResolvedValue(null)
      await expect(service.create(validData)).rejects.toThrow(BadRequestException)
      expect(prisma.qCTest.create).not.toHaveBeenCalled()
    })

    it('creates a test for an existing batch', async () => {
      prisma.batch.findUnique.mockResolvedValue({ id: 'b-1' })
      prisma.qCTest.create.mockResolvedValue({ id: 't-1' })
      await expect(service.create(validData)).resolves.toEqual({ id: 't-1' })
      const arg = prisma.qCTest.create.mock.calls[0][0]
      expect(arg.data).toMatchObject({ batchId: 'b-1', testType: 'CFU_COUNT', testedById: 'u-1' })
    })
  })

  describe('completeTest', () => {
    it('records the result and a tested timestamp', async () => {
      prisma.qCTest.findUnique.mockResolvedValue({ id: 't-1' })
      prisma.qCTest.update.mockResolvedValue({ id: 't-1' })
      await service.completeTest('t-1', '1.2e9', 'PASS', 'within spec')
      const arg = prisma.qCTest.update.mock.calls[0][0]
      expect(arg.data).toMatchObject({
        actualValue: '1.2e9',
        result: 'PASS',
        notes: 'within spec',
        testedAt: expect.any(Date),
      })
    })
  })

  describe('getPendingTests', () => {
    it('filters to QC_PENDING batches with no result', async () => {
      prisma.qCTest.findMany.mockResolvedValue([])
      await service.getPendingTests('org-1')
      const arg = prisma.qCTest.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({
        batch: { organizationId: 'org-1', status: 'QC_PENDING' },
        result: null,
      })
      expect(arg.orderBy).toEqual({ testedAt: 'asc' })
    })
  })

  describe('getTestStats', () => {
    it('computes the pass rate from completed tests', async () => {
      prisma.qCTest.count.mockResolvedValueOnce(10)
      prisma.qCTest.groupBy.mockResolvedValueOnce([{ result: 'PASS', _count: 6 }])
      prisma.qCTest.groupBy.mockResolvedValueOnce([{ testType: 'CFU_COUNT', _count: 10 }])
      prisma.qCTest.aggregate.mockResolvedValue({ _count: 8 })
      prisma.qCTest.count.mockResolvedValueOnce(6)

      const stats = await service.getTestStats('org-1')

      expect(stats.total).toBe(10)
      expect(stats.byResult).toEqual([{ result: 'PASS', _count: 6 }])
      expect(stats.byTestType).toEqual([{ testType: 'CFU_COUNT', _count: 10 }])
      expect(stats.passRate).toBe(75)
    })

    it('returns 0 pass rate when no tests are completed', async () => {
      prisma.qCTest.count.mockResolvedValueOnce(5)
      prisma.qCTest.groupBy.mockResolvedValueOnce([])
      prisma.qCTest.groupBy.mockResolvedValueOnce([])
      prisma.qCTest.aggregate.mockResolvedValue({ _count: 0 })

      const stats = await service.getTestStats('org-1')

      expect(stats.passRate).toBe(0)
    })
  })

  describe('generateCertificate', () => {
    it('throws BadRequestException when the test is not completed', async () => {
      prisma.qCTest.findUnique.mockResolvedValue({ id: 't-1', result: null })
      await expect(service.generateCertificate('t-1')).rejects.toThrow(BadRequestException)
      expect(prisma.qCTest.update).not.toHaveBeenCalled()
    })

    it('generates a certificate number from the batch number', async () => {
      prisma.qCTest.findUnique.mockResolvedValue({
        id: 't-1',
        result: 'PASS',
        batch: { batchNumber: 'BATCH-001' },
      })
      prisma.qCTest.update.mockResolvedValue({ id: 't-1' })

      const number = await service.generateCertificate('t-1')

      expect(number).toMatch(/^QC-BATCH-001-\d+$/)
      expect(prisma.qCTest.update.mock.calls[0][0].data.certificateNumber).toBe(number)
    })
  })
})
