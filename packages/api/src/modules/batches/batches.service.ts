import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Batch, Prisma } from '@firstcrop/db';

@Injectable()
export class BatchesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filters?: {
      status?: string;
      productId?: string;
      expiryWarning?: boolean;
    },
  ): Promise<Batch[]> {
    const where: Prisma.BatchWhereInput = {
      organizationId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.productId && { productId: filters.productId }),
      ...(filters?.expiryWarning && {
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days warning
        },
      }),
    };

    return this.prisma.batch.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
          },
        },
        ingredients: {
          include: {
            rawMaterial: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        qcTests: {
          orderBy: { testedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        product: true,
        ingredients: {
          include: {
            rawMaterial: true,
          },
        },
        qcTests: {
          orderBy: { testedAt: 'desc' },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }

    return batch;
  }

  async findByBatchNumber(batchNumber: string): Promise<Batch | null> {
    return this.prisma.batch.findUnique({
      where: { batchNumber },
      include: {
        product: true,
        ingredients: true,
        qcTests: true,
      },
    });
  }

  async create(data: {
    organizationId: string;
    productId: string;
    batchNumber?: string;
    plannedQuantity: number;
    unit: string;
    expiryDate: Date;
    shelfLifeDays?: number;
    notes?: string;
  }): Promise<Batch> {
    // Check if batch number already exists
    if (data.batchNumber) {
      const existing = await this.prisma.batch.findUnique({
        where: { batchNumber: data.batchNumber },
      });

      if (existing) {
        throw new BadRequestException(`Batch number ${data.batchNumber} already exists`);
      }
    }

    return this.prisma.batch.create({
      data: {
        organizationId: data.organizationId,
        productId: data.productId,
        batchNumber: data.batchNumber || `BATCH-${Date.now()}`,
        plannedQuantity: data.plannedQuantity,
        unit: data.unit,
        expiryDate: data.expiryDate,
        shelfLifeDays: data.shelfLifeDays,
        notes: data.notes,
        status: 'PLANNED',
      },
      include: {
        product: true,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.BatchUpdateInput,
  ): Promise<Batch> {
    return this.prisma.batch.update({
      where: { id },
      data,
      include: {
        product: true,
      },
    });
  }

  async startProduction(id: string): Promise<Batch> {
    const batch = await this.findOne(id);

    if (batch.status !== 'PLANNED') {
      throw new BadRequestException('Batch must be in PLANNED status to start production');
    }

    // Check if raw materials are available
    for (const ingredient of batch.ingredients) {
      const rawMaterial = await this.prisma.rawMaterial.findUnique({
        where: { id: ingredient.rawMaterialId },
      });

      if (!rawMaterial) {
        throw new BadRequestException(`Raw material ${ingredient.rawMaterialId} not found`);
      }

      if (rawMaterial.currentStock.lessThan(ingredient.plannedQuantity)) {
        throw new BadRequestException(
          `Insufficient stock for ${rawMaterial.name}. Available: ${rawMaterial.currentStock}, Required: ${ingredient.plannedQuantity}`,
        );
      }
    }

    // Deduct raw materials from stock
    for (const ingredient of batch.ingredients) {
      await this.prisma.rawMaterial.update({
        where: { id: ingredient.rawMaterialId },
        data: {
          currentStock: {
            decrement: ingredient.plannedQuantity,
          },
        },
      });

      // Create inventory movement
      await this.prisma.inventoryMovement.create({
        data: {
          organizationId: batch.organizationId,
          type: 'PRODUCTION_OUTPUT',
          rawMaterialId: ingredient.rawMaterialId,
          batchNumber: batch.batchNumber,
          quantity: ingredient.plannedQuantity.negated(),
          unit: ingredient.unit,
          referenceType: 'BATCH',
          referenceId: batch.id,
          notes: `Allocated to batch ${batch.batchNumber}`,
        },
      });
    }

    return this.prisma.batch.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        actualStartDate: new Date(),
      },
      include: {
        product: true,
      },
    });
  }

  async completeProduction(id: string, actualQuantity: number): Promise<Batch> {
    const batch = await this.findOne(id);

    if (batch.status !== 'IN_PROGRESS' && batch.status !== 'PROCESSING') {
      throw new BadRequestException('Batch must be IN_PROGRESS or PROCESSING to complete production');
    }

    const yieldPercentage = batch.plannedQuantity.gt(0)
      ? new Prisma.Decimal(actualQuantity).div(batch.plannedQuantity).mul(100)
      : new Prisma.Decimal(0);

    return this.prisma.batch.update({
      where: { id },
      data: {
        status: 'QC_PENDING',
        actualQuantity,
        yieldPercentage,
        actualEndDate: new Date(),
      },
      include: {
        product: true,
      },
    });
  }

  async updateQCStatus(
    id: string,
    qcStatus: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS',
    certificateNumber?: string,
  ): Promise<Batch> {
    const batch = await this.findOne(id);

    if (batch.status !== 'QC_PENDING') {
      throw new BadRequestException('Batch must be in QC_PENDING status to update QC status');
    }

    const newStatus = qcStatus === 'PASS' ? 'QC_PASSED' : qcStatus === 'FAIL' ? 'QC_REJECTED' : 'QC_PASSED';

    return this.prisma.batch.update({
      where: { id },
      data: {
        status: newStatus,
        qcStatus,
        qcDate: new Date(),
        certificateNumber,
      },
      include: {
        product: true,
      },
    });
  }

  async packageBatch(id: string, packagingData: {
    packagingType: string;
    unitsProduced: number;
    packagingDate?: Date;
  }): Promise<Batch> {
    const batch = await this.findOne(id);

    if (batch.status !== 'QC_PASSED') {
      throw new BadRequestException('Batch must be in QC_PASSED status to package');
    }

    return this.prisma.batch.update({
      where: { id },
      data: {
        status: 'PACKAGING',
        packagingType: packagingData.packagingType,
        unitsProduced: packagingData.unitsProduced,
        packagingDate: packagingData.packagingDate || new Date(),
      },
      include: {
        product: true,
      },
    });
  }

  async readyForDispatch(id: string): Promise<Batch> {
    const batch = await this.findOne(id);

    if (batch.status !== 'PACKAGING') {
      throw new BadRequestException('Batch must be in PACKAGING status to mark ready for dispatch');
    }

    let location = await this.prisma.inventoryLocation.findFirst({
      where: {
        organizationId: batch.organizationId,
        type: 'FINISHED_GOODS',
      },
    });

    if (!location) {
      location = await this.prisma.inventoryLocation.create({
        data: {
          organizationId: batch.organizationId,
          name: 'Finished Goods Warehouse',
          type: 'FINISHED_GOODS',
        },
      });
    }

    await this.prisma.inventory.create({
      data: {
        organizationId: batch.organizationId,
        locationId: location.id,
        productId: batch.productId,
        batchNumber: batch.batchNumber,
        quantity: batch.actualQuantity || batch.plannedQuantity,
        unit: batch.unit,
        expiryDate: batch.expiryDate,
      },
    });

    return this.prisma.batch.update({
      where: { id },
      data: {
        status: 'READY_FOR_DISPATCH',
      },
      include: {
        product: true,
      },
    });
  }

  async getExpiringBatches(organizationId: string, daysWarning: number = 30): Promise<Batch[]> {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + daysWarning);

    return this.prisma.batch.findMany({
      where: {
        organizationId,
        status: { in: ['QC_PASSED', 'PACKAGING', 'READY_FOR_DISPATCH'] },
        expiryDate: {
          lte: warningDate,
        },
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getStats(organizationId: string) {
    const totalBatches = await this.prisma.batch.count({
      where: { organizationId },
    });

    const byStatus = await this.prisma.batch.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
    });

    const expiringBatches = await this.getExpiringBatches(organizationId, 30);

    const averageYield = await this.prisma.batch.aggregate({
      where: {
        organizationId,
        yieldPercentage: { not: null },
      },
      _avg: {
        yieldPercentage: true,
      },
    });

    return {
      total: totalBatches,
      byStatus,
      expiringCount: expiringBatches.length,
      averageYield: averageYield._avg.yieldPercentage,
    };
  }
}
