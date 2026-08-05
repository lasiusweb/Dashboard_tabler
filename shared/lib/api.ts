const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3002/api';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, params } = options;

    let url = `${this.baseUrl}${endpoint}`;

    // Add query parameters
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  // ─── Auth ────────────────────────────────────────────────────────────────

  async signIn(email: string, password: string) {
    return this.request('/auth/sign-in', {
      method: 'POST',
      body: { email, password },
    });
  }

  async signUp(email: string, password: string, name: string) {
    return this.request('/auth/sign-up', {
      method: 'POST',
      body: { email, password, name },
    });
  }

  async signOut() {
    return this.request('/auth/sign-out', { method: 'POST' });
  }

  // ─── Users ───────────────────────────────────────────────────────────────

  async getUsers(organizationId?: string) {
    return this.request('/users', {
      params: organizationId ? { organizationId } : undefined,
    });
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  // ─── Products ────────────────────────────────────────────────────────────

  async getProducts(
    organizationId: string,
    filters?: { category?: string; isActive?: boolean; search?: string }
  ) {
    const params: Record<string, string> = { organizationId };
    if (filters?.category) params.category = filters.category;
    if (filters?.isActive !== undefined) params.isActive = String(filters.isActive);
    if (filters?.search) params.search = filters.search;

    return this.request('/products', { params });
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async getProductBySku(sku: string) {
    return this.request(`/products/sku/${sku}`);
  }

  async createProduct(data: any) {
    return this.request('/products', {
      method: 'POST',
      body: data,
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  async getProductStats(organizationId: string) {
    return this.request('/products/stats', {
      params: { organizationId },
    });
  }

  async getStrainStats(organizationId: string) {
    return this.request('/products/strains', {
      params: { organizationId },
    });
  }

  // ─── Batches ─────────────────────────────────────────────────────────────

  async getBatches(
    organizationId: string,
    filters?: { status?: string; productId?: string }
  ) {
    const params: Record<string, string> = { organizationId };
    if (filters?.status) params.status = filters.status;
    if (filters?.productId) params.productId = filters.productId;

    return this.request('/batches', { params });
  }

  async getBatch(id: string) {
    return this.request(`/batches/${id}`);
  }

  async createBatch(data: any) {
    return this.request('/batches', {
      method: 'POST',
      body: data,
    });
  }

  async updateBatch(id: string, data: any) {
    return this.request(`/batches/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  // ─── QC ──────────────────────────────────────────────────────────────────

  async getQCTests(batchId: string) {
    return this.request('/qc', {
      params: { batchId },
    });
  }

  async createQCTest(data: any) {
    return this.request('/qc', {
      method: 'POST',
      body: data,
    });
  }

  async updateQCTest(id: string, data: any) {
    return this.request(`/qc/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  // ─── Inventory ───────────────────────────────────────────────────────────

  async getInventory(organizationId: string, locationId?: string) {
    const params: Record<string, string> = { organizationId };
    if (locationId) params.locationId = locationId;

    return this.request('/inventory', { params });
  }

  async getInventoryMovements(organizationId: string, productId?: string) {
    const params: Record<string, string> = { organizationId };
    if (productId) params.productId = productId;

    return this.request('/inventory/movements', { params });
  }

  async createInventoryMovement(data: any) {
    return this.request('/inventory/movements', {
      method: 'POST',
      body: data,
    });
  }

  // ─── Orders ──────────────────────────────────────────────────────────────

  async getOrders(
    organizationId: string,
    filters?: { status?: string; customerId?: string }
  ) {
    const params: Record<string, string> = { organizationId };
    if (filters?.status) params.status = filters.status;
    if (filters?.customerId) params.customerId = filters.customerId;

    return this.request('/orders', { params });
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(data: any) {
    return this.request('/orders', {
      method: 'POST',
      body: data,
    });
  }

  async updateOrder(id: string, data: any) {
    return this.request(`/orders/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  // ─── Procurement ─────────────────────────────────────────────────────────

  async getPurchaseOrders(organizationId: string, status?: string) {
    const params: Record<string, string> = { organizationId };
    if (status) params.status = status;

    return this.request('/procurement', { params });
  }

  async createPurchaseOrder(data: any) {
    return this.request('/procurement', {
      method: 'POST',
      body: data,
    });
  }

  // ─── Logistics ───────────────────────────────────────────────────────────

  async getShipments(organizationId: string, status?: string) {
    const params: Record<string, string> = { organizationId };
    if (status) params.status = status;

    return this.request('/logistics', { params });
  }

  async getShipment(id: string) {
    return this.request(`/logistics/${id}`);
  }

  async createShipment(data: any) {
    return this.request('/logistics', {
      method: 'POST',
      body: data,
    });
  }

  // ─── Finance ─────────────────────────────────────────────────────────────

  async getInvoices(organizationId: string, status?: string) {
    const params: Record<string, string> = { organizationId };
    if (status) params.status = status;

    return this.request('/finance/invoices', { params });
  }

  async getInvoice(id: string) {
    return this.request(`/finance/invoices/${id}`);
  }

  async createInvoice(data: any) {
    return this.request('/finance/invoices', {
      method: 'POST',
      body: data,
    });
  }

  async createPayment(invoiceId: string, data: any) {
    return this.request(`/finance/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: data,
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export type { ApiClient };
