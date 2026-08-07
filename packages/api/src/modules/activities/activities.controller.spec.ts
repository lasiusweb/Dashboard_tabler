import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ActivitiesController } from './activities.controller'
import { ActivitiesService } from './activities.service'

describe('ActivitiesController', () => {
  let controller: ActivitiesController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
    }
    controller = new ActivitiesController(service as unknown as ActivitiesService)
  })

  describe('findAll', () => {
    it('passes all filters and coerces limit to a number', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', 'party', 'p-1', 'created', '25' as never)
      expect(service.findAll).toHaveBeenCalledWith({
        organizationId: 'org-1',
        entityType: 'party',
        entityId: 'p-1',
        type: 'created',
        limit: 25,
      })
    })

    it('omits limit when not provided', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', undefined, undefined, undefined, undefined)
      expect(service.findAll).toHaveBeenCalledWith({
        organizationId: 'org-1',
        entityType: undefined,
        entityId: undefined,
        type: undefined,
        limit: undefined,
      })
    })

    it('returns the service result', async () => {
      const activities = [{ id: 'a-1' }]
      service.findAll.mockResolvedValue(activities)
      await expect(controller.findAll('org-1')).resolves.toEqual(activities)
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 'a-1' })
      await expect(controller.findOne('a-1')).resolves.toEqual({ id: 'a-1' })
      expect(service.findOne).toHaveBeenCalledWith('a-1')
    })
  })

  describe('create', () => {
    it('delegates to the service with the body', async () => {
      const body = { entityType: 'party', entityId: 'p-1', type: 'created' }
      service.create.mockResolvedValue({ id: 'a-1', ...body })
      await expect(controller.create(body as never)).resolves.toEqual({ id: 'a-1', ...body })
      expect(service.create).toHaveBeenCalledWith(body)
    })
  })

  describe('remove', () => {
    it('delegates to the service with the id', async () => {
      service.remove.mockResolvedValue({ id: 'a-1' })
      await expect(controller.remove('a-1')).resolves.toEqual({ id: 'a-1' })
      expect(service.remove).toHaveBeenCalledWith('a-1')
    })
  })
})
