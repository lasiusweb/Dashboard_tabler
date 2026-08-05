import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SalesOrder, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filters?: {
      status?: string;
      customerId?: string;
      orderType?: string;
    },
  ): Promise<SalesOrder[]> {
    const where: Prisma.SalesOrderWhereInput = {
      organizationId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.customerId && { customerId: filters.customerId }),
      ...(filters?.orderType && { orderType: filters.orderType }),
    };

    return this.prisma.salesOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
            batch: {
              select: {
                id: true,
                batchNumber: true,
              },
            },
          },
        },
        shipments: {
          select: {
            id: true,
            shipmentNumber: true,
            status: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<SalesOrder> {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
        shipments: {
          include: {
            vehicle: true,
          },
        },
        invoice: {
          include: {
            payments: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Sales order with ID ${id} not found`);
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<SalesOrder | null> {
    return this.prisma.salesOrder.findUnique({
      where: { orderNumber },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async create(data: {
    organizationId: string;
    customerId: string;
    orderType?: string;
    items: Array<{
      productId: string;
      batchId?: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      discount?: number;
      gstRate?: number;
    }>;
    shippingAddress?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingPincode?: string;
    notes?: string;
    createdById?: string;
    requiredByDate?: Date;
  }): Promise<SalesOrder> {
    // Validate customer exists
    const customer = await this.prisma.party.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new BadRequestException(`Customer with ID ${data.customerId} not found`);
    }

    // Fetch products to get GST rates
    const productIds = data.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, gstRate: true },
    });

    const productGstRates = new Map(products.map((p) => [p.id, p.gstRate]));

    // Calculate totals using per-product GST rates
    let subtotal = new Prisma.Decimal(0);
    let totalGst = new Prisma.Decimal(0);

    for (const item of data.items) {
      const itemTotal = new Prisma.Decimal(item.unitPrice)
        .mul(item.quantity)
        .sub(item.discount || 0);
      subtotal = subtotal.add(itemTotal);

      // Use provided gstRate, or fall back to product's gstRate, or default 18%
      const gstRate = item.gstRate ?? productGstRates.get(item.productId)?.toNumber() ?? 18;
      const itemGst = itemTotal.mul(gstRate).div(100);
      totalGst = totalGst.add(itemGst);
    }

    const totalAmount = subtotal.add(totalGst);

    // Generate order number
    const orderCount = await this.prisma.salesOrder.count({
      where: { organizationId: data.organizationId },
    });
    const orderNumber = `SO-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`;

    return this.prisma.salesOrder.create({
      data: {
        orderNumber,
        organizationId: data.organizationId,
        customerId: data.customerId,
        orderType: data.orderType || 'DISTRIBUTOR',
        status: 'PLACED',
        subtotal,
        gstAmount: totalGst,
        totalAmount,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingPincode: data.shippingPincode,
        notes: data.notes,
        createdById: data.createdById,
        requiredByDate: data.requiredByDate,
        items: {
          create: data.items.map((item) => {
            const itemTotal = new Prisma.Decimal(item.unitPrice)
              .mul(item.quantity)
              .sub(item.discount || 0);
            const gstRate = item.gstRate ?? productGstRates.get(item.productId)?.toNumber() ?? 18;

            return {
              productId: item.productId,
              batchId: item.batchId,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              gstRate,
              totalAmount: itemTotal,
            };
          }),
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.SalesOrderUpdateInput,
  ): Promise<SalesOrder> {
    return this.prisma.salesOrder.update({
      where: { id },
      data,
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async confirm(id: string): Promise<SalesOrder> {
    const order = await this.findOne(id);

    if (order.status !== 'PLACED') {
      throw new BadRequestException('Order must be in PLACED status to confirm');
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async startProduction(id: string): Promise<SalesOrder> {
    const order = await this.findOne(id);

    if (order.status !== 'CONFIRMED') {
      throw new BadRequestException('Order must be in CONFIRMED status to start production');
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'IN_PRODUCTION',
      },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async readyForDispatch(id: string): Promise<SalesOrder> {
    const order = await this.findOne(id);

    if (order.status !== 'IN_PRODUCTION') {
      throw new BadRequestException('Order must be in IN_PRODUCTION status to mark ready for dispatch');
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'READY_FOR_DISPATCH',
      },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async dispatch(id: string): Promise<SalesOrder> {
    const order = await this.findOne(id);

    if (order.status !== 'READY_FOR_DISPATCH') {
      throw new BadRequestException('Order must be in READY_FOR_DISPATCH status to dispatch');
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'FULLY_SHIPPED',
        dispatchedAt: new Date(),
      },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async deliver(id: string): Promise<SalesOrder> {
    const order = await this.findOne(id);

    if (order.status !== 'FULLY_SHIPPED') {
      throw new BadRequestException('Order must be in FULLY_SHIPPED status to mark delivered');
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
      },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async cancel(id: string, reason?: string): Promise<SalesOrder> {
    const order = await this.findOne(id);

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot cancel a delivered or cancelled order');
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        notes: reason ? `${order.notes || ''}\nCancellation reason: ${reason}` : order.notes,
      },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async getOrderStats(organizationId: string) {
    const totalOrders = await this.prisma.salesOrder.count({
      where: { organizationId },
    });

    const byStatus = await this.prisma.salesOrder.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
      _sum: {
        totalAmount: true,
      },
    });

    const byOrderType = await this.prisma.salesOrder.groupBy({
      by: ['orderType'],
      where: { organizationId },
      _count: true,
      _sum: {
        totalAmount: true,
      },
    });

    const totalRevenue = await this.prisma.salesOrder.aggregate({
      where: {
        organizationId,
        status: { notIn: ['CANCELLED', 'RETURNED'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const pendingPayment = await this.prisma.salesOrder.aggregate({
      where: {
        organizationId,
        paymentStatus: { in: ['PENDING', 'PARTIAL'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    return {
      total: totalOrders,
      byStatus,
      byOrderType,
      totalRevenue: totalRevenue._sum.totalAmount,
      pendingPayment: pendingPayment._sum.totalAmount,
    };
  }
}
