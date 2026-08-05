import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FieldVisit, Prisma } from '@firstcrop/db';

@Injectable()
export class FieldVisitsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    organizationId?: string;
    visitedById?: string;
    status?: string;
    visitType?: string;
  }): Promise<FieldVisit[]> {
    const where: Prisma.FieldVisitWhereInput = {
      ...(filters?.visitedById && { visitedById: filters.visitedById }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.visitType && { visitType: filters.visitType }),
      ...(filters?.organizationId && {
        party: { organizationId: filters.organizationId },
      }),
    };

    return this.prisma.fieldVisit.findMany({
      where,
      include: {
        party: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        visitor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  async findOne(id: string): Promise<FieldVisit> {
    const fieldVisit = await this.prisma.fieldVisit.findUnique({
      where: { id },
      include: {
        party: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        visitor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!fieldVisit) {
      throw new NotFoundException(`Field visit with ID ${id} not found`);
    }

    return fieldVisit;
  }

  async create(data: {
    partyId: string;
    visitedById: string;
    visitType: string;
    scheduledDate: string;
    location?: string;
    notes?: string;
    latitude?: string;
    longitude?: string;
  }): Promise<FieldVisit> {
    const party = await this.prisma.party.findUnique({
      where: { id: data.partyId },
    });

    if (!party) {
      throw new BadRequestException(`Party with ID ${data.partyId} not found`);
    }

    const visitor = await this.prisma.user.findUnique({
      where: { id: data.visitedById },
    });

    if (!visitor) {
      throw new BadRequestException(`User with ID ${data.visitedById} not found`);
    }

    return this.prisma.fieldVisit.create({
      data: {
        partyId: data.partyId,
        visitedById: data.visitedById,
        visitType: data.visitType,
        scheduledDate: new Date(data.scheduledDate),
        location: data.location,
        notes: data.notes,
        latitude: data.latitude ? new Prisma.Decimal(data.latitude) : undefined,
        longitude: data.longitude ? new Prisma.Decimal(data.longitude) : undefined,
      },
      include: {
        party: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        visitor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      status?: string;
      completedDate?: string;
      location?: string;
      notes?: string;
      findings?: string;
      recommendations?: string;
      photos?: string[];
    },
  ): Promise<FieldVisit> {
    const fieldVisit = await this.prisma.fieldVisit.findUnique({
      where: { id },
    });

    if (!fieldVisit) {
      throw new NotFoundException(`Field visit with ID ${id} not found`);
    }

    return this.prisma.fieldVisit.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.completedDate && { completedDate: new Date(data.completedDate) }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.findings !== undefined && { findings: data.findings }),
        ...(data.recommendations !== undefined && { recommendations: data.recommendations }),
        ...(data.photos && { photos: data.photos }),
      },
      include: {
        party: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        visitor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string): Promise<FieldVisit> {
    const fieldVisit = await this.prisma.fieldVisit.findUnique({
      where: { id },
    });

    if (!fieldVisit) {
      throw new NotFoundException(`Field visit with ID ${id} not found`);
    }

    return this.prisma.fieldVisit.delete({
      where: { id },
    });
  }

  async getStats(organizationId: string) {
    const fieldVisits = await this.prisma.fieldVisit.findMany({
      where: {
        party: { organizationId },
      },
      select: {
        status: true,
        visitType: true,
      },
    });

    const byStatus: Record<string, number> = {};
    const byVisitType: Record<string, number> = {};

    for (const visit of fieldVisits) {
      byStatus[visit.status] = (byStatus[visit.status] || 0) + 1;
      byVisitType[visit.visitType] = (byVisitType[visit.visitType] || 0) + 1;
    }

    return {
      total: fieldVisits.length,
      byStatus,
      byVisitType,
    };
  }
}
