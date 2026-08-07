import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

describe('UsersController', () => {
  let controller: UsersController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    getStats: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      getStats: vi.fn(),
    }
    controller = new UsersController(service as unknown as UsersService)
  })

  describe('findAll', () => {
    it('delegates the organizationId to the service', async () => {
      service.findAll.mockResolvedValue([])
      await expect(controller.findAll('org-1')).resolves.toEqual([])
      expect(service.findAll).toHaveBeenCalledWith('org-1')
    })

    it('delegates without an organizationId when omitted', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll()
      expect(service.findAll).toHaveBeenCalledWith(undefined)
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 'u-1' })
      await expect(controller.findOne('u-1')).resolves.toEqual({ id: 'u-1' })
      expect(service.findOne).toHaveBeenCalledWith('u-1')
    })
  })

  describe('update', () => {
    it('delegates id and body to the service', async () => {
      const body = { name: 'Renamed' }
      service.update.mockResolvedValue({ id: 'u-1', ...body })
      await expect(controller.update('u-1', body)).resolves.toEqual({ id: 'u-1', ...body })
      expect(service.update).toHaveBeenCalledWith('u-1', body)
    })
  })

  describe('getStats', () => {
    it('delegates the organizationId', async () => {
      service.getStats.mockResolvedValue({ total: 1 })
      await expect(controller.getStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getStats).toHaveBeenCalledWith('org-1')
    })
  })
})
