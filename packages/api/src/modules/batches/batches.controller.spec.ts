import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BatchesController } from './batches.controller'
import { BatchesService } from './batches.service'

describe('BatchesController', () => {
  let controller: BatchesController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    getStats: ReturnType<typeof vi.fn>
    getExpiringBatches: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    findByBatchNumber: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    startProduction: ReturnType<typeof vi.fn>
    completeProduction: ReturnType<typeof vi.fn>
    updateQCStatus: ReturnType<typeof vi.fn>
    packageBatch: ReturnType<typeof vi.fn>
    readyForDispatch: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      getStats: vi.fn(),
      getExpiringBatches: vi.fn(),
      findOne: vi.fn(),
      findByBatchNumber: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      startProduction: vi.fn(),
      completeProduction: vi.fn(),
      updateQCStatus: vi.fn(),
      packageBatch: vi.fn(),
      readyForDispatch: vi.fn(),
    }
    controller = new BatchesController(service as unknown as BatchesService)
  })

  describe('findAll', () => {
    it('passes filters to the service', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', 'IN_PROGRESS', 'p-1', true)
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        status: 'IN_PROGRESS',
        productId: 'p-1',
        expiryWarning: true,
      })
    })

    it('returns the service result', async () => {
      const batches = [{ id: 'b-1' }]
      service.findAll.mockResolvedValue(batches)
      await expect(controller.findAll('org-1')).resolves.toEqual(batches)
    })
  })

  describe('getStats', () => {
    it('delegates the organizationId', async () => {
      service.getStats.mockResolvedValue({ total: 1 })
      await expect(controller.getStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getStats).toHaveBeenCalledWith('org-1')
    })
  })

  describe('getExpiringBatches', () => {
    it('delegates organizationId and daysWarning', async () => {
      service.getExpiringBatches.mockResolvedValue([])
      await expect(controller.getExpiringBatches('org-1', 30)).resolves.toEqual([])
      expect(service.getExpiringBatches).toHaveBeenCalledWith('org-1', 30)
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 'b-1' })
      await expect(controller.findOne('b-1')).resolves.toEqual({ id: 'b-1' })
      expect(service.findOne).toHaveBeenCalledWith('b-1')
    })
  })

  describe('findByBatchNumber', () => {
    it('delegates to the service with the batch number', async () => {
      service.findByBatchNumber.mockResolvedValue({ batchNumber: 'B-001' })
      await expect(controller.findByBatchNumber('B-001')).resolves.toEqual({ batchNumber: 'B-001' })
      expect(service.findByBatchNumber).toHaveBeenCalledWith('B-001')
    })
  })

  describe('create', () => {
    it('delegates to the service with the body', async () => {
      const body = { batchNumber: 'B-002' }
      service.create.mockResolvedValue({ id: 'b-2', ...body })
      await expect(controller.create(body as never)).resolves.toEqual({ id: 'b-2', ...body })
      expect(service.create).toHaveBeenCalledWith(body)
    })
  })

  describe('update', () => {
    it('delegates id and body to the service', async () => {
      const body = { notes: 'updated' }
      service.update.mockResolvedValue({ id: 'b-1', ...body })
      await expect(controller.update('b-1', body)).resolves.toEqual({ id: 'b-1', ...body })
      expect(service.update).toHaveBeenCalledWith('b-1', body)
    })
  })

  describe('startProduction', () => {
    it('delegates to the service with the id', async () => {
      service.startProduction.mockResolvedValue({ id: 'b-1' })
      await expect(controller.startProduction('b-1')).resolves.toEqual({ id: 'b-1' })
      expect(service.startProduction).toHaveBeenCalledWith('b-1')
    })
  })

  describe('completeProduction', () => {
    it('passes the actualQuantity from the body', async () => {
      service.completeProduction.mockResolvedValue({ id: 'b-1' })
      await expect(controller.completeProduction('b-1', { actualQuantity: 500 })).resolves.toEqual({ id: 'b-1' })
      expect(service.completeProduction).toHaveBeenCalledWith('b-1', 500)
    })
  })

  describe('updateQCStatus', () => {
    it('passes qcStatus and certificateNumber from the body', async () => {
      service.updateQCStatus.mockResolvedValue({ id: 'b-1' })
      await expect(controller.updateQCStatus('b-1', { qcStatus: 'PASS', certificateNumber: 'COA-1' })).resolves.toEqual({ id: 'b-1' })
      expect(service.updateQCStatus).toHaveBeenCalledWith('b-1', 'PASS', 'COA-1')
    })
  })

  describe('packageBatch', () => {
    it('delegates id and body to the service', async () => {
      const body = { packageSize: 10 }
      service.packageBatch.mockResolvedValue({ id: 'b-1', ...body })
      await expect(controller.packageBatch('b-1', body as never)).resolves.toEqual({ id: 'b-1', ...body })
      expect(service.packageBatch).toHaveBeenCalledWith('b-1', body)
    })
  })

  describe('readyForDispatch', () => {
    it('delegates to the service with the id', async () => {
      service.readyForDispatch.mockResolvedValue({ id: 'b-1' })
      await expect(controller.readyForDispatch('b-1')).resolves.toEqual({ id: 'b-1' })
      expect(service.readyForDispatch).toHaveBeenCalledWith('b-1')
    })
  })
})
