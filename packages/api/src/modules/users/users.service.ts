import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@firstcrop/db';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId?: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: organizationId
        ? {
            members: {
              some: { organizationId },
            },
          }
        : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async update(
    id: string,
    data: Partial<User>,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async getStats(organizationId: string) {
    const totalUsers = await this.prisma.user.count({
      where: {
        members: {
          some: { organizationId },
        },
      },
    });

    const byDepartment = await this.prisma.user.groupBy({
      by: ['department'],
      where: {
        members: {
          some: { organizationId },
        },
      },
      _count: true,
    });

    return {
      total: totalUsers,
      byDepartment,
    };
  }
}
