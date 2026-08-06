/**
 * Agent tools for FirstCrop Manufacturing ERP
 * Adapted from trycompai/crm agent tools
 */

import { PrismaClient } from '@firstcrop/db';
import { evidenceScorer } from '../lib/evidence';

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class ManufacturingTools {
  constructor(private prisma: PrismaClient) {}

  // ─── Batch Expiry Tools ────────────────────────────────────────────────

  /**
   * Check batch expiry status
   */
  async checkBatchExpiry(batchId: string): Promise<ToolResult> {
    try {
      const batch = await this.prisma.batch.findUnique({
        where: { id: batchId },
        include: {
          product: {
            select: { name: true, sku: true },
          },
        },
      });

      if (!batch) {
        return { success: false, error: 'Batch not found' };
      }

      const now = new Date();
      const expiryDate = new Date(batch.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      let status: string;
      if (daysUntilExpiry < 0) {
        status = 'EXPIRED';
      } else if (daysUntilExpiry <= 30) {
        status = 'CRITICAL';
      } else if (daysUntilExpiry <= 90) {
        status = 'WARNING';
      } else {
        status = 'OK';
      }

      return {
        success: true,
        data: {
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          product: batch.product,
          expiryDate: batch.expiryDate,
          daysUntilExpiry,
          status,
          quantity: batch.actualQuantity || batch.plannedQuantity,
          unit: batch.unit,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get all expiring batches
   */
  async getExpiringBatches(
    organizationId: string,
    daysWarning: number = 30,
  ): Promise<ToolResult> {
    try {
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + daysWarning);

      const batches = await this.prisma.batch.findMany({
        where: {
          organizationId,
          status: { in: ['QC_PASSED', 'PACKAGING', 'READY_FOR_DISPATCH'] },
          expiryDate: { lte: warningDate },
        },
        include: {
          product: {
            select: { name: true, sku: true },
          },
        },
        orderBy: { expiryDate: 'asc' },
      });

      const now = new Date();
      const batchesWithDays = batches.map((batch) => {
        const daysUntilExpiry = Math.ceil(
          (new Date(batch.expiryDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return {
          ...batch,
          daysUntilExpiry,
          status: daysUntilExpiry < 0 ? 'EXPIRED' : daysUntilExpiry <= 30 ? 'CRITICAL' : 'WARNING',
        };
      });

      return {
        success: true,
        data: {
          total: batchesWithDays.length,
          critical: batchesWithDays.filter((b) => b.status === 'CRITICAL').length,
          expired: batchesWithDays.filter((b) => b.status === 'EXPIRED').length,
          batches: batchesWithDays,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ─── QC Trend Tools ────────────────────────────────────────────────────

  /**
   * Analyze QC test trends
   */
  async analyzeQCTrends(
    organizationId: string,
    productId?: string,
    days: number = 90,
  ): Promise<ToolResult> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const tests = await this.prisma.qCTest.findMany({
        where: {
          batch: {
            organizationId,
            ...(productId && { productId }),
          },
          testedAt: { gte: startDate },
        },
        include: {
          batch: {
            select: {
              batchNumber: true,
              product: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { testedAt: 'asc' },
      });

      // Group by test type
      const byTestType: Record<string, any[]> = {};
      for (const test of tests) {
        if (!byTestType[test.testType]) {
          byTestType[test.testType] = [];
        }
        byTestType[test.testType].push(test);
      }

      // Calculate trends
      const trends: Record<string, any> = {};
      for (const [testType, typeTests] of Object.entries(byTestType)) {
        const passCount = typeTests.filter((t) => t.result === 'PASS').length;
        const failCount = typeTests.filter((t) => t.result === 'FAIL').length;
        const totalCount = typeTests.length;

        trends[testType] = {
          totalTests: totalCount,
          passCount,
          failCount,
          passRate: totalCount > 0 ? (passCount / totalCount) * 100 : 0,
          recentTests: typeTests.slice(-10),
        };
      }

      return {
        success: true,
        data: {
          period: `${days} days`,
          totalTests: tests.length,
          trends,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ─── Reorder Tools ─────────────────────────────────────────────────────

  /**
   * Recommend raw material reorders
   */
  async recommendReorder(organizationId: string): Promise<ToolResult> {
    try {
      const lowStockMaterials = await this.prisma.rawMaterial.findMany({
        where: {
          isActive: true,
          currentStock: {
            lte: this.prisma.rawMaterial.fields.reorderLevel,
          },
        },
        include: {
          purchaseOrderItems: {
            where: {
              purchaseOrder: {
                status: { in: ['DRAFT', 'SUBMITTED', 'CONFIRMED'] },
              },
            },
            select: {
              quantity: true,
              purchaseOrder: {
                select: {
                  poNumber: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      const recommendations = lowStockMaterials.map((material) => {
        const pendingQuantity = material.purchaseOrderItems.reduce(
          (sum, item) => sum + Number(item.quantity),
          0,
        );

        const recommendedOrder = Number(material.reorderQuantity);
        const netReorder = Math.max(0, recommendedOrder - pendingQuantity);

        return {
          id: material.id,
          name: material.name,
          code: material.code,
          category: material.category,
          currentStock: Number(material.currentStock),
          reorderLevel: Number(material.reorderLevel),
          reorderQuantity: Number(material.reorderQuantity),
          pendingOrders: material.purchaseOrderItems.length,
          pendingQuantity,
          netReorder,
          urgency: Number(material.currentStock) <= Number(material.reorderLevel) * 0.5 ? 'HIGH' : 'MEDIUM',
        };
      });

      return {
        success: true,
        data: {
          totalLowStock: recommendations.length,
          highUrgency: recommendations.filter((r) => r.urgency === 'HIGH').length,
          recommendations,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ─── Compliance Tools ──────────────────────────────────────────────────

  /**
   * Verify compliance records
   */
  async verifyCompliance(organizationId: string): Promise<ToolResult> {
    try {
      const records = await this.prisma.complianceRecord.findMany({
        where: {
          organizationId,
          status: { not: 'REVOKED' },
        },
        include: {
          party: {
            select: { name: true },
          },
        },
      });

      const now = new Date();
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 90);

      const compliance = records.map((record) => {
        const expiryDate = new Date(record.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        let status: string;
        if (daysUntilExpiry < 0) {
          status = 'EXPIRED';
        } else if (daysUntilExpiry <= 90) {
          status = 'EXPIRING_SOON';
        } else {
          status = 'ACTIVE';
        }

        return {
          id: record.id,
          certType: record.certType,
          certificateNumber: record.certificateNumber,
          issuedBy: record.issuedBy,
          expiryDate: record.expiryDate,
          daysUntilExpiry,
          status,
          party: record.party,
        };
      });

      return {
        success: true,
        data: {
          total: compliance.length,
          active: compliance.filter((c) => c.status === 'ACTIVE').length,
          expiringSoon: compliance.filter((c) => c.status === 'EXPIRING_SOON').length,
          expired: compliance.filter((c) => c.status === 'EXPIRED').length,
          records: compliance,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ─── Production Schedule Tools ─────────────────────────────────────────

  /**
   * Generate production schedule based on orders and materials
   */
  async generateProductionSchedule(
    organizationId: string,
  ): Promise<ToolResult> {
    try {
      // Get confirmed orders
      const confirmedOrders = await this.prisma.salesOrder.findMany({
        where: {
          organizationId,
          status: { in: ['CONFIRMED', 'IN_PRODUCTION'] },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { requiredByDate: 'asc' },
      });

      // Get available raw materials
      const rawMaterials = await this.prisma.rawMaterial.findMany({
        where: {
          isActive: true,
          currentStock: { gt: 0 },
        },
      });

      // Get existing batches
      const existingBatches = await this.prisma.batch.findMany({
        where: {
          organizationId,
          status: { in: ['PLANNED', 'IN_PROGRESS', 'QC_PENDING', 'QC_PASSED'] },
        },
        include: {
          product: true,
        },
      });

      // Analyze production capacity
      const schedule = confirmedOrders.map((order) => {
        const orderItems = order.items.map((item) => {
          const existingBatch = existingBatches.find(
            (b) =>
              b.productId === item.productId &&
              b.status !== 'DISPATCHED' &&
              b.status !== 'CANCELLED',
          );

          return {
            productId: item.productId,
            productName: item.product.name,
            requiredQuantity: Number(item.quantity),
            unit: item.unit,
            existingBatch: existingBatch
              ? {
                  id: existingBatch.id,
                  batchNumber: existingBatch.batchNumber,
                  availableQuantity: Number(
                    existingBatch.actualQuantity || existingBatch.plannedQuantity,
                  ),
                }
              : null,
            needsNewBatch: !existingBatch,
          };
        });

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customer: order.customerId,
          requiredByDate: order.requiredByDate,
          items: orderItems,
        };
      });

      return {
        success: true,
        data: {
          totalOrders: schedule.length,
          totalItems: schedule.reduce((sum, s) => sum + s.items.length, 0),
          newBatchesNeeded: schedule.reduce(
            (sum, s) => sum + s.items.filter((i) => i.needsNewBatch).length,
            0,
          ),
          schedule,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ─── Batch Cost Tools ──────────────────────────────────────────────────

  /**
   * Calculate batch production cost
   */
  async calculateBatchCost(batchId: string): Promise<ToolResult> {
    try {
      const batch = await this.prisma.batch.findUnique({
        where: { id: batchId },
        include: {
          ingredients: {
            include: {
              rawMaterial: {
                select: {
                  name: true,
                  costPerUnit: true,
                },
              },
            },
          },
          product: {
            select: {
              name: true,
              costPerUnit: true,
            },
          },
        },
      });

      if (!batch) {
        return { success: false, error: 'Batch not found' };
      }

      // Calculate raw material costs
      const materialCosts = batch.ingredients.map((ingredient) => {
        const costPerUnit = Number(ingredient.rawMaterial.costPerUnit || 0);
        const quantity = Number(ingredient.actualQuantity || ingredient.plannedQuantity);
        return {
          name: ingredient.rawMaterial.name,
          quantity,
          unit: ingredient.unit,
          costPerUnit,
          totalCost: costPerUnit * quantity,
        };
      });

      const totalMaterialCost = materialCosts.reduce(
        (sum, m) => sum + m.totalCost,
        0,
      );

      // Estimate labor and overhead (simplified)
      const laborCost = totalMaterialCost * 0.2; // 20% of material cost
      const overheadCost = totalMaterialCost * 0.1; // 10% of material cost
      const totalCost = totalMaterialCost + laborCost + overheadCost;

      const quantity = Number(batch.actualQuantity || batch.plannedQuantity);
      const costPerUnit = quantity > 0 ? totalCost / quantity : 0;

      return {
        success: true,
        data: {
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          product: batch.product.name,
          quantity,
          unit: batch.unit,
          materialCosts,
          totalMaterialCost,
          laborCost,
          overheadCost,
          totalCost,
          costPerUnit,
          mrpPerUnit: Number(batch.product.costPerUnit || 0),
          margin:
            Number(batch.product.costPerUnit || 0) > 0
              ? ((Number(batch.product.costPerUnit || 0) - costPerUnit) /
                  Number(batch.product.costPerUnit || 0)) *
                100
              : 0,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ─── Vendor Performance Tools ──────────────────────────────────────────

  /**
   * Assess vendor performance
   */
  async assessVendorPerformance(
    vendorId: string,
    days: number = 90,
  ): Promise<ToolResult> {
    try {
      const vendor = await this.prisma.party.findUnique({
        where: { id: vendorId },
      });

      if (!vendor) {
        return { success: false, error: 'Vendor not found' };
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const purchaseOrders = await this.prisma.purchaseOrder.findMany({
        where: {
          vendorId,
          createdAt: { gte: startDate },
        },
        include: {
          items: true,
        },
      });

      const totalOrders = purchaseOrders.length;
      const completedOrders = purchaseOrders.filter(
        (po) => po.status === 'FULLY_RECEIVED',
      ).length;
      const cancelledOrders = purchaseOrders.filter(
        (po) => po.status === 'CANCELLED',
      ).length;

      const totalSpent = purchaseOrders.reduce(
        (sum, po) => sum + Number(po.totalAmount),
        0,
      );

      // Calculate average delivery time (simplified)
      const deliveryTimes = purchaseOrders
        .filter((po) => po.receivedDate && po.expectedDate)
        .map((po) => {
          const expected = new Date(po.expectedDate!).getTime();
          const received = new Date(po.receivedDate!).getTime();
          return (received - expected) / (1000 * 60 * 60 * 24); // Days
        });

      const avgDeliveryDays =
        deliveryTimes.length > 0
          ? deliveryTimes.reduce((sum, d) => sum + d, 0) / deliveryTimes.length
          : 0;

      // Calculate on-time delivery rate
      const onTimeDeliveries = deliveryTimes.filter((d) => d <= 0).length;
      const onTimeRate =
        deliveryTimes.length > 0
          ? (onTimeDeliveries / deliveryTimes.length) * 100
          : 100;

      // Calculate rating (1-5 scale)
      let rating = 3; // Base rating
      if (onTimeRate >= 90) rating += 1;
      if (completedOrders / totalOrders >= 0.9) rating += 1;
      if (cancelledOrders === 0) rating += 0.5;
      rating = Math.min(5, Math.max(1, rating));

      return {
        success: true,
        data: {
          vendorId: vendor.id,
          vendorName: vendor.name,
          period: `${days} days`,
          totalOrders,
          completedOrders,
          cancelledOrders,
          completionRate:
            totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
          totalSpent,
          avgDeliveryDays,
          onTimeRate,
          rating,
          recommendations:
            rating < 3
              ? ['Consider alternative vendors', 'Negotiate better terms']
              : ['Continue current relationship'],
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ─── Cold Chain Tools ──────────────────────────────────────────────────

  /**
   * Track cold chain temperature
   */
  async trackColdChain(shipmentId: string): Promise<ToolResult> {
    try {
      const shipment = await this.prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          vehicle: true,
          salesOrder: {
            select: {
              orderNumber: true,
            },
          },
        },
      });

      if (!shipment) {
        return { success: false, error: 'Shipment not found' };
      }

      const temperatureLog = (shipment.temperatureLog as any[]) || [];
      const gpsLog = (shipment.gpsLog as any[]) || [];

      // Analyze temperature data
      const temperatures = temperatureLog.map((log) => log.temperature);
      const minTemp = temperatures.length > 0 ? Math.min(...temperatures) : null;
      const maxTemp = temperatures.length > 0 ? Math.max(...temperatures) : null;
      const avgTemp =
        temperatures.length > 0
          ? temperatures.reduce((a, b) => a + b, 0) / temperatures.length
          : null;

      // Check for temperature excursions
      const minAllowed = Number(shipment.vehicle?.minTemp || 2);
      const maxAllowed = Number(shipment.vehicle?.maxTemp || 8);

      const excursions = temperatureLog.filter(
        (log) => log.temperature < minAllowed || log.temperature > maxAllowed,
      );

      return {
        success: true,
        data: {
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipmentNumber,
          orderNumber: shipment.salesOrder?.orderNumber,
          status: shipment.status,
          vehicle: shipment.vehicle
            ? {
                registrationNumber: shipment.vehicle.registrationNumber,
                hasColdChain: shipment.vehicle.hasColdChain,
                minTemp: shipment.vehicle.minTemp,
                maxTemp: shipment.vehicle.maxTemp,
              }
            : null,
          temperature: {
            min: minTemp,
            max: maxTemp,
            avg: avgTemp,
            allowedRange: { min: minAllowed, max: maxAllowed },
          },
          excursions: excursions.length,
          excursionDetails: excursions,
          gpsPoints: gpsLog.length,
          lastGpsPoint: gpsLog.length > 0 ? gpsLog[gpsLog.length - 1] : null,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ─── QC Certificate Tools ──────────────────────────────────────────────

  /**
   * Generate QC certificate data
   */
  async generateQCCertificate(testId: string): Promise<ToolResult> {
    try {
      const test = await this.prisma.qCTest.findUnique({
        where: { id: testId },
        include: {
          batch: {
            include: {
              product: true,
              organization: {
                select: {
                  name: true,
                },
              },
            },
          },
          tester: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!test) {
        return { success: false, error: 'QC test not found' };
      }

      if (!test.result) {
        return { success: false, error: 'Test not completed yet' };
      }

      const certificateNumber = `QC-${test.batch.batchNumber}-${Date.now()}`;

      return {
        success: true,
        data: {
          certificateNumber,
          batch: {
            batchNumber: test.batch.batchNumber,
            product: test.batch.product.name,
            sku: test.batch.product.sku,
          },
          test: {
            type: test.testType,
            parameter: test.parameter,
            expectedValue: test.expectedValue,
            actualValue: test.actualValue,
            unit: test.unit,
            result: test.result,
          },
          lab: {
            name: test.labName || 'FirstCrop QC Lab',
            tester: test.tester?.name,
          },
          issuedAt: new Date(),
          expiryDate: test.batch.expiryDate,
          organization: test.batch.organization.name,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
