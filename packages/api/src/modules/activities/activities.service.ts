import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Activity, Prisma } from '@firstcrop/db';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    organizationId?: string;
    entityType?: string;
    entityId?: string;
    type?: string;
    limit?: number;
  }): Promise<Activity[]> {
    const where: Prisma.ActivityWhereInput = {
      ...(filters?.organizationId && { organizationId: filters.organizationId }),
      ...(filters?.entityType && { entityType: filters.entityType }),
      ...(filters?.entityId && { entityId: filters.entityId }),
      ...(filters?.type && { type: filters.type }),
    };

    return this.prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        party: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { performedAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        party: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    return activity;
  }

  async create(data: {
    entityType: string;
    entityId: string;
    type: string;
    title: string;
    organizationId?: string;
    description?: string;
    metadata?: Prisma.InputJsonValue;
    userId?: string;
    contactId?: string;
    partyId?: string;
  }): Promise<Activity> {
    return this.prisma.activity.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        type: data.type,
        title: data.title,
        organizationId: data.organizationId,
        description: data.description,
        metadata: data.metadata,
        userId: data.userId,
        contactId: data.contactId,
        partyId: data.partyId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        party: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: string): Promise<Activity> {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    return this.prisma.activity.delete({
      where: { id },
    });
  }
}
