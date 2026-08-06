import type { Product, ProductStats, Batch, BatchStats, QCTest, QCStats, InventoryItem, InventoryStats, SalesOrder, OrderStats, PurchaseOrder, Shipment, LogisticsStats, Invoice, FinanceStats, ComplianceRecord, ComplianceStats, Distributor, DistributorStats, RawMaterial, RawMaterialStats } from './types'

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3002/api'
const DEFAULT_ORG_ID = import.meta.env.PUBLIC_ORGANIZATION_ID || ''

// ─── Generic Fetcher ──────────────────────────────────────────────────────

async function apiFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  try {
    const url = new URL(`${API_BASE_URL}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value)
      })
    }

    const response = await fetch(url.toString(), {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000), // 5s timeout for static builds
    })

    if (!response.ok) return null
    return response.json()
  } catch {
    // API unavailable (static build, dev without API, etc.)
    return null
  }
}

// ─── Products ─────────────────────────────────────────────────────────────

export async function fetchProducts(orgId?: string): Promise<Product[]> {
  const data = await apiFetch<Product[]>('/products', { organizationId: orgId || DEFAULT_ORG_ID })
  return data || []
}

export async function fetchProductStats(orgId?: string): Promise<ProductStats | null> {
  return apiFetch<ProductStats>('/products/stats', { organizationId: orgId || DEFAULT_ORG_ID })
}

// ─── Batches ──────────────────────────────────────────────────────────────

export async function fetchBatches(orgId?: string, status?: string): Promise<Batch[]> {
  const params: Record<string, string> = { organizationId: orgId || DEFAULT_ORG_ID }
  if (status) params.status = status
  const data = await apiFetch<Batch[]>('/batches', params)
  return data || []
}

export async function fetchBatchStats(orgId?: string): Promise<BatchStats | null> {
  return apiFetch<BatchStats>('/batches/stats', { organizationId: orgId || DEFAULT_ORG_ID })
}

export async function fetchExpiringBatches(orgId?: string, days?: number): Promise<Batch[]> {
  const params: Record<string, string> = { organizationId: orgId || DEFAULT_ORG_ID }
  if (days) params.daysWarning = String(days)
  const data = await apiFetch<Batch[]>('/batches/expiring', params)
  return data || []
}

// ─── QC Tests ─────────────────────────────────────────────────────────────

export async function fetchQCTests(orgId?: string, batchId?: string): Promise<QCTest[]> {
  const params: Record<string, string> = { organizationId: orgId || DEFAULT_ORG_ID }
  if (batchId) params.batchId = batchId
  const data = await apiFetch<QCTest[]>('/qc', params)
  return data || []
}

export async function fetchQCStats(orgId?: string): Promise<QCStats | null> {
  return apiFetch<QCStats>('/qc/stats', { organizationId: orgId || DEFAULT_ORG_ID })
}

export async function fetchPendingQCTests(orgId?: string): Promise<QCTest[]> {
  const data = await apiFetch<QCTest[]>('/qc/pending', { organizationId: orgId || DEFAULT_ORG_ID })
  return data || []
}

// ─── Inventory ────────────────────────────────────────────────────────────

export async function fetchInventory(orgId?: string): Promise<InventoryItem[]> {
  const data = await apiFetch<InventoryItem[]>('/inventory', { organizationId: orgId || DEFAULT_ORG_ID })
  return data || []
}

export async function fetchInventoryStats(orgId?: string): Promise<InventoryStats | null> {
  return apiFetch<InventoryStats>('/inventory/stats', { organizationId: orgId || DEFAULT_ORG_ID })
}

export async function fetchLowStock(orgId?: string): Promise<InventoryItem[]> {
  const data = await apiFetch<InventoryItem[]>('/inventory/low-stock', { organizationId: orgId || DEFAULT_ORG_ID })
  return data || []
}

// ─── Orders ───────────────────────────────────────────────────────────────

export async function fetchOrders(orgId?: string, status?: string): Promise<SalesOrder[]> {
  const params: Record<string, string> = { organizationId: orgId || DEFAULT_ORG_ID }
  if (status) params.status = status
  const data = await apiFetch<SalesOrder[]>('/orders', params)
  return data || []
}

export async function fetchOrderStats(orgId?: string): Promise<OrderStats | null> {
  return apiFetch<OrderStats>('/orders/stats', { organizationId: orgId || DEFAULT_ORG_ID })
}

export async function fetchCustomers(orgId?: string): Promise<any[]> {
  const data = await apiFetch<any[]>('/orders/customers', { organizationId: orgId || DEFAULT_ORG_ID })
  return data || []
}

// ─── Procurement ──────────────────────────────────────────────────────────

export async function fetchPurchaseOrders(orgId?: string, status?: string): Promise<PurchaseOrder[]> {
  const params: Record<string, string> = { organizationId: orgId || DEFAULT_ORG_ID }
  if (status) params.status = status
  const data = await apiFetch<PurchaseOrder[]>('/procurement', params)
  return data || []
}

export async function fetchProcurementStats(orgId?: string): Promise<any | null> {
  return apiFetch<any>('/procurement/stats', { organizationId: orgId || DEFAULT_ORG_ID })
}

export async function fetchVendors(orgId?: string): Promise<any[]> {
  const data = await apiFetch<any[]>('/procurement/vendors', { organizationId: orgId || DEFAULT_ORG_ID })
  return data || []
}

// ─── Logistics ────────────────────────────────────────────────────────────

export async function fetchShipments(orgId?: string, status?: string): Promise<Shipment[]> {
  const params: Record<string, string> = { organizationId: orgId || DEFAULT_ORG_ID }
  if (status) params.status = status
  const data = await apiFetch<Shipment[]>('/logistics', params)
  return data || []
}

export async function fetchLogisticsStats(orgId?: string): Promise<LogisticsStats | null> {
  return apiFetch<LogisticsStats>('/logistics/stats', { organizationId: orgId || DEFAULT_ORG_ID })
}

// ─── Finance ──────────────────────────────────────────────────────────────

export async function fetchFinance(orgId?: string): Promise<Invoice[]> {
  const data = await apiFetch<Invoice[]>('/finance', { organizationId: orgId || DEFAULT_ORG_ID })
  return data || []
}

export async function fetchInvoices(orgId?: string, status?: string): Promise<Invoice[]> {
  const params: Record<string, string> = { organizationId: orgId || DEFAULT_ORG_ID }
  if (status) params.status = status
  const data = await apiFetch<Invoice[]>('/finance/invoices', params)
  return data || []
}

export async function fetchFinanceStats(orgId?: string): Promise<FinanceStats | null> {
  return apiFetch<FinanceStats>('/finance/stats', { organizationId: orgId || DEFAULT_ORG_ID })
}

export async function fetchReceivables(orgId?: string): Promise<any[]> {
  const data = await apiFetch<any[]>('/finance/receivables', { organizationId: orgId || DEFAULT_ORG_ID })
  return data || []
}

// ─── Compliance ───────────────────────────────────────────────────────────

export async function fetchComplianceRecords(orgId?: string): Promise<ComplianceRecord[]> {
  const data = await apiFetch<ComplianceRecord[]>('/compliance', { organizationId: orgId || DEFAULT_ORG_ID })
  return data || []
}

export async function fetchComplianceStats(orgId?: string): Promise<ComplianceStats | null> {
  return apiFetch<ComplianceStats>('/compliance/stats', { organizationId: orgId || DEFAULT_ORG_ID })
}

export async function fetchExpiringCompliance(orgId?: string, days?: number): Promise<ComplianceRecord[]> {
  const params: Record<string, string> = { organizationId: orgId || DEFAULT_ORG_ID }
  if (days) params.daysWarning = String(days)
  const data = await apiFetch<ComplianceRecord[]>('/compliance/expiring', params)
  return data || []
}

// ─── Distributors ──────────────────────────────────────────────────────────

export async function fetchDistributors(orgId?: string, filters?: { territory?: string; state?: string }): Promise<Distributor[]> {
  const params: Record<string, string> = { organizationId: orgId || DEFAULT_ORG_ID }
  if (filters?.territory) params.territory = filters.territory
  if (filters?.state) params.state = filters.state
  const data = await apiFetch<Distributor[]>('/distributors', params)
  return data || []
}

export async function fetchDistributorStats(orgId?: string): Promise<DistributorStats | null> {
  return apiFetch<DistributorStats>('/distributors/stats', { organizationId: orgId || DEFAULT_ORG_ID })
}

// ─── Raw Materials ─────────────────────────────────────────────────────────

export async function fetchRawMaterials(orgId?: string, filters?: { category?: string; search?: string }): Promise<RawMaterial[]> {
  const params: Record<string, string> = { organizationId: orgId || DEFAULT_ORG_ID }
  if (filters?.category) params.category = filters.category
  if (filters?.search) params.search = filters.search
  const data = await apiFetch<RawMaterial[]>('/raw-materials', params)
  return data || []
}

export async function fetchRawMaterialStats(orgId?: string): Promise<RawMaterialStats | null> {
  return apiFetch<RawMaterialStats>('/raw-materials/stats', { organizationId: orgId || DEFAULT_ORG_ID })
}

export async function fetchLowStockRawMaterials(orgId?: string): Promise<RawMaterial[]> {
  const data = await apiFetch<RawMaterial[]>('/raw-materials/low-stock', { organizationId: orgId || DEFAULT_ORG_ID })
  return data || []
}
