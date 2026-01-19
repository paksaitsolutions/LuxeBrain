export interface User {
  id: string;
  email: string;
  role: 'admin' | 'tenant';
  tenant_id?: string;
}

export interface Subscription {
  plan: 'starter' | 'growth' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string;
}

export interface Metrics {
  ai_revenue: number;
  ai_revenue_change: number;
  conversion_lift: number;
  conversion_lift_change: number;
  aov_increase: number;
  aov_increase_change: number;
  active_campaigns: number;
  campaign_change: number;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  created_at: string;
  mrr: number;
}
