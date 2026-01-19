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

  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 3): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        clearTimeout(timeout);
        return response.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          clearTimeout(timeout);
          throw new Error('Request timeout after 30 seconds');
        }
        const isNetworkError = error instanceof TypeError || (error as any).message?.includes('fetch');
        if (!isNetworkError || attempt === retries) {
          clearTimeout(timeout);
          throw error;
        }
        
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    clearTimeout(timeout);
    throw new Error('Max retries reached');
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
