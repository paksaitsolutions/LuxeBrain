export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const PLANS = {
  starter: { name: 'Starter', price: 99, products: 500, recommendations: 5000 },
  growth: { name: 'Growth', price: 299, products: 2000, recommendations: 50000 },
  pro: { name: 'Pro', price: 799, products: -1, recommendations: -1 },
  enterprise: { name: 'Enterprise', price: 0, products: -1, recommendations: -1 },
};

export const ROUTES = {
  tenant: {
    overview: '/overview',
    recommendations: '/recommendations',
    automation: '/automation',
    analytics: '/analytics',
    settings: '/settings',
    billing: '/billing',
  },
  admin: {
    tenants: '/tenants',
    revenue: '/revenue',
    usage: '/usage',
    support: '/support',
  },
};
