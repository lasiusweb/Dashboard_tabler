import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Shipment, Prisma } from '@firstcrop/db';

@Injectable()
export class LogisticsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filters?: {
      status?: string;
      salesOrderId?: string;
    },
  ): Promise<Shipment[]> {
    const where: Prisma.ShipmentWhereInput = {
      organizationId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.salesOrderId && { salesOrderId: filters.salesOrderId }),
    };

    return this.prisma.shipment.findMany({
      where,
      include: {
        salesOrder: {
          select: {
            id: true,
            orderNumber: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
        delivery: {
          select: {
            id: true,
            deliveryNumber: true,
            status: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            type: true,
            hasColdChain: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        salesOrder: {
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        delivery: true,
        vehicle: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }

    return shipment;
  }

  async findByShipmentNumber(shipmentNumber: string): Promise<Shipment | null> {
    return this.prisma.shipment.findUnique({
      where: { shipmentNumber },
      include: {
        salesOrder: true,
        vehicle: true,
      },
    });
  }

  async create(data: {
    organizationId: string;
    salesOrderId?: string;
    deliveryId?: string;
    vehicleId?: string;
    notes?: string;
  }): Promise<Shipment> {
    // Validate sales order exists if provided
    if (data.salesOrderId) {
      const salesOrder = await this.prisma.salesOrder.findUnique({
        where: { id: data.salesOrderId },
      });

      if (!salesOrder) {
        throw new BadRequestException(`Sales order with ID ${data.salesOrderId} not found`);
      }
    }

    // Validate vehicle exists if provided
    if (data.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new BadRequestException(`Vehicle with ID ${data.vehicleId} not found`);
      }
    }

    // Generate shipment number
    const shipmentCount = await this.prisma.shipment.count({
      where: { organizationId: data.organizationId },
    });
    const shipmentNumber = `SHP-${Date.now()}-${(shipmentCount + 1).toString().padStart(4, '0')}`;

    return this.prisma.shipment.create({
      data: {
        shipmentNumber,
        organizationId: data.organizationId,
        salesOrderId: data.salesOrderId,
        deliveryId: data.deliveryId,
        vehicleId: data.vehicleId,
        status: 'PREPARING',
        notes: data.notes,
      },
      include: {
        salesOrder: true,
        vehicle: true,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.ShipmentUpdateInput,
  ): Promise<Shipment> {
    return this.prisma.shipment.update({
      where: { id },
      data,
      include: {
        salesOrder: true,
        vehicle: true,
      },
    });
  }

  async loadShipment(id: string): Promise<Shipment> {
    const shipment = await this.findOne(id);

    if (shipment.status !== 'PREPARING') {
      throw new BadRequestException('Shipment must be in PREPARING status to load');
    }

    return this.prisma.shipment.update({
      where: { id },
      data: {
        status: 'LOADED',
      },
      include: {
        salesOrder: true,
        vehicle: true,
      },
    });
  }

  async dispatch(id: string): Promise<Shipment> {
    const shipment = await this.findOne(id);

    if (shipment.status !== 'LOADED') {
      throw new BadRequestException('Shipment must be in LOADED status to dispatch');
    }

    return this.prisma.shipment.update({
      where: { id },
      data: {
        status: 'IN_TRANSIT',
        dispatchedAt: new Date(),
      },
      include: {
        salesOrder: true,
        vehicle: true,
      },
    });
  }

  async deliver(id: string): Promise<Shipment> {
    const shipment = await this.findOne(id);

    if (shipment.status !== 'IN_TRANSIT' && shipment.status !== 'OUT_FOR_DELIVERY') {
      throw new BadRequestException('Shipment must be IN_TRANSIT or OUT_FOR_DELIVERY to deliver');
    }

    return this.prisma.shipment.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        actualArrival: new Date(),
      },
      include: {
        salesOrder: true,
        vehicle: true,
      },
    });
  }

  async updateTemperatureLog(id: string, temperatureLog: Array<{
    timestamp: Date;
    temperature: number;
  }>): Promise<Shipment> {
    return this.prisma.shipment.update({
      where: { id },
      data: {
        temperatureLog: temperatureLog,
      },
      include: {
        salesOrder: true,
        vehicle: true,
      },
    });
  }

  async updateGPSLog(id: string, gpsLog: Array<{
    timestamp: Date;
    lat: number;
    lng: number;
  }>): Promise<Shipment> {
    return this.prisma.shipment.update({
      where: { id },
      data: {
        gpsLog: gpsLog,
      },
      include: {
        salesOrder: true,
        vehicle: true,
      },
    });
  }

  async getVehicles(organizationId?: string) {
    return this.prisma.vehicle.findMany({
      where: organizationId ? {} : {},
      include: {
        shipments: {
          where: {
            status: { in: ['PREPARING', 'LOADED', 'IN_TRANSIT'] },
          },
          select: {
            id: true,
            shipmentNumber: true,
          },
        },
      },
      orderBy: { registrationNumber: 'asc' },
    });
  }

  async createVehicle(data: {
    registrationNumber: string;
    type: string;
    capacity?: number;
    capacityUnit?: string;
    hasColdChain?: boolean;
    minTemp?: number;
    maxTemp?: number;
    gpsTrackingId?: string;
    driverName?: string;
    driverPhone?: string;
  }) {
    return this.prisma.vehicle.create({
      data: {
        registrationNumber: data.registrationNumber,
        type: data.type,
        capacity: data.capacity,
        capacityUnit: data.capacityUnit,
        hasColdChain: data.hasColdChain || false,
        minTemp: data.minTemp,
        maxTemp: data.maxTemp,
        gpsTrackingId: data.gpsTrackingId,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
      },
    });
  }

  async getLogisticsStats(organizationId: string) {
    const totalShipments = await this.prisma.shipment.count({
      where: { organizationId },
    });

    const byStatus = await this.prisma.shipment.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
    });

    const inTransit = await this.prisma.shipment.count({
      where: {
        organizationId,
        status: { in: ['LOADED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      },
    });

    const delivered = await this.prisma.shipment.count({
      where: {
        organizationId,
        status: 'DELIVERED',
      },
    });

    const totalVehicles = await this.prisma.vehicle.count();

    const activeVehicles = await this.prisma.vehicle.findMany({
      where: {
        shipments: {
          some: {
            status: { in: ['PREPARING', 'LOADED', 'IN_TRANSIT'] },
          },
        },
      },
    });

    return {
      total: totalShipments,
      byStatus,
      inTransit,
      delivered,
      totalVehicles,
      activeVehicles: activeVehicles.length,
    };
  }
}
