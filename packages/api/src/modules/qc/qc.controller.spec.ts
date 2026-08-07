import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QcController } from './qc.controller'
import { QcService } from './qc.service'

describe('QcController', () => {
  let controller: QcController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    getTestStats: ReturnType<typeof vi.fn>
    getPendingTests: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    findByBatchId: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    completeTest: ReturnType<typeof vi.fn>
    generateCertificate: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      getTestStats: vi.fn(),
      getPendingTests: vi.fn(),
      findOne: vi.fn(),
      findByBatchId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      completeTest: vi.fn(),
      generateCertificate: vi.fn(),
    }
    controller = new QcController(service as unknown as QcService)
  })

  describe('findAll', () => {
    it('passes filters to the service', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', 'b-1', 'POTENCY', 'PASS')
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        batchId: 'b-1',
        testType: 'POTENCY',
        result: 'PASS',
      })
    })

    it('omits optional filters when not provided', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1')
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        batchId: undefined,
        testType: undefined,
        result: undefined,
      })
    })
  })

  describe('getTestStats', () => {
    it('delegates the organizationId', async () => {
      service.getTestStats.mockResolvedValue({ total: 1 })
      await expect(controller.getTestStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getTestStats).toHaveBeenCalledWith('org-1')
    })
  })

  describe('getPendingTests', () => {
    it('delegates the organizationId', async () => {
      service.getPendingTests.mockResolvedValue([])
      await expect(controller.getPendingTests('org-1')).resolves.toEqual([])
      expect(service.getPendingTests).toHaveBeenCalledWith('org-1')
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 't-1' })
      await expect(controller.findOne('t-1')).resolves.toEqual({ id: 't-1' })
      expect(service.findOne).toHaveBeenCalledWith('t-1')
    })
  })

  describe('findByBatchId', () => {
    it('delegates to the service with the batch id', async () => {
      service.findByBatchId.mockResolvedValue([])
      await expect(controller.findByBatchId('b-1')).resolves.toEqual([])
      expect(service.findByBatchId).toHaveBeenCalledWith('b-1')
    })
  })

  describe('create', () => {
    it('delegates to the service with the body', async () => {
      const body = { testType: 'POTENCY' }
      service.create.mockResolvedValue({ id: 't-1', ...body })
      await expect(controller.create(body as never)).resolves.toEqual({ id: 't-1', ...body })
      expect(service.create).toHaveBeenCalledWith(body)
    })
  })

  describe('update', () => {
    it('delegates id and body to the service', async () => {
      const body = { notes: 'rechecked' }
      service.update.mockResolvedValue({ id: 't-1', ...body })
      await expect(controller.update('t-1', body)).resolves.toEqual({ id: 't-1', ...body })
      expect(service.update).toHaveBeenCalledWith('t-1', body)
    })
  })

  describe('completeTest', () => {
    it('passes actualValue, result and notes from the body', async () => {
      service.completeTest.mockResolvedValue({ id: 't-1' })
      await expect(controller.completeTest('t-1', { actualValue: '98', result: 'PASS', notes: 'ok' })).resolves.toEqual({ id: 't-1' })
      expect(service.completeTest).toHaveBeenCalledWith('t-1', '98', 'PASS', 'ok')
    })
  })

  describe('generateCertificate', () => {
    it('wraps the certificate number in the response', async () => {
      service.generateCertificate.mockResolvedValue('COA-123')
      await expect(controller.generateCertificate('t-1')).resolves.toEqual({ certificateNumber: 'COA-123' })
      expect(service.generateCertificate).toHaveBeenCalledWith('t-1')
    })
  })
})
