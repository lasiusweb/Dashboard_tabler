import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Inventory, InventoryMovement, Prisma } from '@firstcrop/db';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filters?: {
      locationId?: string;
      productId?: string;
      rawMaterialId?: string;
      lowStock?: boolean;
    },
  ): Promise<Inventory[]> {
    const where: Prisma.InventoryWhereInput = {
      organizationId,
      ...(filters?.locationId && { locationId: filters.locationId }),
      ...(filters?.productId && { productId: filters.productId }),
      ...(filters?.rawMaterialId && { rawMaterialId: filters.rawMaterialId }),
    };

    return this.prisma.inventory.findMany({
      where,
      include: {
        location: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
          },
        },
        rawMaterial: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
          },
        },
      },
      orderBy: { lastUpdated: 'desc' },
    });
  }

  async findOne(id: string): Promise<Inventory> {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        location: true,
        product: true,
        rawMaterial: true,
      },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return inventory;
  }

  async getMovements(
    organizationId: string,
    filters?: {
      productId?: string;
      rawMaterialId?: string;
      type?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<InventoryMovement[]> {
    const where: Prisma.InventoryMovementWhereInput = {
      organizationId,
      ...(filters?.productId && { productId: filters.productId }),
      ...(filters?.rawMaterialId && { rawMaterialId: filters.rawMaterialId }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.startDate && filters?.endDate && {
        performedAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      }),
    };

    return this.prisma.inventoryMovement.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
        rawMaterial: {
          select: {
            name: true,
            code: true,
          },
        },
        fromLocation: {
          select: {
            name: true,
          },
        },
        toLocation: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { performedAt: 'desc' },
    });
  }

  async createMovement(data: {
    organizationId: string;
    type: string;
    productId?: string;
    rawMaterialId?: string;
    batchNumber?: string;
    fromLocationId?: string;
    toLocationId?: string;
    quantity: number;
    unit: string;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    performedById?: string;
  }): Promise<InventoryMovement> {
    // Validate locations exist if provided
    if (data.fromLocationId) {
      const fromLocation = await this.prisma.inventoryLocation.findUnique({
        where: { id: data.fromLocationId },
      });
      if (!fromLocation) {
        throw new BadRequestException(`From location with ID ${data.fromLocationId} not found`);
      }
    }

    if (data.toLocationId) {
      const toLocation = await this.prisma.inventoryLocation.findUnique({
        where: { id: data.toLocationId },
      });
      if (!toLocation) {
        throw new BadRequestException(`To location with ID ${data.toLocationId} not found`);
      }
    }

    // Create the movement
    const movement = await this.prisma.inventoryMovement.create({
      data: {
        organizationId: data.organizationId,
        type: data.type,
        productId: data.productId,
        rawMaterialId: data.rawMaterialId,
        batchNumber: data.batchNumber,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        quantity: data.quantity,
        unit: data.unit,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
        performedById: data.performedById,
      },
      include: {
        product: true,
        rawMaterial: true,
        fromLocation: true,
        toLocation: true,
      },
    });

    // Update inventory quantities
    await this.updateInventoryQuantities(data);

    return movement;
  }

  private async updateInventoryQuantities(data: {
    organizationId: string;
    type: string;
    productId?: string;
    rawMaterialId?: string;
    batchNumber?: string;
    fromLocationId?: string;
    toLocationId?: string;
    quantity: number;
    unit: string;
  }) {
    // Decrease from source location
    if (data.fromLocationId) {
      await this.adjustInventory(
        data.organizationId,
        data.fromLocationId,
        data.productId,
        data.rawMaterialId,
        data.batchNumber,
        -data.quantity,
        data.unit,
      );
    }

    // Increase at destination location
    if (data.toLocationId) {
      await this.adjustInventory(
        data.organizationId,
        data.toLocationId,
        data.productId,
        data.rawMaterialId,
        data.batchNumber,
        data.quantity,
        data.unit,
      );
    }
  }

  private async adjustInventory(
    organizationId: string,
    locationId: string,
    productId: string | undefined,
    rawMaterialId: string | undefined,
    batchNumber: string | undefined,
    quantityChange: number,
    unit: string,
  ) {
    // Find existing inventory record
    const existing = await this.prisma.inventory.findFirst({
      where: {
        organizationId,
        locationId,
        productId: productId || undefined,
        rawMaterialId: rawMaterialId || undefined,
        batchNumber: batchNumber || undefined,
      },
    });

    if (existing) {
      const newQuantity = existing.quantity.add(quantityChange);
      
      if (newQuantity.lessThan(0)) {
        throw new BadRequestException('Insufficient inventory quantity');
      }

      await this.prisma.inventory.update({
        where: { id: existing.id },
        data: {
          quantity: newQuantity,
          lastUpdated: new Date(),
        },
      });
    } else if (quantityChange > 0) {
      // Create new inventory record
      await this.prisma.inventory.create({
        data: {
          organizationId,
          locationId,
          productId,
          rawMaterialId,
          batchNumber,
          quantity: quantityChange,
          unit,
        },
      });
    }
  }

  async getLowStockItems(organizationId: string) {
    // Get raw materials below reorder level
    const lowStockRawMaterials = await this.prisma.rawMaterial.findMany({
      where: {
        isActive: true,
        currentStock: {
          lte: this.prisma.rawMaterial.fields.reorderLevel,
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        currentStock: true,
        reorderLevel: true,
        reorderQuantity: true,
        unit: true,
      },
    });

    return {
      rawMaterials: lowStockRawMaterials,
    };
  }

  async getInventoryStats(organizationId: string) {
    const totalItems = await this.prisma.inventory.count({
      where: { organizationId },
    });

    const totalValue = await this.prisma.inventory.aggregate({
      where: { organizationId },
      _sum: {
        quantity: true,
      },
    });

    const byLocation = await this.prisma.inventory.groupBy({
      by: ['locationId'],
      where: { organizationId },
      _count: true,
      _sum: {
        quantity: true,
      },
    });

    const expiringItems = await this.prisma.inventory.findMany({
      where: {
        organizationId,
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return {
      total: totalItems,
      totalQuantity: totalValue._sum.quantity,
      byLocation,
      expiringCount: expiringItems.length,
      expiringItems,
    };
  }

  async getLocations(organizationId: string) {
    return this.prisma.inventoryLocation.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            inventory: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createLocation(data: {
    organizationId: string;
    name: string;
    type: string;
    address?: string;
    capacity?: number;
    temperatureControlled?: boolean;
    minTemp?: number;
    maxTemp?: number;
  }) {
    return this.prisma.inventoryLocation.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        type: data.type,
        address: data.address,
        capacity: data.capacity,
        temperatureControlled: data.temperatureControlled || false,
        minTemp: data.minTemp,
        maxTemp: data.maxTemp,
      },
    });
  }
}
