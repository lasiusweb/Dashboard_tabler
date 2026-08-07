import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'

describe('OrdersController', () => {
  let controller: OrdersController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    getOrderStats: ReturnType<typeof vi.fn>
    getCustomers: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    findByOrderNumber: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    confirm: ReturnType<typeof vi.fn>
    startProduction: ReturnType<typeof vi.fn>
    readyForDispatch: ReturnType<typeof vi.fn>
    dispatch: ReturnType<typeof vi.fn>
    deliver: ReturnType<typeof vi.fn>
    cancel: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      getOrderStats: vi.fn(),
      getCustomers: vi.fn(),
      findOne: vi.fn(),
      findByOrderNumber: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      confirm: vi.fn(),
      startProduction: vi.fn(),
      readyForDispatch: vi.fn(),
      dispatch: vi.fn(),
      deliver: vi.fn(),
      cancel: vi.fn(),
    }
    controller = new OrdersController(service as unknown as OrdersService)
  })

  describe('findAll', () => {
    it('passes filters to the service', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', 'CONFIRMED', 'cust-1', 'SALE')
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        status: 'CONFIRMED',
        customerId: 'cust-1',
        orderType: 'SALE',
      })
    })

    it('omits optional filters when not provided', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1')
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        status: undefined,
        customerId: undefined,
        orderType: undefined,
      })
    })
  })

  describe('getStats', () => {
    it('delegates the organizationId', async () => {
      service.getOrderStats.mockResolvedValue({ total: 1 })
      await expect(controller.getStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getOrderStats).toHaveBeenCalledWith('org-1')
    })
  })

  describe('getCustomers', () => {
    it('delegates the organizationId', async () => {
      service.getCustomers.mockResolvedValue([])
      await expect(controller.getCustomers('org-1')).resolves.toEqual([])
      expect(service.getCustomers).toHaveBeenCalledWith('org-1')
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 'o-1' })
      await expect(controller.findOne('o-1')).resolves.toEqual({ id: 'o-1' })
      expect(service.findOne).toHaveBeenCalledWith('o-1')
    })
  })

  describe('findByOrderNumber', () => {
    it('delegates to the service with the order number', async () => {
      service.findByOrderNumber.mockResolvedValue({ orderNumber: 'SO-1' })
      await expect(controller.findByOrderNumber('SO-1')).resolves.toEqual({ orderNumber: 'SO-1' })
      expect(service.findByOrderNumber).toHaveBeenCalledWith('SO-1')
    })
  })

  describe('create', () => {
    it('delegates to the service with the body', async () => {
      const body = { orderNumber: 'SO-2' }
      service.create.mockResolvedValue({ id: 'o-2', ...body })
      await expect(controller.create(body as never)).resolves.toEqual({ id: 'o-2', ...body })
      expect(service.create).toHaveBeenCalledWith(body)
    })
  })

  describe('update', () => {
    it('delegates id and body to the service', async () => {
      const body = { notes: 'updated' }
      service.update.mockResolvedValue({ id: 'o-1', ...body })
      await expect(controller.update('o-1', body)).resolves.toEqual({ id: 'o-1', ...body })
      expect(service.update).toHaveBeenCalledWith('o-1', body)
    })
  })

  describe('confirm', () => {
    it('delegates to the service with the id', async () => {
      service.confirm.mockResolvedValue({ id: 'o-1' })
      await expect(controller.confirm('o-1')).resolves.toEqual({ id: 'o-1' })
      expect(service.confirm).toHaveBeenCalledWith('o-1')
    })
  })

  describe('startProduction', () => {
    it('delegates to the service with the id', async () => {
      service.startProduction.mockResolvedValue({ id: 'o-1' })
      await expect(controller.startProduction('o-1')).resolves.toEqual({ id: 'o-1' })
      expect(service.startProduction).toHaveBeenCalledWith('o-1')
    })
  })

  describe('readyForDispatch', () => {
    it('delegates to the service with the id', async () => {
      service.readyForDispatch.mockResolvedValue({ id: 'o-1' })
      await expect(controller.readyForDispatch('o-1')).resolves.toEqual({ id: 'o-1' })
      expect(service.readyForDispatch).toHaveBeenCalledWith('o-1')
    })
  })

  describe('dispatch', () => {
    it('delegates to the service with the id', async () => {
      service.dispatch.mockResolvedValue({ id: 'o-1' })
      await expect(controller.dispatch('o-1')).resolves.toEqual({ id: 'o-1' })
      expect(service.dispatch).toHaveBeenCalledWith('o-1')
    })
  })

  describe('deliver', () => {
    it('delegates to the service with the id', async () => {
      service.deliver.mockResolvedValue({ id: 'o-1' })
      await expect(controller.deliver('o-1')).resolves.toEqual({ id: 'o-1' })
      expect(service.deliver).toHaveBeenCalledWith('o-1')
    })
  })

  describe('cancel', () => {
    it('passes the reason from the body', async () => {
      service.cancel.mockResolvedValue({ id: 'o-1' })
      await expect(controller.cancel('o-1', { reason: 'no stock' })).resolves.toEqual({ id: 'o-1' })
      expect(service.cancel).toHaveBeenCalledWith('o-1', 'no stock')
    })
  })
})
