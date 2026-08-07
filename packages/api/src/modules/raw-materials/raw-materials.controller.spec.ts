import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RawMaterialsController } from './raw-materials.controller'
import { RawMaterialsService } from './raw-materials.service'

describe('RawMaterialsController', () => {
  let controller: RawMaterialsController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    getStats: ReturnType<typeof vi.fn>
    getLowStock: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      getStats: vi.fn(),
      getLowStock: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    }
    controller = new RawMaterialsController(service as unknown as RawMaterialsService)
  })

  describe('findAll', () => {
    it('passes filters to the service', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', 'CARRIER', 'neem')
      expect(service.findAll).toHaveBeenCalledWith('org-1', { category: 'CARRIER', search: 'neem' })
    })

    it('omits optional filters when not provided', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1')
      expect(service.findAll).toHaveBeenCalledWith('org-1', { category: undefined, search: undefined })
    })
  })

  describe('getStats', () => {
    it('delegates the organizationId', async () => {
      service.getStats.mockResolvedValue({ total: 1 })
      await expect(controller.getStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getStats).toHaveBeenCalledWith('org-1')
    })
  })

  describe('getLowStock', () => {
    it('delegates the organizationId', async () => {
      service.getLowStock.mockResolvedValue([])
      await expect(controller.getLowStock('org-1')).resolves.toEqual([])
      expect(service.getLowStock).toHaveBeenCalledWith('org-1')
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 'rm-1' })
      await expect(controller.findOne('rm-1')).resolves.toEqual({ id: 'rm-1' })
      expect(service.findOne).toHaveBeenCalledWith('rm-1')
    })
  })

  describe('create', () => {
    it('delegates to the service with the body', async () => {
      const body = { name: 'Neem Cake' }
      service.create.mockResolvedValue({ id: 'rm-1', ...body })
      await expect(controller.create(body as never)).resolves.toEqual({ id: 'rm-1', ...body })
      expect(service.create).toHaveBeenCalledWith(body)
    })
  })

  describe('update', () => {
    it('delegates id and body to the service', async () => {
      const body = { name: 'Organic Neem Cake' }
      service.update.mockResolvedValue({ id: 'rm-1', ...body })
      await expect(controller.update('rm-1', body)).resolves.toEqual({ id: 'rm-1', ...body })
      expect(service.update).toHaveBeenCalledWith('rm-1', body)
    })
  })

  describe('remove', () => {
    it('delegates to the service with the id', async () => {
      service.remove.mockResolvedValue({ id: 'rm-1' })
      await expect(controller.remove('rm-1')).resolves.toEqual({ id: 'rm-1' })
      expect(service.remove).toHaveBeenCalledWith('rm-1')
    })
  })
})
