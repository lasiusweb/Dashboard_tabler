import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { LogisticsService } from './logistics.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('LogisticsService', () => {
  let service: LogisticsService
  let prisma: {
    shipment: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
    }
    salesOrder: { findUnique: ReturnType<typeof vi.fn> }
    vehicle: {
      findUnique: ReturnType<typeof vi.fn>
      findMany: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    prisma = {
      shipment: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      salesOrder: { findUnique: vi.fn() },
      vehicle: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
    }
    service = new LogisticsService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('builds a flat where clause from filters', async () => {
      prisma.shipment.findMany.mockResolvedValue([])
      await service.findAll('org-1', { status: 'IN_TRANSIT', salesOrderId: 'so-1' })
      const arg = prisma.shipment.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({ organizationId: 'org-1', status: 'IN_TRANSIT', salesOrderId: 'so-1' })
      expect(arg.orderBy).toEqual({ createdAt: 'desc' })
    })
  })

  describe('findOne', () => {
    it('throws NotFoundException when the shipment does not exist', async () => {
      prisma.shipment.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })

    it('returns the shipment when found', async () => {
      prisma.shipment.findUnique.mockResolvedValue({ id: 's-1' })
      await expect(service.findOne('s-1')).resolves.toEqual({ id: 's-1' })
    })
  })

  describe('findByShipmentNumber', () => {
    it('queries by the shipment number', async () => {
      prisma.shipment.findUnique.mockResolvedValue(null)
      await service.findByShipmentNumber('SHP-001')
      expect(prisma.shipment.findUnique).toHaveBeenCalledWith({
        where: { shipmentNumber: 'SHP-001' },
        include: { salesOrder: true, vehicle: true },
      })
    })
  })

  describe('create', () => {
    const validData = { organizationId: 'org-1' }

    it('throws BadRequestException when the sales order is missing', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(null)
      await expect(service.create({ ...validData, salesOrderId: 'so-1' })).rejects.toThrow(BadRequestException)
      expect(prisma.shipment.create).not.toHaveBeenCalled()
    })

    it('throws BadRequestException when the vehicle is missing', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1' })
      prisma.vehicle.findUnique.mockResolvedValue(null)
      await expect(service.create({ ...validData, vehicleId: 'v-1' })).rejects.toThrow(BadRequestException)
    })

    it('creates a PREPARING shipment with a generated number', async () => {
      prisma.shipment.count.mockResolvedValue(0)
      prisma.shipment.create.mockImplementation(({ data }: any) => ({ id: 's-1', ...data }))
      const result = await service.create(validData)
      expect(result.shipmentNumber).toMatch(/^SHP-\d+-0001$/)
      expect(result.status).toBe('PREPARING')
    })
  })

  describe('loadShipment', () => {
    it('throws BadRequestException when the shipment is not PREPARING', async () => {
      prisma.shipment.findUnique.mockResolvedValue({ id: 's-1', status: 'LOADED' })
      await expect(service.loadShipment('s-1')).rejects.toThrow(BadRequestException)
    })

    it('moves the shipment to LOADED', async () => {
      prisma.shipment.findUnique.mockResolvedValue({ id: 's-1', status: 'PREPARING' })
      prisma.shipment.update.mockResolvedValue({ id: 's-1' })
      await service.loadShipment('s-1')
      expect(prisma.shipment.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'LOADED' } }))
    })
  })

  describe('dispatch', () => {
    it('throws BadRequestException when the shipment is not LOADED', async () => {
      prisma.shipment.findUnique.mockResolvedValue({ id: 's-1', status: 'PREPARING' })
      await expect(service.dispatch('s-1')).rejects.toThrow(BadRequestException)
    })

    it('moves the shipment to IN_TRANSIT with a dispatched timestamp', async () => {
      prisma.shipment.findUnique.mockResolvedValue({ id: 's-1', status: 'LOADED' })
      prisma.shipment.update.mockResolvedValue({ id: 's-1' })
      await service.dispatch('s-1')
      const arg = prisma.shipment.update.mock.calls[0][0]
      expect(arg.data).toMatchObject({ status: 'IN_TRANSIT', dispatchedAt: expect.any(Date) })
    })
  })

  describe('deliver', () => {
    it('throws BadRequestException when the shipment is not in transit', async () => {
      prisma.shipment.findUnique.mockResolvedValue({ id: 's-1', status: 'PREPARING' })
      await expect(service.deliver('s-1')).rejects.toThrow(BadRequestException)
    })

    it('moves the shipment to DELIVERED', async () => {
      prisma.shipment.findUnique.mockResolvedValue({ id: 's-1', status: 'IN_TRANSIT' })
      prisma.shipment.update.mockResolvedValue({ id: 's-1' })
      await service.deliver('s-1')
      const arg = prisma.shipment.update.mock.calls[0][0]
      expect(arg.data).toMatchObject({
        status: 'DELIVERED',
        deliveredAt: expect.any(Date),
        actualArrival: expect.any(Date),
      })
    })
  })

  describe('updateTemperatureLog and updateGPSLog', () => {
    it('stores a temperature log', async () => {
      const log = [{ timestamp: new Date(), temperature: 4.5 }]
      prisma.shipment.update.mockResolvedValue({ id: 's-1' })
      await service.updateTemperatureLog('s-1', log)
      expect(prisma.shipment.update.mock.calls[0][0].data.temperatureLog).toBe(log)
    })

    it('stores a GPS log', async () => {
      const log = [{ timestamp: new Date(), lat: 12.3, lng: 67.8 }]
      prisma.shipment.update.mockResolvedValue({ id: 's-1' })
      await service.updateGPSLog('s-1', log)
      expect(prisma.shipment.update.mock.calls[0][0].data.gpsLog).toBe(log)
    })
  })

  describe('getVehicles', () => {
    it('includes active shipments in the select', async () => {
      prisma.vehicle.findMany.mockResolvedValue([])
      await service.getVehicles('org-1')
      const arg = prisma.vehicle.findMany.mock.calls[0][0]
      expect(arg.include.shipments.where.status).toEqual({ in: ['PREPARING', 'LOADED', 'IN_TRANSIT'] })
      expect(arg.orderBy).toEqual({ registrationNumber: 'asc' })
    })
  })

  describe('createVehicle', () => {
    it('creates a vehicle with cold chain defaulted to false', async () => {
      prisma.vehicle.create.mockImplementation(({ data }: any) => ({ id: 'v-1', ...data }))
      const result = await service.createVehicle({ registrationNumber: 'UP12AB1234', type: 'Truck' })
      expect(result).toMatchObject({ id: 'v-1', hasColdChain: false })
    })
  })

  describe('getLogisticsStats', () => {
    it('aggregates shipment counts and vehicle activity', async () => {
      prisma.shipment.count.mockResolvedValueOnce(10)
      prisma.shipment.groupBy.mockResolvedValue([{ status: 'DELIVERED', _count: 4 }])
      prisma.shipment.count.mockResolvedValueOnce(2)
      prisma.shipment.count.mockResolvedValueOnce(4)
      prisma.vehicle.count.mockResolvedValue(5)
      prisma.vehicle.findMany.mockResolvedValue([{ id: 'v-1' }, { id: 'v-2' }])

      const stats = await service.getLogisticsStats('org-1')

      expect(stats.total).toBe(10)
      expect(stats.byStatus).toEqual([{ status: 'DELIVERED', _count: 4 }])
      expect(stats.inTransit).toBe(2)
      expect(stats.delivered).toBe(4)
      expect(stats.totalVehicles).toBe(5)
      expect(stats.activeVehicles).toBe(2)
    })
  })
})
