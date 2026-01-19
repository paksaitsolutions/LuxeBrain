export interface ApiConfig {
  baseURL: string;
  token?: string;
}

class LuxeBrainAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getRecommendations(customerId: number, limit: number = 10) {
    return this.request('/api/v1/recommendations/', {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId, limit }),
    });
  }

  async getMetrics(tenantId: string) {
    return this.request(`/api/v1/metrics/?tenant_id=${tenantId}`);
  }

  async getRevenueChart(tenantId: string, range: string) {
    return this.request(`/api/v1/analytics/revenue?tenant_id=${tenantId}&range=${range}`);
  }

  async getSubscription(tenantId: string) {
    return this.request(`/api/v1/billing/subscription?tenant_id=${tenantId}`);
  }

  async upgradePlan(tenantId: string, planId: string) {
    return this.request('/api/v1/billing/upgrade', {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId, plan_id: planId }),
    });
  }

  admin = {
    getAllTenants: () => this.request('/api/v1/admin/tenants'),
    upgradeTenant: (id: string, plan: string) =>
      this.request('/api/v1/admin/tenants/upgrade', {
        method: 'POST',
        body: JSON.stringify({ tenant_id: id, plan }),
      }),
    suspendTenant: (id: string) =>
      this.request(`/api/v1/admin/tenants/${id}/suspend`, { method: 'POST' }),
  };
}

export const createApiClient = (baseURL: string) => new LuxeBrainAPI(baseURL);
