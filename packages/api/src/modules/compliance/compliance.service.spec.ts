import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ComplianceService } from './compliance.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('ComplianceService', () => {
  let service: ComplianceService
  let prisma: {
    complianceRecord: {
      findMany: ReturnType<typeof vi.fn>
      findFirst: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    prisma = {
      complianceRecord: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
    }
    service = new ComplianceService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('builds a flat where clause from filters', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([])
      await service.findAll('org-1', { certType: 'FSSAI', status: 'ACTIVE', partyId: 'p-1' })
      const arg = prisma.complianceRecord.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({
        organizationId: 'org-1',
        certType: 'FSSAI',
        status: 'ACTIVE',
        partyId: 'p-1',
      })
      expect(arg.orderBy).toEqual({ expiryDate: 'asc' })
    })
  })

  describe('findOne', () => {
    it('returns the record when found', async () => {
      prisma.complianceRecord.findUnique.mockResolvedValue({ id: 'c-1' })
      await expect(service.findOne('c-1')).resolves.toEqual({ id: 'c-1' })
    })

    it('throws NotFoundException when the record does not exist', async () => {
      prisma.complianceRecord.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    const validData = {
      organizationId: 'org-1',
      certType: 'FSSAI',
      certificateNumber: '12345678901234',
      issuedDate: new Date('2026-01-01'),
      expiryDate: new Date('2027-01-01'),
    }

    it('creates an ACTIVE record when the certificate number is free', async () => {
      prisma.complianceRecord.findFirst.mockResolvedValue(null)
      prisma.complianceRecord.create.mockImplementation(({ data }: any) => ({ id: 'c-1', ...data }))
      const result = await service.create(validData)
      expect(result.status).toBe('ACTIVE')
      expect(prisma.complianceRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-1',
          certType: 'FSSAI',
          certificateNumber: '12345678901234',
          status: 'ACTIVE',
        }),
        include: { party: true },
      })
    })

    it('throws BadRequestException on a duplicate certificate number', async () => {
      prisma.complianceRecord.findFirst.mockResolvedValue({ id: 'existing' })
      await expect(service.create(validData)).rejects.toThrow(BadRequestException)
      expect(prisma.complianceRecord.create).not.toHaveBeenCalled()
    })
  })

  describe('renew', () => {
    it('creates a renewal record with a new certificate number', async () => {
      prisma.complianceRecord.findUnique.mockResolvedValue({
        id: 'c-1',
        organizationId: 'org-1',
        partyId: 'p-1',
        productId: 'prod-1',
        certType: 'FSSAI',
        certificateNumber: 'OLD-1',
        issuedBy: 'FSSAI',
        issuedDate: new Date('2026-01-01'),
        expiryDate: new Date('2026-12-31'),
      })
      prisma.complianceRecord.create.mockImplementation(({ data }: any) => ({ id: 'c-2', ...data }))

      const result = await service.renew('c-1', {
        newCertificateNumber: 'NEW-1',
        newExpiryDate: new Date('2028-01-01'),
      })

      expect(result.certificateNumber).toBe('NEW-1')
      expect(result.expiryDate).toEqual(new Date('2028-01-01'))
      expect(result.notes).toBe('Renewal of OLD-1')
      expect(result.status).toBe('ACTIVE')
    })
  })

  describe('suspend', () => {
    it('suspends an active record with a reason', async () => {
      prisma.complianceRecord.findUnique.mockResolvedValue({
        id: 'c-1',
        status: 'ACTIVE',
        notes: null,
      })
      prisma.complianceRecord.update.mockResolvedValue({ id: 'c-1' })
      await service.suspend('c-1', 'pending verification')
      const arg = prisma.complianceRecord.update.mock.calls[0][0]
      expect(arg.data.status).toBe('SUSPENDED')
      expect(arg.data.notes).toContain('Suspended: pending verification')
    })

    it('throws BadRequestException when the record is already revoked', async () => {
      prisma.complianceRecord.findUnique.mockResolvedValue({ id: 'c-1', status: 'REVOKED' })
      await expect(service.suspend('c-1')).rejects.toThrow(BadRequestException)
      expect(prisma.complianceRecord.update).not.toHaveBeenCalled()
    })
  })

  describe('revoke', () => {
    it('revokes an active record', async () => {
      prisma.complianceRecord.findUnique.mockResolvedValue({ id: 'c-1', status: 'ACTIVE', notes: null })
      prisma.complianceRecord.update.mockResolvedValue({ id: 'c-1' })
      await service.revoke('c-1', 'fraudulent document')
      const arg = prisma.complianceRecord.update.mock.calls[0][0]
      expect(arg.data.status).toBe('REVOKED')
      expect(arg.data.notes).toContain('Revoked: fraudulent document')
    })

    it('throws BadRequestException when already revoked', async () => {
      prisma.complianceRecord.findUnique.mockResolvedValue({ id: 'c-1', status: 'REVOKED' })
      await expect(service.revoke('c-1')).rejects.toThrow(BadRequestException)
    })
  })

  describe('getExpiringRecords', () => {
    it('excludes revoked and suspended records', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([])
      await service.getExpiringRecords('org-1', 60)
      const arg = prisma.complianceRecord.findMany.mock.calls[0][0]
      expect(arg.where.organizationId).toBe('org-1')
      expect(arg.where.status).toEqual({ notIn: ['REVOKED', 'SUSPENDED'] })
      expect(arg.where.expiryDate.lte).toBeInstanceOf(Date)
    })
  })

  describe('getComplianceStats', () => {
    it('computes active, expiring soon, and expired counts', async () => {
      prisma.complianceRecord.count.mockResolvedValueOnce(10)
      prisma.complianceRecord.groupBy.mockResolvedValueOnce([{ status: 'ACTIVE', _count: 8 }])
      prisma.complianceRecord.groupBy.mockResolvedValueOnce([{ certType: 'FSSAI', _count: 10 }])
      prisma.complianceRecord.count.mockResolvedValueOnce(2)
      prisma.complianceRecord.count.mockResolvedValueOnce(1)

      const stats = await service.getComplianceStats('org-1')

      expect(stats.total).toBe(10)
      expect(stats.byStatus).toEqual([{ status: 'ACTIVE', _count: 8 }])
      expect(stats.byCertType).toEqual([{ certType: 'FSSAI', _count: 10 }])
      expect(stats.expiringSoon).toBe(2)
      expect(stats.expired).toBe(1)
      expect(stats.active).toBe(7)
    })
  })

  describe('verifyFSSAI and verifyGST', () => {
    it('returns a mock verification result', async () => {
      const result = await service.verifyFSSAI('12345678901234')
      expect(result.success).toBe(true)
      expect(result.data.fssaiNumber).toBe('12345678901234')
      expect(result.data.valid).toBe(true)
    })

    it('returns a mock GST verification result', async () => {
      const result = await service.verifyGST('27AAACA1234A1Z5')
      expect(result.success).toBe(true)
      expect(result.data.gstin).toBe('27AAACA1234A1Z5')
    })
  })
})
