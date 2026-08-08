import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ManufacturingTools } from './manufacturing'
import { PrismaClient } from '@firstcrop/db'

const DAY = 1000 * 60 * 60 * 24

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * DAY)
}

describe('ManufacturingTools', () => {
  let tools: ManufacturingTools
  let prisma: any

  beforeEach(() => {
    prisma = {
      batch: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      qCTest: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      rawMaterial: {
        findMany: vi.fn(),
        fields: { reorderLevel: 'reorderLevel' },
      },
      complianceRecord: {
        findMany: vi.fn(),
      },
      salesOrder: {
        findMany: vi.fn(),
      },
      party: {
        findUnique: vi.fn(),
      },
      purchaseOrder: {
        findMany: vi.fn(),
      },
      shipment: {
        findUnique: vi.fn(),
      },
    }
    tools = new ManufacturingTools(prisma as unknown as PrismaClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('checkBatchExpiry', () => {
    it('returns OK for batches far from expiry', async () => {
      prisma.batch.findUnique.mockResolvedValue({
        id: 'b-1',
        batchNumber: 'B-001',
        product: { name: 'BioFert', sku: 'BF-1' },
        expiryDate: daysFromNow(120),
        actualQuantity: 100,
        unit: 'KG',
      })
      const result = await tools.checkBatchExpiry('b-1')
      expect(result.success).toBe(true)
      expect(result.data.status).toBe('OK')
      expect(result.data.daysUntilExpiry).toBe(120)
    })

    it('marks CRITICAL batches within 30 days', async () => {
      prisma.batch.findUnique.mockResolvedValue({
        id: 'b-1',
        batchNumber: 'B-001',
        product: { name: 'BioFert', sku: 'BF-1' },
        expiryDate: daysFromNow(15),
        plannedQuantity: 50,
        unit: 'KG',
      })
      const result = await tools.checkBatchExpiry('b-1')
      expect(result.data.status).toBe('CRITICAL')
      expect(result.data.quantity).toBe(50)
    })

    it('marks WARNING batches within 90 days', async () => {
      prisma.batch.findUnique.mockResolvedValue({
        id: 'b-1',
        batchNumber: 'B-001',
        product: { name: 'BioFert', sku: 'BF-1' },
        expiryDate: daysFromNow(60),
        actualQuantity: 80,
        unit: 'KG',
      })
      const result = await tools.checkBatchExpiry('b-1')
      expect(result.data.status).toBe('WARNING')
    })

    it('marks EXPIRED batches', async () => {
      prisma.batch.findUnique.mockResolvedValue({
        id: 'b-1',
        batchNumber: 'B-001',
        product: { name: 'BioFert', sku: 'BF-1' },
        expiryDate: daysFromNow(-5),
        actualQuantity: 10,
        unit: 'KG',
      })
      const result = await tools.checkBatchExpiry('b-1')
      expect(result.data.status).toBe('EXPIRED')
    })

    it('returns an error when the batch does not exist', async () => {
      prisma.batch.findUnique.mockResolvedValue(null)
      const result = await tools.checkBatchExpiry('missing')
      expect(result).toEqual({ success: false, error: 'Batch not found' })
    })

    it('returns an error when the query throws', async () => {
      prisma.batch.findUnique.mockRejectedValue(new Error('db down'))
      const result = await tools.checkBatchExpiry('b-1')
      expect(result.success).toBe(false)
      expect(result.error).toContain('db down')
    })
  })

  describe('getExpiringBatches', () => {
    it('flags expired and critical batches', async () => {
      prisma.batch.findMany.mockResolvedValue([
        { id: 'b-1', expiryDate: daysFromNow(-2), status: 'QC_PASSED', product: { name: 'A' } },
        { id: 'b-2', expiryDate: daysFromNow(10), status: 'READY_FOR_DISPATCH', product: { name: 'B' } },
        { id: 'b-3', expiryDate: daysFromNow(60), status: 'QC_PASSED', product: { name: 'C' } },
      ])
      const result = await tools.getExpiringBatches('org-1')
      expect(result.data.total).toBe(3)
      expect(result.data.expired).toBe(1)
      expect(result.data.critical).toBe(1)
      expect(result.data.batches[0].status).toBe('EXPIRED')
      expect(result.data.batches[1].status).toBe('CRITICAL')
      expect(result.data.batches[2].status).toBe('WARNING')
    })

    it('passes the warning window to the query', async () => {
      prisma.batch.findMany.mockResolvedValue([])
      await tools.getExpiringBatches('org-1', 45)
      const where = prisma.batch.findMany.mock.calls[0][0].where
      expect(where.organizationId).toBe('org-1')
      expect(where.status.in).toEqual(['QC_PASSED', 'PACKAGING', 'READY_FOR_DISPATCH'])
      expect(where.expiryDate.lte).toBeInstanceOf(Date)
    })
  })

  describe('analyzeQCTrends', () => {
    it('computes pass rates grouped by test type', async () => {
      prisma.qCTest.findMany.mockResolvedValue([
        { id: 't-1', testType: 'MICROBIAL', result: 'PASS', batch: { batchNumber: 'B-1', product: { name: 'A' } }, testedAt: new Date() },
        { id: 't-2', testType: 'MICROBIAL', result: 'PASS', batch: { batchNumber: 'B-1', product: { name: 'A' } }, testedAt: new Date() },
        { id: 't-3', testType: 'MICROBIAL', result: 'FAIL', batch: { batchNumber: 'B-2', product: { name: 'A' } }, testedAt: new Date() },
        { id: 't-4', testType: 'HEAVY_METAL', result: 'PASS', batch: { batchNumber: 'B-3', product: { name: 'B' } }, testedAt: new Date() },
      ])
      const result = await tools.analyzeQCTrends('org-1')
      expect(result.data.totalTests).toBe(4)
      expect(result.data.trends.MICROBIAL).toEqual({
        totalTests: 3,
        passCount: 2,
        failCount: 1,
        passRate: (2 / 3) * 100,
        recentTests: expect.any(Array),
      })
    })

    it('returns a zero trend for an empty period', async () => {
      prisma.qCTest.findMany.mockResolvedValue([])
      const result = await tools.analyzeQCTrends('org-1')
      expect(result.data.totalTests).toBe(0)
      expect(result.data.trends).toEqual({})
    })
  })

  describe('recommendReorder', () => {
    it('computes net reorder quantities after pending orders', async () => {
      prisma.rawMaterial.findMany.mockResolvedValue([
        {
          id: 'm-1',
          name: 'Molasses',
          code: 'RM-1',
          category: 'Sugar',
          currentStock: 10,
          reorderLevel: 50,
          reorderQuantity: 100,
          purchaseOrderItems: [
            { quantity: 30 },
            { quantity: 20 },
          ],
        },
      ])
      const result = await tools.recommendReorder('org-1')
      const rec = result.data.recommendations[0]
      expect(result.data.totalLowStock).toBe(1)
      expect(rec.pendingQuantity).toBe(50)
      expect(rec.netReorder).toBe(50)
      expect(rec.urgency).toBe('HIGH')
      expect(result.data.highUrgency).toBe(1)
    })

    it('marks medium urgency when stock is above half the reorder level', async () => {
      prisma.rawMaterial.findMany.mockResolvedValue([
        {
          id: 'm-1',
          name: 'Molasses',
          code: 'RM-1',
          category: 'Sugar',
          currentStock: 40,
          reorderLevel: 50,
          reorderQuantity: 100,
          purchaseOrderItems: [],
        },
      ])
      const result = await tools.recommendReorder('org-1')
      expect(result.data.recommendations[0].urgency).toBe('MEDIUM')
    })
  })

  describe('verifyCompliance', () => {
    it('classifies records by expiry', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([
        { id: 'c-1', certType: 'FSSAI', certificateNumber: 'F-1', issuedBy: 'Govt', expiryDate: daysFromNow(-1), party: { name: 'Acme' } },
        { id: 'c-2', certType: 'ISO', certificateNumber: 'I-1', issuedBy: 'BIS', expiryDate: daysFromNow(60), party: { name: 'Acme' } },
        { id: 'c-3', certType: 'BIS', certificateNumber: 'B-1', issuedBy: 'BIS', expiryDate: daysFromNow(200), party: { name: 'Acme' } },
      ])
      const result = await tools.verifyCompliance('org-1')
      expect(result.data.total).toBe(3)
      expect(result.data.expired).toBe(1)
      expect(result.data.expiringSoon).toBe(1)
      expect(result.data.active).toBe(1)
    })
  })

  describe('generateProductionSchedule', () => {
    it('flags needsNewBatch when no existing batch matches', async () => {
      prisma.salesOrder.findMany.mockResolvedValue([
        {
          id: 'o-1',
          orderNumber: 'SO-001',
          customerId: 'cust-1',
          requiredByDate: daysFromNow(10),
          items: [
            { productId: 'p-1', product: { name: 'BioFert' }, quantity: 50, unit: 'KG' },
            { productId: 'p-2', product: { name: 'BioPest' }, quantity: 30, unit: 'L' },
          ],
        },
      ])
      prisma.rawMaterial.findMany.mockResolvedValue([])
      prisma.batch.findMany.mockResolvedValue([
        { id: 'b-1', batchNumber: 'B-001', productId: 'p-1', status: 'QC_PASSED', actualQuantity: 100, plannedQuantity: 0 },
      ])
      const result = await tools.generateProductionSchedule('org-1')
      expect(result.data.totalOrders).toBe(1)
      expect(result.data.totalItems).toBe(2)
      const [first, second] = result.data.schedule[0].items
      expect(first.needsNewBatch).toBe(false)
      expect(first.existingBatch.id).toBe('b-1')
      expect(second.needsNewBatch).toBe(true)
      expect(result.data.newBatchesNeeded).toBe(1)
    })
  })

  describe('calculateBatchCost', () => {
    it('computes material, labor, overhead and per-unit cost', async () => {
      prisma.batch.findUnique.mockResolvedValue({
        id: 'b-1',
        batchNumber: 'B-001',
        unit: 'KG',
        actualQuantity: 100,
        product: { name: 'BioFert', costPerUnit: 500 },
        ingredients: [
          { rawMaterial: { name: 'Molasses', costPerUnit: 10 }, actualQuantity: 1000, unit: 'KG' },
          { rawMaterial: { name: 'Culture', costPerUnit: 100 }, actualQuantity: 100, unit: 'L' },
        ],
      })
      const result = await tools.calculateBatchCost('b-1')
      const data = result.data
      expect(data.totalMaterialCost).toBe(20000)
      expect(data.laborCost).toBe(4000)
      expect(data.overheadCost).toBe(2000)
      expect(data.totalCost).toBe(26000)
      expect(data.costPerUnit).toBe(260)
      expect(data.margin).toBeCloseTo(((500 - 260) / 500) * 100, 5)
    })

    it('returns an error when the batch is missing', async () => {
      prisma.batch.findUnique.mockResolvedValue(null)
      const result = await tools.calculateBatchCost('missing')
      expect(result).toEqual({ success: false, error: 'Batch not found' })
    })
  })

  describe('assessVendorPerformance', () => {
    it('calculates on-time rate and rating', async () => {
      prisma.party.findUnique.mockResolvedValue({ id: 'v-1', name: 'Acme' })
      const yesterday = new Date(Date.now() - DAY)
      prisma.purchaseOrder.findMany.mockResolvedValue([
        { status: 'FULLY_RECEIVED', totalAmount: 100, expectedDate: yesterday, receivedDate: yesterday },
        { status: 'FULLY_RECEIVED', totalAmount: 200, expectedDate: yesterday, receivedDate: yesterday },
        { status: 'FULLY_RECEIVED', totalAmount: 150, expectedDate: yesterday, receivedDate: new Date(Date.now() + 3 * DAY) },
      ])
      const result = await tools.assessVendorPerformance('v-1')
      const data = result.data
      expect(data.totalOrders).toBe(3)
      expect(data.completedOrders).toBe(3)
      expect(data.completionRate).toBe(100)
      expect(data.totalSpent).toBe(450)
      expect(data.avgDeliveryDays).toBeCloseTo(4 / 3, 5)
      expect(data.onTimeRate).toBeCloseTo((2 / 3) * 100, 5)
      expect(data.rating).toBe(4.5)
    })

    it('returns an error when the vendor is missing', async () => {
      prisma.party.findUnique.mockResolvedValue(null)
      const result = await tools.assessVendorPerformance('missing')
      expect(result).toEqual({ success: false, error: 'Vendor not found' })
    })
  })

  describe('trackColdChain', () => {
    it('analyzes temperatures and reports excursions', async () => {
      prisma.shipment.findUnique.mockResolvedValue({
        id: 's-1',
        shipmentNumber: 'SHP-001',
        status: 'IN_TRANSIT',
        salesOrder: { orderNumber: 'SO-001' },
        vehicle: { registrationNumber: 'KA-01-1234', hasColdChain: true, minTemp: 2, maxTemp: 8 },
        temperatureLog: [
          { temperature: 4 },
          { temperature: 6 },
          { temperature: 12 },
        ],
        gpsLog: [{ lat: 12.9, lng: 77.5 }],
      })
      const result = await tools.trackColdChain('s-1')
      const data = result.data
      expect(data.temperature.min).toBe(4)
      expect(data.temperature.max).toBe(12)
      expect(data.temperature.avg).toBeCloseTo(22 / 3, 5)
      expect(data.excursions).toBe(1)
      expect(data.gpsPoints).toBe(1)
      expect(data.lastGpsPoint).toEqual({ lat: 12.9, lng: 77.5 })
    })

    it('returns an error when the shipment is missing', async () => {
      prisma.shipment.findUnique.mockResolvedValue(null)
      const result = await tools.trackColdChain('missing')
      expect(result).toEqual({ success: false, error: 'Shipment not found' })
    })
  })

  describe('generateQCCertificate', () => {
    it('builds a certificate for a completed test', async () => {
      prisma.qCTest.findUnique.mockResolvedValue({
        id: 't-1',
        testType: 'MICROBIAL',
        parameter: 'Coliform',
        expectedValue: '<10',
        actualValue: '0',
        unit: 'CFU/g',
        result: 'PASS',
        labName: 'FirstCrop QC Lab',
        tester: { name: 'Dr. Rao', email: 'rao@firstcrop.in' },
        batch: {
          batchNumber: 'B-001',
          expiryDate: daysFromNow(120),
          product: { name: 'BioFert', sku: 'BF-1' },
          organization: { name: 'FirstCrop India' },
        },
      })
      const result = await tools.generateQCCertificate('t-1')
      const data = result.data
      expect(data.certificateNumber).toMatch(/^QC-B-001-\d+$/)
      expect(data.batch.product).toBe('BioFert')
      expect(data.test.result).toBe('PASS')
      expect(data.lab.tester).toBe('Dr. Rao')
      expect(data.organization).toBe('FirstCrop India')
    })

    it('rejects a test without a result', async () => {
      prisma.qCTest.findUnique.mockResolvedValue({
        id: 't-1',
        testType: 'MICROBIAL',
        result: null,
        batch: { batchNumber: 'B-001', product: { name: 'BioFert' }, organization: { name: 'X' } },
      })
      const result = await tools.generateQCCertificate('t-1')
      expect(result).toEqual({ success: false, error: 'Test not completed yet' })
    })

    it('returns an error when the test is missing', async () => {
      prisma.qCTest.findUnique.mockResolvedValue(null)
      const result = await tools.generateQCCertificate('missing')
      expect(result).toEqual({ success: false, error: 'QC test not found' })
    })
  })
})
