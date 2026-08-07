import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LogisticsController } from './logistics.controller'
import { LogisticsService } from './logistics.service'

describe('LogisticsController', () => {
  let controller: LogisticsController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    getLogisticsStats: ReturnType<typeof vi.fn>
    getVehicles: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    findByShipmentNumber: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    loadShipment: ReturnType<typeof vi.fn>
    dispatch: ReturnType<typeof vi.fn>
    deliver: ReturnType<typeof vi.fn>
    updateTemperatureLog: ReturnType<typeof vi.fn>
    updateGPSLog: ReturnType<typeof vi.fn>
    createVehicle: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      getLogisticsStats: vi.fn(),
      getVehicles: vi.fn(),
      findOne: vi.fn(),
      findByShipmentNumber: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      loadShipment: vi.fn(),
      dispatch: vi.fn(),
      deliver: vi.fn(),
      updateTemperatureLog: vi.fn(),
      updateGPSLog: vi.fn(),
      createVehicle: vi.fn(),
    }
    controller = new LogisticsController(service as unknown as LogisticsService)
  })

  describe('findAll', () => {
    it('passes filters to the service', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1', 'IN_TRANSIT', 'so-1')
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        status: 'IN_TRANSIT',
        salesOrderId: 'so-1',
      })
    })

    it('omits optional filters when not provided', async () => {
      service.findAll.mockResolvedValue([])
      await controller.findAll('org-1')
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        status: undefined,
        salesOrderId: undefined,
      })
    })
  })

  describe('getStats', () => {
    it('delegates the organizationId', async () => {
      service.getLogisticsStats.mockResolvedValue({ total: 1 })
      await expect(controller.getStats('org-1')).resolves.toEqual({ total: 1 })
      expect(service.getLogisticsStats).toHaveBeenCalledWith('org-1')
    })
  })

  describe('getVehicles', () => {
    it('delegates to the service', async () => {
      service.getVehicles.mockResolvedValue([])
      await expect(controller.getVehicles()).resolves.toEqual([])
      expect(service.getVehicles).toHaveBeenCalledWith()
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 's-1' })
      await expect(controller.findOne('s-1')).resolves.toEqual({ id: 's-1' })
      expect(service.findOne).toHaveBeenCalledWith('s-1')
    })
  })

  describe('findByShipmentNumber', () => {
    it('delegates to the service with the shipment number', async () => {
      service.findByShipmentNumber.mockResolvedValue({ shipmentNumber: 'SH-1' })
      await expect(controller.findByShipmentNumber('SH-1')).resolves.toEqual({ shipmentNumber: 'SH-1' })
      expect(service.findByShipmentNumber).toHaveBeenCalledWith('SH-1')
    })
  })

  describe('create', () => {
    it('delegates to the service with the body', async () => {
      const body = { shipmentNumber: 'SH-2' }
      service.create.mockResolvedValue({ id: 's-2', ...body })
      await expect(controller.create(body as never)).resolves.toEqual({ id: 's-2', ...body })
      expect(service.create).toHaveBeenCalledWith(body)
    })
  })

  describe('update', () => {
    it('delegates id and body to the service', async () => {
      const body = { status: 'READY' }
      service.update.mockResolvedValue({ id: 's-1', ...body })
      await expect(controller.update('s-1', body)).resolves.toEqual({ id: 's-1', ...body })
      expect(service.update).toHaveBeenCalledWith('s-1', body)
    })
  })

  describe('loadShipment', () => {
    it('delegates to the service with the id', async () => {
      service.loadShipment.mockResolvedValue({ id: 's-1' })
      await expect(controller.loadShipment('s-1')).resolves.toEqual({ id: 's-1' })
      expect(service.loadShipment).toHaveBeenCalledWith('s-1')
    })
  })

  describe('dispatch', () => {
    it('delegates to the service with the id', async () => {
      service.dispatch.mockResolvedValue({ id: 's-1' })
      await expect(controller.dispatch('s-1')).resolves.toEqual({ id: 's-1' })
      expect(service.dispatch).toHaveBeenCalledWith('s-1')
    })
  })

  describe('deliver', () => {
    it('delegates to the service with the id', async () => {
      service.deliver.mockResolvedValue({ id: 's-1' })
      await expect(controller.deliver('s-1')).resolves.toEqual({ id: 's-1' })
      expect(service.deliver).toHaveBeenCalledWith('s-1')
    })
  })

  describe('updateTemperatureLog', () => {
    it('passes the temperature log array from the body', async () => {
      const entry = { timestamp: new Date('2026-01-01'), temperature: 4 }
      service.updateTemperatureLog.mockResolvedValue({ id: 's-1' })
      await expect(controller.updateTemperatureLog('s-1', { temperatureLog: [entry] })).resolves.toEqual({ id: 's-1' })
      expect(service.updateTemperatureLog).toHaveBeenCalledWith('s-1', [entry])
    })
  })

  describe('updateGPSLog', () => {
    it('passes the gps log array from the body', async () => {
      const entry = { timestamp: new Date('2026-01-01'), lat: 12.9, lng: 77.5 }
      service.updateGPSLog.mockResolvedValue({ id: 's-1' })
      await expect(controller.updateGPSLog('s-1', { gpsLog: [entry] })).resolves.toEqual({ id: 's-1' })
      expect(service.updateGPSLog).toHaveBeenCalledWith('s-1', [entry])
    })
  })

  describe('createVehicle', () => {
    it('delegates to the service with the body', async () => {
      const body = { registrationNumber: 'KA-01-AB-1234' }
      service.createVehicle.mockResolvedValue({ id: 'v-1', ...body })
      await expect(controller.createVehicle(body as never)).resolves.toEqual({ id: 'v-1', ...body })
      expect(service.createVehicle).toHaveBeenCalledWith(body)
    })
  })
})
