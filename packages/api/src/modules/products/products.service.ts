import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Product, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filters?: {
      category?: string;
      isActive?: boolean;
      search?: string;
    },
  ): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {
      organizationId,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { strainName: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        batches: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { sku },
    });
  }

  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return this.prisma.product.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }

  async getStats(organizationId: string) {
    const totalProducts = await this.prisma.product.count({
      where: { organizationId },
    });

    const byCategory = await this.prisma.product.groupBy({
      by: ['category'],
      where: { organizationId },
      _count: true,
    });

    const activeProducts = await this.prisma.product.count({
      where: { organizationId, isActive: true },
    });

    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        organizationId,
        isActive: true,
        inventory: {
          some: {
            quantity: { lte: 10 }, // Low stock threshold
          },
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        inventory: {
          select: {
            quantity: true,
            unit: true,
          },
        },
      },
    });

    return {
      total: totalProducts,
      active: activeProducts,
      byCategory,
      lowStock: lowStockProducts,
    };
  }

  async getStrainStats(organizationId: string) {
    const strains = await this.prisma.product.groupBy({
      by: ['strainName'],
      where: {
        organizationId,
        strainName: { not: null },
      },
      _count: true,
      _avg: {
        cfuPerGram: true,
        cfuPerMl: true,
      },
    });

    return strains;
  }
}
