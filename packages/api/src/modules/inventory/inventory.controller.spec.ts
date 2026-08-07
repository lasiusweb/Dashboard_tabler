import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InventoryController } from './inventory.controller'
import { InventoryService } from './inventory.service'

describe('InventoryController', () => {
  let controller: InventoryController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    getInventoryStats: ReturnType<typeof vi.fn>
    getLowStockItems: ReturnType<typeof vi.fn>
    getMovements: ReturnType<typeof vi.fn>
    getLocations: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    createMovement: ReturnType<typeof vi.fn>
    createLocation: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      getInventoryStats: vi.fn(),
      getLowStockItems: vi.fn(),
      getMovements: vi.fn(),
      getLocations: vi.fn(),
      findOne: vi.fn(),
      createMovement: vi.fn(),
      createLocation: vi.fn(),
    }
    controller = new InventoryController(service as unknown as InventoryService)
  })

  describe('findAll', () => {
    it('passes filters to the service', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', 'loc-1', 'p-1', 'rm-1', true)
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        locationId: 'loc-1',
        productId: 'p-1',
        rawMaterialId: 'rm-1',
        lowStock: true,
      })
    })

    it('omits optional filters when not provided', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1')
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        locationId: undefined,
        productId: undefined,
        rawMaterialId: undefined,
        lowStock: undefined,
      })
    })
  })

  describe('getStats', () => {
    it('delegates the organizationId', async () => {
      service.getInventoryStats.mockResolvedValue({ total: 1 })
      await expect(controller.getStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getInventoryStats).toHaveBeenCalledWith('org-1')
    })
  })

  describe('getLowStock', () => {
    it('delegates the organizationId', async () => {
      service.getLowStockItems.mockResolvedValue([])
      await expect(controller.getLowStock('org-1')).resolves.toEqual([])
      expect(service.getLowStockItems).toHaveBeenCalledWith('org-1')
    })
  })

  describe('getMovements', () => {
    it('passes filters to the service', async () => {
      service.getMovements.mockResolvedValue([])
      await controller.getMovements('org-1', 'p-1', 'rm-1', 'IN')
      expect(service.getMovements).toHaveBeenCalledWith('org-1', {
        productId: 'p-1',
        rawMaterialId: 'rm-1',
        type: 'IN',
      })
    })
  })

  describe('getLocations', () => {
    it('delegates the organizationId', async () => {
      service.getLocations.mockResolvedValue([])
      await expect(controller.getLocations('org-1')).resolves.toEqual([])
      expect(service.getLocations).toHaveBeenCalledWith('org-1')
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 'i-1' })
      await expect(controller.findOne('i-1')).resolves.toEqual({ id: 'i-1' })
      expect(service.findOne).toHaveBeenCalledWith('i-1')
    })
  })

  describe('createMovement', () => {
    it('delegates to the service with the body', async () => {
      const body = { type: 'IN', quantity: 5 }
      service.createMovement.mockResolvedValue({ id: 'm-1', ...body })
      await expect(controller.createMovement(body as never)).resolves.toEqual({ id: 'm-1', ...body })
      expect(service.createMovement).toHaveBeenCalledWith(body)
    })
  })

  describe('createLocation', () => {
    it('delegates to the service with the body', async () => {
      const body = { name: 'Warehouse A' }
      service.createLocation.mockResolvedValue({ id: 'loc-1', ...body })
      await expect(controller.createLocation(body as never)).resolves.toEqual({ id: 'loc-1', ...body })
      expect(service.createLocation).toHaveBeenCalledWith(body)
    })
  })
})
