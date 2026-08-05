import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@firstcrop/db';

@Injectable()
export class RawMaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filters?: {
      category?: string;
      search?: string;
    },
  ) {
    const where: Prisma.RawMaterialWhereInput = {
      organizationId,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.prisma.rawMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const rawMaterial = await this.prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        batchIngredients: true,
        inventory: true,
      },
    });

    if (!rawMaterial) {
      throw new NotFoundException(`Raw material with ID ${id} not found`);
    }

    return rawMaterial;
  }

  async create(data: Prisma.RawMaterialCreateInput) {
    const existing = await this.prisma.rawMaterial.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new BadRequestException(`Raw material with code ${data.code} already exists`);
    }

    return this.prisma.rawMaterial.create({ data });
  }

  async update(id: string, data: Prisma.RawMaterialUpdateInput) {
    await this.findOne(id);

    return this.prisma.rawMaterial.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const rawMaterial = await this.prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        batchIngredients: true,
        inventory: true,
        purchaseOrderItems: true,
        inventoryMovements: true,
      },
    });

    if (!rawMaterial) {
      throw new NotFoundException(`Raw material with ID ${id} not found`);
    }

    if (
      rawMaterial.batchIngredients.length > 0 ||
      rawMaterial.inventory.length > 0 ||
      rawMaterial.purchaseOrderItems.length > 0 ||
      rawMaterial.inventoryMovements.length > 0
    ) {
      throw new BadRequestException('Cannot delete raw material with existing dependencies');
    }

    return this.prisma.rawMaterial.delete({ where: { id } });
  }

  async getStats(organizationId: string) {
    const total = await this.prisma.rawMaterial.count({
      where: { organizationId },
    });

    const byCategory = await this.prisma.rawMaterial.groupBy({
      by: ['category'],
      where: { organizationId },
      _count: true,
    });

    const totalStockValue = await this.prisma.rawMaterial.aggregate({
      where: { organizationId },
      _sum: {
        currentStock: true,
      },
    });

    return {
      total,
      byCategory,
      totalStockValue: totalStockValue._sum.currentStock || 0,
    };
  }

  async getLowStock(organizationId: string) {
    const allMaterials = await this.prisma.rawMaterial.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: { currentStock: 'asc' },
    });

    return allMaterials.filter(
      (m) => Number(m.currentStock) <= Number(m.reorderLevel),
    );
  }
}
