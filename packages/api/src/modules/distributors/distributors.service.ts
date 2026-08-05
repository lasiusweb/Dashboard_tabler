import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@firstcrop/db';

@Injectable()
export class DistributorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filters?: {
      territory?: string;
      state?: string;
    },
  ) {
    const where: Prisma.DistributorWhereInput = {
      party: { organizationId },
      ...(filters?.territory && { territory: filters.territory }),
      ...(filters?.state && { state: filters.state }),
    };

    return this.prisma.distributor.findMany({
      where,
      include: { party: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const distributor = await this.prisma.distributor.findUnique({
      where: { id },
      include: {
        party: true,
        fieldAgent: true,
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!distributor) {
      throw new NotFoundException(`Distributor with ID ${id} not found`);
    }

    return distributor;
  }

  async create(data: {
    partyId: string;
    territory: string;
    region?: string;
    state?: string;
    district?: string;
    targetQuantity?: number;
    currentQuantity?: number;
    commissionRate?: number;
    coldStorageAvail?: boolean;
    fieldAgentId?: string;
    rating?: number;
    isActive?: boolean;
  }) {
    const existing = await this.prisma.distributor.findUnique({
      where: { partyId: data.partyId },
    });

    if (existing) {
      throw new BadRequestException('This party is already a distributor');
    }

    return this.prisma.distributor.create({
      data: {
        territory: data.territory,
        region: data.region,
        state: data.state,
        district: data.district,
        targetQuantity: data.targetQuantity,
        currentQuantity: data.currentQuantity,
        commissionRate: data.commissionRate,
        coldStorageAvail: data.coldStorageAvail ?? false,
        rating: data.rating,
        isActive: data.isActive ?? true,
        party: { connect: { id: data.partyId } },
        ...(data.fieldAgentId && {
          fieldAgent: { connect: { id: data.fieldAgentId } },
        }),
      },
      include: { party: true },
    });
  }

  async update(id: string, data: Prisma.DistributorUpdateInput) {
    await this.findOne(id);

    return this.prisma.distributor.update({
      where: { id },
      data,
      include: { party: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.distributor.delete({
      where: { id },
    });
  }

  async getStats(organizationId: string) {
    const where: Prisma.DistributorWhereInput = {
      party: { organizationId },
    };

    const total = await this.prisma.distributor.count({ where });

    const byTerritory = await this.prisma.distributor.groupBy({
      by: ['territory'],
      where,
      _count: true,
    });

    const avgRating = await this.prisma.distributor.aggregate({
      where: { ...where, rating: { not: null } },
      _avg: { rating: true },
    });

    return {
      total,
      byTerritory,
      avgRating: avgRating._avg.rating || 0,
    };
  }
}
