import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ComplianceController } from './compliance.controller'
import { ComplianceService } from './compliance.service'

describe('ComplianceController', () => {
  let controller: ComplianceController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    getComplianceStats: ReturnType<typeof vi.fn>
    getExpiringRecords: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    renew: ReturnType<typeof vi.fn>
    suspend: ReturnType<typeof vi.fn>
    revoke: ReturnType<typeof vi.fn>
    verifyFSSAI: ReturnType<typeof vi.fn>
    verifyGST: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      getComplianceStats: vi.fn(),
      getExpiringRecords: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      renew: vi.fn(),
      suspend: vi.fn(),
      revoke: vi.fn(),
      verifyFSSAI: vi.fn(),
      verifyGST: vi.fn(),
    }
    controller = new ComplianceController(service as unknown as ComplianceService)
  })

  describe('findAll', () => {
    it('passes filters to the service', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', 'FSSAI', 'ACTIVE', 'party-1')
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        certType: 'FSSAI',
        status: 'ACTIVE',
        partyId: 'party-1',
      })
    })

    it('omits optional filters when not provided', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1')
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        certType: undefined,
        status: undefined,
        partyId: undefined,
      })
    })
  })

  describe('getStats', () => {
    it('delegates the organizationId', async () => {
      service.getComplianceStats.mockResolvedValue({ total: 1 })
      await expect(controller.getStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getComplianceStats).toHaveBeenCalledWith('org-1')
    })
  })

  describe('getExpiring', () => {
    it('delegates organizationId and daysWarning', async () => {
      service.getExpiringRecords.mockResolvedValue([])
      await expect(controller.getExpiring('org-1', 45)).resolves.toEqual([])
      expect(service.getExpiringRecords).toHaveBeenCalledWith('org-1', 45)
    })

    it('passes undefined daysWarning when omitted', async () => {
      service.getExpiringRecords.mockResolvedValue([])
      await controller.getExpiring('org-1')
      expect(service.getExpiringRecords).toHaveBeenCalledWith('org-1', undefined)
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 'c-1' })
      await expect(controller.findOne('c-1')).resolves.toEqual({ id: 'c-1' })
      expect(service.findOne).toHaveBeenCalledWith('c-1')
    })
  })

  describe('create', () => {
    it('delegates to the service with the body', async () => {
      const body = { certType: 'FSSAI' }
      service.create.mockResolvedValue({ id: 'c-1', ...body })
      await expect(controller.create(body as never)).resolves.toEqual({ id: 'c-1', ...body })
      expect(service.create).toHaveBeenCalledWith(body)
    })
  })

  describe('update', () => {
    it('delegates id and body to the service', async () => {
      const body = { status: 'ACTIVE' }
      service.update.mockResolvedValue({ id: 'c-1', ...body })
      await expect(controller.update('c-1', body)).resolves.toEqual({ id: 'c-1', ...body })
      expect(service.update).toHaveBeenCalledWith('c-1', body)
    })
  })

  describe('renew', () => {
    it('delegates id and body to the service', async () => {
      const body = { newExpiryDate: new Date('2027-01-01') }
      service.renew.mockResolvedValue({ id: 'c-1' })
      await expect(controller.renew('c-1', body as never)).resolves.toEqual({ id: 'c-1' })
      expect(service.renew).toHaveBeenCalledWith('c-1', body)
    })
  })

  describe('suspend', () => {
    it('passes the reason from the body', async () => {
      service.suspend.mockResolvedValue({ id: 'c-1' })
      await expect(controller.suspend('c-1', { reason: 'expired' })).resolves.toEqual({ id: 'c-1' })
      expect(service.suspend).toHaveBeenCalledWith('c-1', 'expired')
    })
  })

  describe('revoke', () => {
    it('passes the reason from the body', async () => {
      service.revoke.mockResolvedValue({ id: 'c-1' })
      await expect(controller.revoke('c-1', { reason: 'violation' })).resolves.toEqual({ id: 'c-1' })
      expect(service.revoke).toHaveBeenCalledWith('c-1', 'violation')
    })
  })

  describe('verifyFSSAI', () => {
    it('delegates to the service with the FSSAI number', async () => {
      service.verifyFSSAI.mockResolvedValue({ valid: true })
      await expect(controller.verifyFSSAI('12345678901234')).resolves.toEqual({ valid: true })
      expect(service.verifyFSSAI).toHaveBeenCalledWith('12345678901234')
    })
  })

  describe('verifyGST', () => {
    it('delegates to the service with the GSTIN', async () => {
      service.verifyGST.mockResolvedValue({ valid: true })
      await expect(controller.verifyGST('27AAPFU0939F1ZV')).resolves.toEqual({ valid: true })
      expect(service.verifyGST).toHaveBeenCalledWith('27AAPFU0939F1ZV')
    })
  })
})
