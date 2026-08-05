import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PurchaseOrder, Prisma } from '@prisma/client';

@Injectable()
export class ProcurementService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filters?: {
      status?: string;
      vendorId?: string;
    },
  ): Promise<PurchaseOrder[]> {
    const where: Prisma.PurchaseOrderWhereInput = {
      organizationId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.vendorId && { vendorId: filters.vendorId }),
    };

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        items: {
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: {
          include: {
            rawMaterial: true,
          },
        },
      },
    });

    if (!po) {
      throw new NotFoundException(`Purchase order with ID ${id} not found`);
    }

    return po;
  }

  async findByPoNumber(poNumber: string): Promise<PurchaseOrder | null> {
    return this.prisma.purchaseOrder.findUnique({
      where: { poNumber },
      include: {
        vendor: true,
        items: true,
      },
    });
  }

  async create(data: {
    organizationId: string;
    vendorId: string;
    items: Array<{
      rawMaterialId: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      gstRate: number;
    }>;
    notes?: string;
    expectedDate?: Date;
  }): Promise<PurchaseOrder> {
    // Validate vendor exists
    const vendor = await this.prisma.party.findUnique({
      where: { id: data.vendorId },
    });

    if (!vendor) {
      throw new BadRequestException(`Vendor with ID ${data.vendorId} not found`);
    }

    // Calculate totals
    let subtotal = new Prisma.Decimal(0);
    for (const item of data.items) {
      const itemTotal = new Prisma.Decimal(item.unitPrice).mul(item.quantity);
      subtotal = subtotal.add(itemTotal);
    }

    const gstAmount = subtotal.mul(0.18); // Assuming 18% GST
    const totalAmount = subtotal.add(gstAmount);

    // Generate PO number
    const poCount = await this.prisma.purchaseOrder.count({
      where: { organizationId: data.organizationId },
    });
    const poNumber = `PO-${Date.now()}-${(poCount + 1).toString().padStart(4, '0')}`;

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        organizationId: data.organizationId,
        vendorId: data.vendorId,
        status: 'DRAFT',
        subtotal,
        gstAmount,
        totalAmount,
        notes: data.notes,
        expectedDate: data.expectedDate,
        items: {
          create: data.items.map((item) => ({
            rawMaterialId: item.rawMaterialId,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            gstRate: item.gstRate,
            totalAmount: new Prisma.Decimal(item.unitPrice).mul(item.quantity),
          })),
        },
      },
      include: {
        vendor: true,
        items: true,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.PurchaseOrderUpdateInput,
  ): Promise<PurchaseOrder> {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data,
      include: {
        vendor: true,
        items: true,
      },
    });
  }

  async submit(id: string): Promise<PurchaseOrder> {
    const po = await this.findOne(id);

    if (po.status !== 'DRAFT') {
      throw new BadRequestException('Purchase order must be in DRAFT status to submit');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
      },
      include: {
        vendor: true,
        items: true,
      },
    });
  }

  async confirm(id: string): Promise<PurchaseOrder> {
    const po = await this.findOne(id);

    if (po.status !== 'SUBMITTED') {
      throw new BadRequestException('Purchase order must be in SUBMITTED status to confirm');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
      },
      include: {
        vendor: true,
        items: true,
      },
    });
  }

  async receive(id: string, receivedItems: Array<{
    itemId: string;
    receivedQuantity: number;
  }>): Promise<PurchaseOrder> {
    const po = await this.findOne(id);

    if (po.status !== 'CONFIRMED' && po.status !== 'PARTIALLY_RECEIVED') {
      throw new BadRequestException('Purchase order must be CONFIRMED or PARTIALLY_RECEIVED to receive items');
    }

    // Update received quantities
    for (const item of receivedItems) {
      await this.prisma.purchaseOrderItem.update({
        where: { id: item.itemId },
        data: {
          receivedQuantity: item.receivedQuantity,
        },
      });

      // Update raw material stock
      const poItem = await this.prisma.purchaseOrderItem.findUnique({
        where: { id: item.itemId },
      });

      if (poItem) {
        await this.prisma.rawMaterial.update({
          where: { id: poItem.rawMaterialId },
          data: {
            currentStock: {
              increment: item.receivedQuantity,
            },
          },
        });

        // Create inventory movement
        await this.prisma.inventoryMovement.create({
          data: {
            organizationId: po.organizationId,
            type: 'RECEIPT',
            rawMaterialId: poItem.rawMaterialId,
            quantity: item.receivedQuantity,
            unit: poItem.unit,
            referenceType: 'PURCHASE_ORDER',
            referenceId: po.id,
            notes: `Received against PO ${po.poNumber}`,
          },
        });
      }
    }

    // Check if all items are fully received
    const updatedPo = await this.findOne(id);
    const allReceived = updatedPo.items.every(
      (item) => item.receivedQuantity.gte(item.quantity),
    );

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: allReceived ? 'FULLY_RECEIVED' : 'PARTIALLY_RECEIVED',
        receivedDate: allReceived ? new Date() : undefined,
      },
      include: {
        vendor: true,
        items: true,
      },
    });
  }

  async cancel(id: string, reason?: string): Promise<PurchaseOrder> {
    const po = await this.findOne(id);

    if (po.status === 'FULLY_RECEIVED' || po.status === 'CANCELLED') {
      throw new BadRequestException('Cannot cancel a fully received or cancelled purchase order');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${po.notes || ''}\nCancellation reason: ${reason}` : po.notes,
      },
      include: {
        vendor: true,
        items: true,
      },
    });
  }

  async getVendorStats(organizationId: string) {
    const vendors = await this.prisma.party.findMany({
      where: {
        organizationId,
        type: 'VENDOR',
      },
      include: {
        purchaseOrders: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    });

    const vendorStats = vendors.map((vendor) => {
      const totalOrders = vendor.purchaseOrders.length;
      const totalSpent = vendor.purchaseOrders.reduce(
        (sum, po) => sum + Number(po.totalAmount),
        0,
      );
      const pendingOrders = vendor.purchaseOrders.filter(
        (po) => !['FULLY_RECEIVED', 'CANCELLED'].includes(po.status),
      ).length;

      return {
        id: vendor.id,
        name: vendor.name,
        displayName: vendor.displayName,
        totalOrders,
        totalSpent,
        pendingOrders,
      };
    });

    return vendorStats;
  }

  async getProcurementStats(organizationId: string) {
    const totalPOs = await this.prisma.purchaseOrder.count({
      where: { organizationId },
    });

    const byStatus = await this.prisma.purchaseOrder.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
      _sum: {
        totalAmount: true,
      },
    });

    const totalSpent = await this.prisma.purchaseOrder.aggregate({
      where: {
        organizationId,
        status: { notIn: ['CANCELLED'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const pendingPayment = await this.prisma.purchaseOrder.aggregate({
      where: {
        organizationId,
        paymentStatus: { in: ['PENDING', 'PARTIAL'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    return {
      total: totalPOs,
      byStatus,
      totalSpent: totalSpent._sum.totalAmount,
      pendingPayment: pendingPayment._sum.totalAmount,
    };
  }
}
