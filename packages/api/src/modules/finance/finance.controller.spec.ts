import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FinanceController } from './finance.controller'
import { FinanceService } from './finance.service'

describe('FinanceController', () => {
  let controller: FinanceController
  let service: {
    findAllInvoices: ReturnType<typeof vi.fn>
    getFinanceStats: ReturnType<typeof vi.fn>
    getOverdueInvoices: ReturnType<typeof vi.fn>
    findOneInvoice: ReturnType<typeof vi.fn>
    createInvoice: ReturnType<typeof vi.fn>
    updateInvoice: ReturnType<typeof vi.fn>
    sendInvoice: ReturnType<typeof vi.fn>
    cancelInvoice: ReturnType<typeof vi.fn>
    createPayment: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAllInvoices: vi.fn(),
      getFinanceStats: vi.fn(),
      getOverdueInvoices: vi.fn(),
      findOneInvoice: vi.fn(),
      createInvoice: vi.fn(),
      updateInvoice: vi.fn(),
      sendInvoice: vi.fn(),
      cancelInvoice: vi.fn(),
      createPayment: vi.fn(),
    }
    controller = new FinanceController(service as unknown as FinanceService)
  })

  describe('findAllInvoices', () => {
    it('passes filters to the service', async () => {
      service.findAllInvoices.mockResolvedValue([])
      await controller.findAllInvoices('org-1', 'PAID', 'SALE', 'cust-1', 'ven-1')
      expect(service.findAllInvoices).toHaveBeenCalledWith('org-1', {
        status: 'PAID',
        type: 'SALE',
        customerId: 'cust-1',
        vendorId: 'ven-1',
      })
    })

    it('omits optional filters when not provided', async () => {
      service.findAllInvoices.mockResolvedValue([])
      await controller.findAllInvoices('org-1')
      expect(service.findAllInvoices).toHaveBeenCalledWith('org-1', {
        status: undefined,
        type: undefined,
        customerId: undefined,
        vendorId: undefined,
      })
    })
  })

  describe('getStats', () => {
    it('delegates the organizationId', async () => {
      service.getFinanceStats.mockResolvedValue({ total: 1 })
      await expect(controller.getStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getFinanceStats).toHaveBeenCalledWith('org-1')
    })
  })

  describe('getOverdueInvoices', () => {
    it('delegates the organizationId', async () => {
      service.getOverdueInvoices.mockResolvedValue([])
      await expect(controller.getOverdueInvoices('org-1')).resolves.toEqual([])
      expect(service.getOverdueInvoices).toHaveBeenCalledWith('org-1')
    })
  })

  describe('findOneInvoice', () => {
    it('delegates to the service with the id', async () => {
      service.findOneInvoice.mockResolvedValue({ id: 'inv-1' })
      await expect(controller.findOneInvoice('inv-1')).resolves.toEqual({ id: 'inv-1' })
      expect(service.findOneInvoice).toHaveBeenCalledWith('inv-1')
    })
  })

  describe('createInvoice', () => {
    it('delegates to the service with the body', async () => {
      const body = { invoiceNumber: 'INV-1' }
      service.createInvoice.mockResolvedValue({ id: 'inv-1', ...body })
      await expect(controller.createInvoice(body as never)).resolves.toEqual({ id: 'inv-1', ...body })
      expect(service.createInvoice).toHaveBeenCalledWith(body)
    })
  })

  describe('updateInvoice', () => {
    it('delegates id and body to the service', async () => {
      const body = { total: 100 }
      service.updateInvoice.mockResolvedValue({ id: 'inv-1', ...body })
      await expect(controller.updateInvoice('inv-1', body as never)).resolves.toEqual({ id: 'inv-1', ...body })
      expect(service.updateInvoice).toHaveBeenCalledWith('inv-1', body)
    })
  })

  describe('sendInvoice', () => {
    it('delegates to the service with the id', async () => {
      service.sendInvoice.mockResolvedValue({ id: 'inv-1' })
      await expect(controller.sendInvoice('inv-1')).resolves.toEqual({ id: 'inv-1' })
      expect(service.sendInvoice).toHaveBeenCalledWith('inv-1')
    })
  })

  describe('cancelInvoice', () => {
    it('passes the reason from the body', async () => {
      service.cancelInvoice.mockResolvedValue({ id: 'inv-1' })
      await expect(controller.cancelInvoice('inv-1', { reason: 'mistake' })).resolves.toEqual({ id: 'inv-1' })
      expect(service.cancelInvoice).toHaveBeenCalledWith('inv-1', 'mistake')
    })
  })

  describe('createPayment', () => {
    it('delegates id and body to the service', async () => {
      const body = { amount: 100 }
      service.createPayment.mockResolvedValue({ id: 'pay-1', ...body })
      await expect(controller.createPayment('inv-1', body as never)).resolves.toEqual({ id: 'pay-1', ...body })
      expect(service.createPayment).toHaveBeenCalledWith('inv-1', body)
    })
  })
})
