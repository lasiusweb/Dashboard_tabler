import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DistributorsController } from './distributors.controller'
import { DistributorsService } from './distributors.service'

describe('DistributorsController', () => {
  let controller: DistributorsController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    getStats: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      getStats: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    }
    controller = new DistributorsController(service as unknown as DistributorsService)
  })

  describe('findAll', () => {
    it('passes filters to the service', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', 'North', 'Karnataka')
      expect(service.findAll).toHaveBeenCalledWith('org-1', { territory: 'North', state: 'Karnataka' })
    })

    it('omits optional filters when not provided', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1')
      expect(service.findAll).toHaveBeenCalledWith('org-1', { territory: undefined, state: undefined })
    })
  })

  describe('getStats', () => {
    it('delegates the organizationId', async () => {
      service.getStats.mockResolvedValue({ total: 1 })
      await expect(controller.getStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getStats).toHaveBeenCalledWith('org-1')
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 'd-1' })
      await expect(controller.findOne('d-1')).resolves.toEqual({ id: 'd-1' })
      expect(service.findOne).toHaveBeenCalledWith('d-1')
    })
  })

  describe('create', () => {
    it('delegates to the service with the body', async () => {
      const body = { name: 'Dist A' }
      service.create.mockResolvedValue({ id: 'd-1', ...body })
      await expect(controller.create(body as never)).resolves.toEqual({ id: 'd-1', ...body })
      expect(service.create).toHaveBeenCalledWith(body)
    })
  })

  describe('update', () => {
    it('delegates id and body to the service', async () => {
      const body = { name: 'Dist B' }
      service.update.mockResolvedValue({ id: 'd-1', ...body })
      await expect(controller.update('d-1', body as never)).resolves.toEqual({ id: 'd-1', ...body })
      expect(service.update).toHaveBeenCalledWith('d-1', body)
    })
  })

  describe('remove', () => {
    it('delegates to the service with the id', async () => {
      service.remove.mockResolvedValue({ id: 'd-1' })
      await expect(controller.remove('d-1')).resolves.toEqual({ id: 'd-1' })
      expect(service.remove).toHaveBeenCalledWith('d-1')
    })
  })
})
