import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppSetting, Prisma } from '@firstcrop/db';

@Injectable()
export class AppSettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<AppSetting[]> {
    return this.prisma.appSetting.findMany({
      where: { organizationId },
      orderBy: { key: 'asc' },
    });
  }

  async findOne(id: string): Promise<AppSetting> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException(`App setting with ID ${id} not found`);
    }

    return setting;
  }

  async findByKey(organizationId: string, key: string): Promise<AppSetting> {
    const setting = await this.prisma.appSetting.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key,
        },
      },
    });

    if (!setting) {
      throw new NotFoundException(`App setting with key "${key}" not found for organization ${organizationId}`);
    }

    return setting;
  }

  async create(data: {
    organizationId: string;
    key: string;
    value: Prisma.InputJsonValue;
    description?: string;
  }): Promise<AppSetting> {
    const existing = await this.prisma.appSetting.findUnique({
      where: {
        organizationId_key: {
          organizationId: data.organizationId,
          key: data.key,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `App setting with key "${data.key}" already exists for organization ${data.organizationId}`,
      );
    }

    return this.prisma.appSetting.create({
      data: {
        organizationId: data.organizationId,
        key: data.key,
        value: data.value,
        description: data.description,
      },
    });
  }

  async update(
    id: string,
    data: {
      value?: Prisma.InputJsonValue;
      description?: string;
    },
  ): Promise<AppSetting> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException(`App setting with ID ${id} not found`);
    }

    return this.prisma.appSetting.update({
      where: { id },
      data: {
        ...(data.value !== undefined && { value: data.value }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  async remove(id: string): Promise<AppSetting> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException(`App setting with ID ${id} not found`);
    }

    return this.prisma.appSetting.delete({
      where: { id },
    });
  }
}
