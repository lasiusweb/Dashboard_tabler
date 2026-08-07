import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProcurementController } from './procurement.controller'
import { ProcurementService } from './procurement.service'

describe('ProcurementController', () => {
  let controller: ProcurementController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    getProcurementStats: ReturnType<typeof vi.fn>
    getVendorStats: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    findByPoNumber: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    submit: ReturnType<typeof vi.fn>
    confirm: ReturnType<typeof vi.fn>
    receive: ReturnType<typeof vi.fn>
    cancel: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      getProcurementStats: vi.fn(),
      getVendorStats: vi.fn(),
      findOne: vi.fn(),
      findByPoNumber: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      submit: vi.fn(),
      confirm: vi.fn(),
      receive: vi.fn(),
      cancel: vi.fn(),
    }
    controller = new ProcurementController(service as unknown as ProcurementService)
  })

  describe('findAll', () => {
    it('passes filters to the service', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', 'CONFIRMED', 'ven-1')
      expect(service.findAll).toHaveBeenCalledWith('org-1', { status: 'CONFIRMED', vendorId: 'ven-1' })
    })

    it('omits optional filters when not provided', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1')
      expect(service.findAll).toHaveBeenCalledWith('org-1', { status: undefined, vendorId: undefined })
    })
  })

  describe('getStats', () => {
    it('delegates the organizationId', async () => {
      service.getProcurementStats.mockResolvedValue({ total: 1 })
      await expect(controller.getStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getProcurementStats).toHaveBeenCalledWith('org-1')
    })
  })

  describe('getVendorStats', () => {
    it('delegates the organizationId', async () => {
      service.getVendorStats.mockResolvedValue({ total: 1 })
      await expect(controller.getVendorStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getVendorStats).toHaveBeenCalledWith('org-1')
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 'po-1' })
      await expect(controller.findOne('po-1')).resolves.toEqual({ id: 'po-1' })
      expect(service.findOne).toHaveBeenCalledWith('po-1')
    })
  })

  describe('findByPoNumber', () => {
    it('delegates to the service with the PO number', async () => {
      service.findByPoNumber.mockResolvedValue({ poNumber: 'PO-1' })
      await expect(controller.findByPoNumber('PO-1')).resolves.toEqual({ poNumber: 'PO-1' })
      expect(service.findByPoNumber).toHaveBeenCalledWith('PO-1')
    })
  })

  describe('create', () => {
    it('delegates to the service with the body', async () => {
      const body = { poNumber: 'PO-2' }
      service.create.mockResolvedValue({ id: 'po-2', ...body })
      await expect(controller.create(body as never)).resolves.toEqual({ id: 'po-2', ...body })
      expect(service.create).toHaveBeenCalledWith(body)
    })
  })

  describe('update', () => {
    it('delegates id and body to the service', async () => {
      const body = { notes: 'updated' }
      service.update.mockResolvedValue({ id: 'po-1', ...body })
      await expect(controller.update('po-1', body)).resolves.toEqual({ id: 'po-1', ...body })
      expect(service.update).toHaveBeenCalledWith('po-1', body)
    })
  })

  describe('submit', () => {
    it('delegates to the service with the id', async () => {
      service.submit.mockResolvedValue({ id: 'po-1' })
      await expect(controller.submit('po-1')).resolves.toEqual({ id: 'po-1' })
      expect(service.submit).toHaveBeenCalledWith('po-1')
    })
  })

  describe('confirm', () => {
    it('delegates to the service with the id', async () => {
      service.confirm.mockResolvedValue({ id: 'po-1' })
      await expect(controller.confirm('po-1')).resolves.toEqual({ id: 'po-1' })
      expect(service.confirm).toHaveBeenCalledWith('po-1')
    })
  })

  describe('receive', () => {
    it('passes the received items from the body', async () => {
      const items = [{ itemId: 'rm-1', receivedQuantity: 10 }]
      service.receive.mockResolvedValue({ id: 'po-1' })
      await expect(controller.receive('po-1', { receivedItems: items })).resolves.toEqual({ id: 'po-1' })
      expect(service.receive).toHaveBeenCalledWith('po-1', items)
    })
  })

  describe('cancel', () => {
    it('passes the reason from the body', async () => {
      service.cancel.mockResolvedValue({ id: 'po-1' })
      await expect(controller.cancel('po-1', { reason: 'no stock' })).resolves.toEqual({ id: 'po-1' })
      expect(service.cancel).toHaveBeenCalledWith('po-1', 'no stock')
    })
  })
})
