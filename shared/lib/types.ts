// ─── Manufacturing API Types ────────────────────────────────────────────────

export interface KPI {
  title: string;
  value: string;
  change: string;
  up: boolean;
  color: string;
  icon: string;
}

// ─── Products ─────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  description?: string;
  shortDescription?: string;
  strainName?: string;
  strainId?: string;
  formulationType?: string;
  cfuPerGram?: number;
  cfuPerMl?: number;
  phRange?: string;
  temperatureRange?: string;
  unitSize?: number;
  unitSizeUnit?: string;
  unitsPerPack?: number;
  packType?: string;
  mrpPerUnit?: number;
  costPerUnit?: number;
  gstRate?: number;
  shelfLifeDays?: number;
  fssaiNumber?: string;
  organicCertified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductStats {
  total: number;
  active: number;
  byCategory: Array<{ category: string; count: number }>;
  avgCfu?: number;
}

// ─── Batches ──────────────────────────────────────────────────────────────

export interface Batch {
  id: string;
  organizationId: string;
  batchNumber: string;
  productId: string;
  status: string;
  plannedQuantity: number;
  actualQuantity?: number;
  unit: string;
  yieldPercentage?: number;
  fermenterId?: string;
  fermenterCapacity?: number;
  incubationTemp?: number;
  incubationPH?: number;
  incubationTimeHours?: number;
  agitationRPM?: number;
  processingMethod?: string;
  processingDate?: string;
  packagingDate?: string;
  packagingType?: string;
  unitsProduced?: number;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  qcStatus?: string;
  qcDate?: string;
  certificateNumber?: string;
  expiryDate: string;
  shelfLifeDays?: number;
  totalCost?: number;
  costPerUnit?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface BatchStats {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  avgYield?: number;
  expiringCount: number;
}

// ─── QC Tests ─────────────────────────────────────────────────────────────

export interface QCTest {
  id: string;
  batchId: string;
  testType: string;
  testMethod?: string;
  parameter: string;
  expectedValue?: string;
  actualValue?: string;
  unit?: string;
  result?: string;
  notes?: string;
  testedById?: string;
  testedAt: string;
  certificateNumber?: string;
  labName?: string;
  batch?: Batch;
}

export interface QCStats {
  total: number;
  pending: number;
  passed: number;
  failed: number;
  byTestType: Array<{ testType: string; count: number; passRate: number }>;
}

// ─── Inventory ────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  organizationId: string;
  locationId: string;
  productId?: string;
  rawMaterialId?: string;
  batchNumber?: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  lastUpdated: string;
  location?: InventoryLocation;
  product?: Product;
}

export interface InventoryLocation {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  address?: string;
  capacity?: number;
  temperatureControlled: boolean;
  minTemp?: number;
  maxTemp?: number;
  isActive: boolean;
}

export interface InventoryMovement {
  id: string;
  organizationId: string;
  type: string;
  productId?: string;
  rawMaterialId?: string;
  batchNumber?: string;
  fromLocationId?: string;
  toLocationId?: string;
  quantity: number;
  unit: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  performedById?: string;
  performedAt: string;
  createdAt: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  byLocation: Array<{ location: string; count: number }>;
}

// ─── Orders ───────────────────────────────────────────────────────────────

export interface SalesOrder {
  id: string;
  orderNumber: string;
  organizationId: string;
  customerId: string;
  orderType: string;
  status: string;
  priority: string;
  orderDate: string;
  requiredByDate?: string;
  confirmedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  subtotal: number;
  gstAmount: number;
  discountAmount: number;
  shippingCharges: number;
  totalAmount: number;
  paymentStatus: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPincode?: string;
  notes?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Party;
  items?: SalesOrderItem[];
  shipments?: Shipment[];
  invoice?: Invoice;
}

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string;
  batchId?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  gstRate: number;
  totalAmount: number;
  dispatchedQuantity: number;
  notes?: string;
  product?: Product;
  batch?: Batch;
}

export interface OrderStats {
  total: number;
  byStatus: Array<{ status: string; count: number; totalAmount: number }>;
  totalRevenue: number;
  pendingPayment: number;
}

// ─── Procurement ──────────────────────────────────────────────────────────

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  organizationId: string;
  vendorId: string;
  status: string;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: Party;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  rawMaterialId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  gstRate: number;
  totalAmount: number;
  receivedQuantity: number;
  notes?: string;
  rawMaterial?: RawMaterial;
}

// ─── Logistics ────────────────────────────────────────────────────────────

export interface Shipment {
  id: string;
  shipmentNumber: string;
  organizationId: string;
  salesOrderId?: string;
  deliveryId?: string;
  vehicleId?: string;
  status: string;
  dispatchedAt?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  deliveredAt?: string;
  temperatureLog?: Array<{ timestamp: string; temperature: number }>;
  gpsLog?: Array<{ timestamp: string; lat: number; lng: number }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: Vehicle;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  capacity?: number;
  capacityUnit?: string;
  hasColdChain: boolean;
  minTemp?: number;
  maxTemp?: number;
  gpsTrackingId?: string;
  driverName?: string;
  driverPhone?: string;
  isActive: boolean;
}

export interface LogisticsStats {
  total: number;
  inTransit: number;
  delivered: number;
  byStatus: Array<{ status: string; count: number }>;
}

// ─── Finance ──────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoiceNumber: string;
  organizationId: string;
  salesOrderId?: string;
  purchaseOrderId?: string;
  vendorId?: string;
  customerId?: string;
  type: string;
  status: string;
  invoiceDate: string;
  dueDate?: string;
  paidDate?: string;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  tdsAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  vendorAccountId?: string;
  amount: number;
  method: string;
  referenceNumber?: string;
  notes?: string;
  paidAt: string;
  createdAt: string;
}

export interface FinanceStats {
  totalInvoices: number;
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  byStatus: Array<{ status: string; count: number; amount: number }>;
}

// ─── Compliance ───────────────────────────────────────────────────────────

export interface ComplianceRecord {
  id: string;
  organizationId: string;
  partyId?: string;
  productId?: string;
  certType: string;
  certificateNumber: string;
  issuedBy?: string;
  issuedDate: string;
  expiryDate: string;
  status: string;
  documentUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  byStatus: Array<{ status: string; _count: number }>;
  byCertType: Array<{ certType: string; _count: number }>;
}

// ─── Party (Customer/Vendor) ─────────────────────────────────────────────

export interface Party {
  id: string;
  organizationId: string;
  type: string;
  name: string;
  displayName?: string;
  legalName?: string;
  gstin?: string;
  panNumber?: string;
  fssaiNumber?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  addressLine1?: string;
  addressLine2?: string;
  website?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Raw Material ─────────────────────────────────────────────────────────

export interface RawMaterial {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  strainName?: string;
  cultureCollection?: string;
  strainType?: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  reorderQuantity: number;
  maxStock?: number;
  costPerUnit?: number;
  storageCondition?: string;
  minTemp?: number;
  maxTemp?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
