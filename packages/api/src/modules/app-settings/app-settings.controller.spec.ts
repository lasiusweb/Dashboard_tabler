import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppSettingsController } from './app-settings.controller'
import { AppSettingsService } from './app-settings.service'

describe('AppSettingsController', () => {
  let controller: AppSettingsController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    findByKey: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      findByKey: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    }
    controller = new AppSettingsController(service as unknown as AppSettingsService)
  })

  describe('findAll', () => {
    it('delegates to the service with the organizationId', async () => {
      service.findAll.mockResolvedValue([])
      await expect(controller.findAll('org-1')).resolves.toEqual([])
      expect(service.findAll).toHaveBeenCalledWith('org-1')
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 's-1' })
      await expect(controller.findOne('s-1')).resolves.toEqual({ id: 's-1' })
      expect(service.findOne).toHaveBeenCalledWith('s-1')
    })
  })

  describe('findByKey', () => {
    it('delegates with key and organizationId', async () => {
      service.findByKey.mockResolvedValue({ key: 'gst' })
      await expect(controller.findByKey('gst', 'org-1')).resolves.toEqual({ key: 'gst' })
      expect(service.findByKey).toHaveBeenCalledWith('org-1', 'gst')
    })
  })

  describe('create', () => {
    it('delegates to the service with the body', async () => {
      const body = { key: 'gst', value: '18' }
      service.create.mockResolvedValue({ id: 's-1', ...body })
      await expect(controller.create(body as never)).resolves.toEqual({ id: 's-1', ...body })
      expect(service.create).toHaveBeenCalledWith(body)
    })
  })

  describe('update', () => {
    it('delegates with id and body', async () => {
      const body = { value: '12' }
      service.update.mockResolvedValue({ id: 's-1', ...body })
      await expect(controller.update('s-1', body as never)).resolves.toEqual({ id: 's-1', ...body })
      expect(service.update).toHaveBeenCalledWith('s-1', body)
    })
  })

  describe('remove', () => {
    it('delegates to the service with the id', async () => {
      service.remove.mockResolvedValue({ id: 's-1' })
      await expect(controller.remove('s-1')).resolves.toEqual({ id: 's-1' })
      expect(service.remove).toHaveBeenCalledWith('s-1')
    })
  })
})
