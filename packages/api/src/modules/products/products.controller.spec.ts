import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'

describe('ProductsController', () => {
  let controller: ProductsController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    getStats: ReturnType<typeof vi.fn>
    getStrainStats: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    findBySku: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      getStats: vi.fn(),
      getStrainStats: vi.fn(),
      findOne: vi.fn(),
      findBySku: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    controller = new ProductsController(service as unknown as ProductsService)
  })

  describe('findAll', () => {
    it('passes filters to the service', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', 'BIO_FERTILIZER', true, 'neem')
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        category: 'BIO_FERTILIZER',
        isActive: true,
        search: 'neem',
      })
    })

    it('omits optional filters when not provided', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1')
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        category: undefined,
        isActive: undefined,
        search: undefined,
      })
    })
  })

  describe('getStats', () => {
    it('delegates the organizationId', async () => {
      service.getStats.mockResolvedValue({ total: 1 })
      await expect(controller.getStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getStats).toHaveBeenCalledWith('org-1')
    })
  })

  describe('getStrainStats', () => {
    it('delegates the organizationId', async () => {
      service.getStrainStats.mockResolvedValue({ total: 1 })
      await expect(controller.getStrainStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getStrainStats).toHaveBeenCalledWith('org-1')
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 'p-1' })
      await expect(controller.findOne('p-1')).resolves.toEqual({ id: 'p-1' })
      expect(service.findOne).toHaveBeenCalledWith('p-1')
    })
  })

  describe('findBySku', () => {
    it('delegates to the service with the SKU', async () => {
      service.findBySku.mockResolvedValue({ sku: 'SKU-1' })
      await expect(controller.findBySku('SKU-1')).resolves.toEqual({ sku: 'SKU-1' })
      expect(service.findBySku).toHaveBeenCalledWith('SKU-1')
    })
  })

  describe('create', () => {
    it('delegates to the service with the body', async () => {
      const body = { name: 'Bio Fertilizer' }
      service.create.mockResolvedValue({ id: 'p-1', ...body })
      await expect(controller.create(body as never)).resolves.toEqual({ id: 'p-1', ...body })
      expect(service.create).toHaveBeenCalledWith(body)
    })
  })

  describe('update', () => {
    it('delegates id and body to the service', async () => {
      const body = { name: 'Renamed' }
      service.update.mockResolvedValue({ id: 'p-1', ...body })
      await expect(controller.update('p-1', body)).resolves.toEqual({ id: 'p-1', ...body })
      expect(service.update).toHaveBeenCalledWith('p-1', body)
    })
  })

  describe('delete', () => {
    it('delegates to the service with the id', async () => {
      service.delete.mockResolvedValue({ id: 'p-1' })
      await expect(controller.delete('p-1')).resolves.toEqual({ id: 'p-1' })
      expect(service.delete).toHaveBeenCalledWith('p-1')
    })
  })
})
