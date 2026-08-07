import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PartiesController } from './parties.controller'
import { PartiesService } from './parties.service'

describe('PartiesController', () => {
  let controller: PartiesController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    getStats: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
    getContacts: ReturnType<typeof vi.fn>
    addContact: ReturnType<typeof vi.fn>
    updateContact: ReturnType<typeof vi.fn>
    removeContact: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      getStats: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      getContacts: vi.fn(),
      addContact: vi.fn(),
      updateContact: vi.fn(),
      removeContact: vi.fn(),
    }
    controller = new PartiesController(service as unknown as PartiesService)
  })

  describe('findAll', () => {
    it('passes filters to the service', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', 'CUSTOMER')
      expect(service.findAll).toHaveBeenCalledWith('org-1', { type: 'CUSTOMER' })
    })

    it('omits optional filters when not provided', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1')
      expect(service.findAll).toHaveBeenCalledWith('org-1', { type: undefined })
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
      service.findOne.mockResolvedValue({ id: 'p-1' })
      await expect(controller.findOne('p-1')).resolves.toEqual({ id: 'p-1' })
      expect(service.findOne).toHaveBeenCalledWith('p-1')
    })
  })

  describe('create', () => {
    it('delegates to the service with the body', async () => {
      const body = { name: 'Agri Corp' }
      service.create.mockResolvedValue({ id: 'p-1', ...body })
      await expect(controller.create(body as never)).resolves.toEqual({ id: 'p-1', ...body })
      expect(service.create).toHaveBeenCalledWith(body)
    })
  })

  describe('update', () => {
    it('delegates id and body to the service', async () => {
      const body = { name: 'Agri Corp 2' }
      service.update.mockResolvedValue({ id: 'p-1', ...body })
      await expect(controller.update('p-1', body)).resolves.toEqual({ id: 'p-1', ...body })
      expect(service.update).toHaveBeenCalledWith('p-1', body)
    })
  })

  describe('remove', () => {
    it('delegates to the service with the id', async () => {
      service.remove.mockResolvedValue({ id: 'p-1' })
      await expect(controller.remove('p-1')).resolves.toEqual({ id: 'p-1' })
      expect(service.remove).toHaveBeenCalledWith('p-1')
    })
  })

  describe('getContacts', () => {
    it('delegates to the service with the party id', async () => {
      service.getContacts.mockResolvedValue([])
      await expect(controller.getContacts('p-1')).resolves.toEqual([])
      expect(service.getContacts).toHaveBeenCalledWith('p-1')
    })
  })

  describe('addContact', () => {
    it('delegates party id and body to the service', async () => {
      const body = { firstName: 'John' }
      service.addContact.mockResolvedValue({ id: 'c-1', ...body })
      await expect(controller.addContact('p-1', body as never)).resolves.toEqual({ id: 'c-1', ...body })
      expect(service.addContact).toHaveBeenCalledWith('p-1', body)
    })
  })

  describe('updateContact', () => {
    it('delegates contact id and body to the service', async () => {
      const body = { firstName: 'Jane' }
      service.updateContact.mockResolvedValue({ id: 'c-1', ...body })
      await expect(controller.updateContact('c-1', body)).resolves.toEqual({ id: 'c-1', ...body })
      expect(service.updateContact).toHaveBeenCalledWith('c-1', body)
    })
  })

  describe('removeContact', () => {
    it('delegates to the service with the contact id', async () => {
      service.removeContact.mockResolvedValue({ id: 'c-1' })
      await expect(controller.removeContact('c-1')).resolves.toEqual({ id: 'c-1' })
      expect(service.removeContact).toHaveBeenCalledWith('c-1')
    })
  })
})
