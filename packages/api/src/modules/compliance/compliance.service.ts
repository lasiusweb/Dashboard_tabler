import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComplianceRecord, Prisma } from '@prisma/client';

type ToolResult = { success: boolean; message?: string; data?: any };

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filters?: {
      certType?: string;
      status?: string;
      partyId?: string;
    },
  ): Promise<ComplianceRecord[]> {
    const where: Prisma.ComplianceRecordWhereInput = {
      organizationId,
      ...(filters?.certType && { certType: filters.certType }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.partyId && { partyId: filters.partyId }),
    };

    return this.prisma.complianceRecord.findMany({
      where,
      include: {
        party: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async findOne(id: string): Promise<ComplianceRecord> {
    const record = await this.prisma.complianceRecord.findUnique({
      where: { id },
      include: {
        party: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Compliance record with ID ${id} not found`);
    }

    return record;
  }

  async create(data: {
    organizationId: string;
    partyId?: string;
    productId?: string;
    certType: string;
    certificateNumber: string;
    issuedBy?: string;
    issuedDate: Date;
    expiryDate: Date;
    documentUrl?: string;
    notes?: string;
  }): Promise<ComplianceRecord> {
    // Check if certificate number already exists
    const existing = await this.prisma.complianceRecord.findFirst({
      where: {
        certType: data.certType,
        certificateNumber: data.certificateNumber,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Certificate number ${data.certificateNumber} already exists for ${data.certType}`,
      );
    }

    return this.prisma.complianceRecord.create({
      data: {
        organizationId: data.organizationId,
        partyId: data.partyId,
        productId: data.productId,
        certType: data.certType,
        certificateNumber: data.certificateNumber,
        issuedBy: data.issuedBy,
        issuedDate: data.issuedDate,
        expiryDate: data.expiryDate,
        status: 'ACTIVE',
        documentUrl: data.documentUrl,
        notes: data.notes,
      },
      include: {
        party: true,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.ComplianceRecordUpdateInput,
  ): Promise<ComplianceRecord> {
    return this.prisma.complianceRecord.update({
      where: { id },
      data,
      include: {
        party: true,
      },
    });
  }

  async renew(id: string, renewalData: {
    newCertificateNumber: string;
    newExpiryDate: Date;
    issuedBy?: string;
    documentUrl?: string;
  }): Promise<ComplianceRecord> {
    const record = await this.findOne(id);

    // Create renewal record
    return this.prisma.complianceRecord.create({
      data: {
        organizationId: record.organizationId,
        partyId: record.partyId,
        productId: record.productId,
        certType: record.certType,
        certificateNumber: renewalData.newCertificateNumber,
        issuedBy: renewalData.issuedBy || record.issuedBy,
        issuedDate: new Date(),
        expiryDate: renewalData.newExpiryDate,
        status: 'ACTIVE',
        documentUrl: renewalData.documentUrl,
        notes: `Renewal of ${record.certificateNumber}`,
      },
      include: {
        party: true,
      },
    });
  }

  async suspend(id: string, reason?: string): Promise<ComplianceRecord> {
    const record = await this.findOne(id);

    if (record.status === 'REVOKED') {
      throw new BadRequestException('Cannot suspend a revoked record');
    }

    return this.prisma.complianceRecord.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        notes: reason
          ? `${record.notes || ''}\nSuspended: ${reason}`
          : record.notes,
      },
      include: {
        party: true,
      },
    });
  }

  async revoke(id: string, reason?: string): Promise<ComplianceRecord> {
    const record = await this.findOne(id);

    if (record.status === 'REVOKED') {
      throw new BadRequestException('Record is already revoked');
    }

    return this.prisma.complianceRecord.update({
      where: { id },
      data: {
        status: 'REVOKED',
        notes: reason
          ? `${record.notes || ''}\nRevoked: ${reason}`
          : record.notes,
      },
      include: {
        party: true,
      },
    });
  }

  async getExpiringRecords(organizationId: string, daysWarning: number = 90) {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + daysWarning);

    return this.prisma.complianceRecord.findMany({
      where: {
        organizationId,
        status: { notIn: ['REVOKED', 'SUSPENDED'] },
        expiryDate: { lte: warningDate },
      },
      include: {
        party: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getComplianceStats(organizationId: string) {
    const totalRecords = await this.prisma.complianceRecord.count({
      where: { organizationId },
    });

    const byStatus = await this.prisma.complianceRecord.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
    });

    const byCertType = await this.prisma.complianceRecord.groupBy({
      by: ['certType'],
      where: { organizationId },
      _count: true,
    });

    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 90);

    const expiringSoon = await this.prisma.complianceRecord.count({
      where: {
        organizationId,
        status: { notIn: ['REVOKED', 'SUSPENDED'] },
        expiryDate: { lte: warningDate, gte: now },
      },
    });

    const expired = await this.prisma.complianceRecord.count({
      where: {
        organizationId,
        expiryDate: { lt: now },
      },
    });

    return {
      total: totalRecords,
      byStatus,
      byCertType,
      expiringSoon,
      expired,
      active: totalRecords - expiringSoon - expired,
    };
  }

  async verifyFSSAI(fssaiNumber: string): Promise<ToolResult> {
    // This would integrate with FSSAI API in production
    // For now, return mock verification
    return {
      success: true,
      data: {
        fssaiNumber,
        valid: true,
        verifiedAt: new Date(),
        source: 'FSSAI Portal (mock)',
      },
    };
  }

  async verifyGST(gstin: string): Promise<ToolResult> {
    // This would integrate with GST API in production
    // For now, return mock verification
    return {
      success: true,
      data: {
        gstin,
        valid: true,
        verifiedAt: new Date(),
        source: 'GST Portal (mock)',
      },
    };
  }
}
