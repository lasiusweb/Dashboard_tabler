import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchProducts,
  fetchProductStats,
  fetchBatches,
  fetchExpiringBatches,
  fetchQCTests,
  fetchInventory,
  fetchOrders,
  fetchPurchaseOrders,
  fetchShipments,
  fetchFinance,
  fetchComplianceRecords,
  fetchDistributors,
  fetchRawMaterials,
  fetchFieldVisits,
  fetchActivities,
  fetchParties,
  fetchUsers,
  fetchOrganizations,
  fetchAppSettings,
} from './fetchers'

const API_BASE = 'http://localhost:3002/api'

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(body),
    }),
  )
}

describe('fetchers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('apiFetch behavior', () => {
    it('sends the organizationId query param', async () => {
      mockFetchResponse([{ id: 1 }])
      await fetchProducts('org-1')
      const url = (fetch as any).mock.calls[0][0] as string
      expect(url).toBe(`${API_BASE}/products?organizationId=org-1`)
    })

    it('returns an empty array for a non-OK response', async () => {
      mockFetchResponse(null, false, 500)
      expect(await fetchProducts('org-1')).toEqual([])
    })

    it('returns an empty array when the API is unreachable', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
      expect(await fetchProducts('org-1')).toEqual([])
    })

    it('returns null for stats when the API is unreachable', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
      expect(await fetchProductStats('org-1')).toBeNull()
    })

    it('returns the parsed JSON body on success', async () => {
      mockFetchResponse({ total: 3 })
      expect(await fetchProductStats('org-1')).toEqual({ total: 3 })
    })
  })

  describe('optional query params', () => {
    it('adds status when provided for batches', async () => {
      mockFetchResponse([])
      await fetchBatches('org-1', 'QC_PASSED')
      const url = (fetch as any).mock.calls[0][0] as string
      expect(url).toContain('organizationId=org-1')
      expect(url).toContain('status=QC_PASSED')
    })

    it('omits status when not provided', async () => {
      mockFetchResponse([])
      await fetchBatches('org-1')
      const url = (fetch as any).mock.calls[0][0] as string
      expect(url).not.toContain('status=')
    })

    it('adds daysWarning for expiring batches', async () => {
      mockFetchResponse([])
      await fetchExpiringBatches('org-1', 60)
      const url = (fetch as any).mock.calls[0][0] as string
      expect(url).toContain('daysWarning=60')
    })

    it('adds batchId for QC tests', async () => {
      mockFetchResponse([])
      await fetchQCTests('org-1', 'b-1')
      const url = (fetch as any).mock.calls[0][0] as string
      expect(url).toContain('batchId=b-1')
    })

    it('adds territory and state for distributors', async () => {
      mockFetchResponse([])
      await fetchDistributors('org-1', { territory: 'Karnataka', state: 'KA' })
      const url = (fetch as any).mock.calls[0][0] as string
      expect(url).toContain('territory=Karnataka')
      expect(url).toContain('state=KA')
    })

    it('adds category and search for raw materials', async () => {
      mockFetchResponse([])
      await fetchRawMaterials('org-1', { category: 'Sugar', search: 'molasses' })
      const url = (fetch as any).mock.calls[0][0] as string
      expect(url).toContain('category=Sugar')
      expect(url).toContain('search=molasses')
    })

    it('adds status and visitType for field visits', async () => {
      mockFetchResponse([])
      await fetchFieldVisits('org-1', { status: 'COMPLETED', visitType: 'FARM' })
      const url = (fetch as any).mock.calls[0][0] as string
      expect(url).toContain('status=COMPLETED')
      expect(url).toContain('visitType=FARM')
    })

    it('adds entityType, type and limit for activities', async () => {
      mockFetchResponse([])
      await fetchActivities('org-1', { entityType: 'Batch', type: 'QC', limit: 10 })
      const url = (fetch as any).mock.calls[0][0] as string
      expect(url).toContain('entityType=Batch')
      expect(url).toContain('type=QC')
      expect(url).toContain('limit=10')
    })

    it('adds type for parties', async () => {
      mockFetchResponse([])
      await fetchParties('org-1', 'VENDOR')
      const url = (fetch as any).mock.calls[0][0] as string
      expect(url).toContain('type=VENDOR')
    })
  })

  describe('collection fetchers', () => {
    const cases: Array<[string, () => Promise<unknown>]> = [
      ['inventory', () => fetchInventory('org-1')],
      ['orders', () => fetchOrders('org-1')],
      ['procurement', () => fetchPurchaseOrders('org-1')],
      ['logistics', () => fetchShipments('org-1')],
      ['finance', () => fetchFinance('org-1')],
      ['compliance', () => fetchComplianceRecords('org-1')],
      ['users', () => fetchUsers('org-1')],
      ['app-settings', () => fetchAppSettings('org-1')],
      ['organizations', () => fetchOrganizations()],
    ]

    it.each(cases)('hits the %s endpoint and returns an array', async (_label, call) => {
      mockFetchResponse([{ id: 1 }])
      expect(await call()).toEqual([{ id: 1 }])
    })

    it('returns the parsed object as-is (no array coercion)', async () => {
      mockFetchResponse({ notAnArray: true })
      expect(await fetchInventory('org-1')).toEqual({ notAnArray: true })
    })
  })
})
