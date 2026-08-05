import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QCTest, Prisma } from '@prisma/client';

@Injectable()
export class QcService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filters?: {
      batchId?: string;
      testType?: string;
      result?: string;
    },
  ): Promise<QCTest[]> {
    const where: Prisma.QCTestWhereInput = {
      batch: {
        organizationId,
      },
      ...(filters?.batchId && { batchId: filters.batchId }),
      ...(filters?.testType && { testType: filters.testType }),
      ...(filters?.result && { result: filters.result }),
    };

    return this.prisma.qCTest.findMany({
      where,
      include: {
        batch: {
          select: {
            id: true,
            batchNumber: true,
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        tester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { testedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const qcTest = await this.prisma.qCTest.findUnique({
      where: { id },
      include: {
        batch: {
          include: {
            product: true,
            ingredients: {
              include: {
                rawMaterial: true,
              },
            },
          },
        },
        tester: true,
      },
    });

    if (!qcTest) {
      throw new NotFoundException(`QC test with ID ${id} not found`);
    }

    return qcTest;
  }

  async findByBatchId(batchId: string): Promise<QCTest[]> {
    return this.prisma.qCTest.findMany({
      where: { batchId },
      include: {
        tester: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { testedAt: 'desc' },
    });
  }

  async create(data: {
    batchId: string;
    testType: string;
    testMethod?: string;
    parameter: string;
    expectedValue?: string;
    actualValue?: string;
    unit?: string;
    result?: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS' | 'INCONCLUSIVE';
    notes?: string;
    testedById?: string;
    certificateNumber?: string;
    labName?: string;
  }): Promise<QCTest> {
    // Check if batch exists
    const batch = await this.prisma.batch.findUnique({
      where: { id: data.batchId },
    });

    if (!batch) {
      throw new BadRequestException(`Batch with ID ${data.batchId} not found`);
    }

    return this.prisma.qCTest.create({
      data: {
        batchId: data.batchId,
        testType: data.testType,
        testMethod: data.testMethod,
        parameter: data.parameter,
        expectedValue: data.expectedValue,
        actualValue: data.actualValue,
        unit: data.unit,
        result: data.result,
        notes: data.notes,
        testedById: data.testedById,
        certificateNumber: data.certificateNumber,
        labName: data.labName,
      },
      include: {
        batch: {
          select: {
            batchNumber: true,
          },
        },
        tester: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.QCTestUpdateInput,
  ): Promise<QCTest> {
    return this.prisma.qCTest.update({
      where: { id },
      data,
      include: {
        batch: {
          select: {
            batchNumber: true,
          },
        },
      },
    });
  }

  async completeTest(
    id: string,
    actualValue: string,
    result: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS' | 'INCONCLUSIVE',
    notes?: string,
  ): Promise<QCTest> {
    const qcTest = await this.findOne(id);

    return this.prisma.qCTest.update({
      where: { id },
      data: {
        actualValue,
        result,
        notes,
        testedAt: new Date(),
      },
      include: {
        batch: {
          select: {
            batchNumber: true,
          },
        },
      },
    });
  }

  async getPendingTests(organizationId: string): Promise<QCTest[]> {
    return this.prisma.qCTest.findMany({
      where: {
        batch: {
          organizationId,
          status: 'QC_PENDING',
        },
        result: null,
      },
      include: {
        batch: {
          select: {
            batchNumber: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { testedAt: 'asc' },
    });
  }

  async getTestStats(organizationId: string) {
    const totalTests = await this.prisma.qCTest.count({
      where: {
        batch: {
          organizationId,
        },
      },
    });

    const byResult = await this.prisma.qCTest.groupBy({
      by: ['result'],
      where: {
        batch: {
          organizationId,
        },
      },
      _count: true,
    });

    const byTestType = await this.prisma.qCTest.groupBy({
      by: ['testType'],
      where: {
        batch: {
          organizationId,
        },
      },
      _count: true,
    });

    const passRate = await this.prisma.qCTest.aggregate({
      where: {
        batch: {
          organizationId,
        },
        result: { not: null },
      },
      _count: true,
    });

    const passedTests = await this.prisma.qCTest.count({
      where: {
        batch: {
          organizationId,
        },
        result: 'PASS',
      },
    });

    return {
      total: totalTests,
      byResult,
      byTestType,
      passRate: passRate._count > 0 ? (passedTests / passRate._count) * 100 : 0,
    };
  }

  async generateCertificate(testId: string): Promise<string> {
    const test = await this.findOne(testId);

    if (!test.result) {
      throw new BadRequestException('Test must be completed before generating certificate');
    }

    const certificateNumber = `QC-${test.batch.batchNumber}-${Date.now()}`;

    await this.prisma.qCTest.update({
      where: { id: testId },
      data: {
        certificateNumber,
      },
    });

    return certificateNumber;
  }
}
