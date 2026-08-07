import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FieldVisitsController } from './field-visits.controller'
import { FieldVisitsService } from './field-visits.service'

describe('FieldVisitsController', () => {
  let controller: FieldVisitsController
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
    controller = new FieldVisitsController(service as unknown as FieldVisitsService)
  })

  describe('findAll', () => {
    it('passes filters to the service', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', 'u-1', 'PLANNED', 'FIELD')
      expect(service.findAll).toHaveBeenCalledWith({
        organizationId: 'org-1',
        visitedById: 'u-1',
        status: 'PLANNED',
        visitType: 'FIELD',
      })
    })

    it('omits optional filters when not provided', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll()
      expect(service.findAll).toHaveBeenCalledWith({
        organizationId: undefined,
        visitedById: undefined,
        status: undefined,
        visitType: undefined,
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

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 'f-1' })
      await expect(controller.findOne('f-1')).resolves.toEqual({ id: 'f-1' })
      expect(service.findOne).toHaveBeenCalledWith('f-1')
    })
  })

  describe('create', () => {
    it('delegates to the service with the body', async () => {
      const body = { visitDate: new Date('2026-01-01') }
      service.create.mockResolvedValue({ id: 'f-1', ...body })
      await expect(controller.create(body as never)).resolves.toEqual({ id: 'f-1', ...body })
      expect(service.create).toHaveBeenCalledWith(body)
    })
  })

  describe('update', () => {
    it('delegates id and body to the service', async () => {
      const body = { notes: 'visited' }
      service.update.mockResolvedValue({ id: 'f-1', ...body })
      await expect(controller.update('f-1', body)).resolves.toEqual({ id: 'f-1', ...body })
      expect(service.update).toHaveBeenCalledWith('f-1', body)
    })
  })

  describe('remove', () => {
    it('delegates to the service with the id', async () => {
      service.remove.mockResolvedValue({ id: 'f-1' })
      await expect(controller.remove('f-1')).resolves.toEqual({ id: 'f-1' })
      expect(service.remove).toHaveBeenCalledWith('f-1')
    })
  })
})
