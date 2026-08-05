import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@firstcrop/db';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.organization.findMany({
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        members: { include: { user: true } },
        invitations: { include: { invitedBy: true } },
      },
    });
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return org;
  }

  async create(data: Prisma.OrganizationCreateInput, invitedById?: string) {
    const org = await this.prisma.organization.create({
      data,
      include: {
        members: { include: { user: true } },
      },
    });

    if (invitedById) {
      const existingMember = await this.prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: invitedById,
          },
        },
      });

      if (!existingMember) {
        await this.prisma.member.create({
          data: {
            organizationId: org.id,
            userId: invitedById,
            role: 'owner',
          },
        });
      }
    }

    return this.findOne(org.id);
  }

  async update(id: string, data: Prisma.OrganizationUpdateInput) {
    await this.findOne(id);
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.organization.delete({ where: { id } });
  }

  async getMembers(organizationId: string) {
    await this.findOne(organizationId);
    return this.prisma.member.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(organizationId: string, userId: string, role?: string) {
    await this.findOne(organizationId);

    const existing = await this.prisma.member.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a member of this organization');
    }

    return this.prisma.member.create({
      data: {
        organizationId,
        userId,
        role: role || 'member',
      },
      include: { user: true },
    });
  }

  async removeMember(organizationId: string, memberId: string) {
    await this.findOne(organizationId);
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found in this organization`);
    }
    return this.prisma.member.delete({ where: { id: memberId } });
  }

  async updateMemberRole(organizationId: string, memberId: string, role: string) {
    await this.findOne(organizationId);
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found in this organization`);
    }
    return this.prisma.member.update({
      where: { id: memberId },
      data: { role },
      include: { user: true },
    });
  }

  async invite(organizationId: string, email: string, role: string, invitedById: string) {
    await this.findOne(organizationId);

    const existing = await this.prisma.invitation.findUnique({
      where: {
        organizationId_email: { organizationId, email },
      },
    });

    if (existing && existing.status === 'pending') {
      throw new BadRequestException('An invitation is already pending for this email');
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.invitation.create({
      data: {
        organizationId,
        email,
        role: role || 'member',
        token,
        expiresAt,
        invitedById,
        status: 'pending',
      },
      include: { invitedBy: true },
    });
  }

  async getInvitations(organizationId: string) {
    await this.findOne(organizationId);
    return this.prisma.invitation.findMany({
      where: { organizationId },
      include: { invitedBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvitation(organizationId: string, invitationId: string) {
    await this.findOne(organizationId);
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, organizationId },
    });
    if (!invitation) {
      throw new NotFoundException(`Invitation with ID ${invitationId} not found in this organization`);
    }
    return this.prisma.invitation.delete({ where: { id: invitationId } });
  }
}
