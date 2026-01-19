# LuxeBrain AI - SaaS Multi-Tenant Architecture
**Copyright © 2024 Paksa IT Solutions**

---

## 🎯 EXECUTIVE SUMMARY

Transform LuxeBrain from single-tenant to **1,000+ store SaaS** with:
- **80%+ gross margin** (target: 85%)
- **<30 min time-to-value** for new customers
- **$500K ARR in 12 months** (100 stores × $5K average)

---

## 1. MULTI-TENANT ARCHITECTURE

### 1.1 Tenant Isolation Strategy

**Approach: Hybrid (Database-per-tenant for data + Shared infrastructure)**

```
┌─────────────────────────────────────────────────────────────┐
│                    SAAS CONTROL PLANE                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Tenant Mgmt  │  │   Billing    │  │   Analytics  │      │
│  │  (Postgres)  │  │   (Stripe)   │  │  (ClickHouse)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY (FastAPI)                     │
│  • Tenant identification (subdomain/API key)                 │
│  • Rate limiting per plan                                    │
│  • Feature gating                                            │
│  • Usage tracking                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  TENANT DATA LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Tenant A    │  │  Tenant B    │  │  Tenant C    │      │
│  │  (Postgres)  │  │  (Postgres)  │  │  (Postgres)  │      │
│  │  Schema A    │  │  Schema B    │  │  Schema C    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              SHARED ML INFRASTRUCTURE                        │
│  • Shared TensorFlow models (multi-tenant aware)             │
│  • Redis cache (tenant-prefixed keys)                        │
│  • S3 storage (tenant-prefixed paths)                        │
│  • Celery workers (tenant-aware tasks)                       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Why This Architecture?

**Data Isolation**: Each tenant gets own Postgres schema
- **Security**: Complete data separation
- **Compliance**: GDPR, data residency
- **Performance**: No cross-tenant queries
- **Backup**: Per-tenant restore

**Shared Infrastructure**: ML models, cache, workers
- **Cost**: 80%+ margin by sharing compute
- **Efficiency**: One model serves all tenants
- **Updates**: Deploy once, all benefit

### 1.3 Tenant Identification

```python
# Every API request includes tenant context
@app.middleware("http")
async def tenant_middleware(request: Request, call_next):
    # Method 1: Subdomain (store1.luxebrain.ai)
    subdomain = request.url.hostname.split('.')[0]
    
    # Method 2: API Key (X-Tenant-Key header)
    api_key = request.headers.get("X-Tenant-Key")
    
    # Method 3: JWT token (tenant_id in claims)
    token = request.headers.get("Authorization")
    
    tenant = get_tenant(subdomain or api_key or token)
    request.state.tenant = tenant
    
    return await call_next(request)
```

---

## 2. DATABASE SCHEMA DESIGN

### 2.1 Control Plane (Shared)

```sql
-- Tenant management
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    subdomain VARCHAR(50) UNIQUE,
    company_name VARCHAR(255),
    plan_id VARCHAR(20),  -- starter, growth, pro, enterprise
    status VARCHAR(20),    -- trial, active, suspended, cancelled
    trial_ends_at TIMESTAMP,
    created_at TIMESTAMP,
    monthly_revenue DECIMAL(10,2),
    
    -- Usage tracking
    api_calls_month INTEGER DEFAULT 0,
    products_count INTEGER DEFAULT 0,
    orders_month INTEGER DEFAULT 0,
    
    -- Limits per plan
    api_limit INTEGER,
    products_limit INTEGER,
    
    -- Connection info
    db_schema VARCHAR(50),
    woocommerce_url VARCHAR(255),
    woocommerce_key TEXT,
    woocommerce_secret TEXT
);

-- Subscription & billing
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    stripe_subscription_id VARCHAR(255),
    plan_id VARCHAR(20),
    status VARCHAR(20),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    mrr DECIMAL(10,2),
    created_at TIMESTAMP
);

-- Usage tracking (for billing)
CREATE TABLE usage_events (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID,
    event_type VARCHAR(50),  -- api_call, recommendation, email_sent
    quantity INTEGER DEFAULT 1,
    cost DECIMAL(10,4),
    created_at TIMESTAMP,
    INDEX idx_tenant_date (tenant_id, created_at)
);

-- Feature flags
CREATE TABLE feature_flags (
    tenant_id UUID,
    feature VARCHAR(50),
    enabled BOOLEAN DEFAULT true,
    PRIMARY KEY (tenant_id, feature)
);
```

### 2.2 Tenant Data Plane (Per-tenant schema)

```sql
-- Each tenant gets own schema: tenant_abc123
CREATE SCHEMA tenant_abc123;

-- Same tables as current LuxeBrain
-- customers, products, orders, recommendations, etc.
-- But isolated per tenant
```

---

## 3. TENANT-AWARE ML MODELS

### 3.1 Shared Model Architecture

```python
class TenantAwareRecommendationEngine:
    """Single model serves all tenants with tenant embeddings"""
    
    def __init__(self):
        # Shared base model
        self.base_model = load_shared_model()
        
        # Tenant-specific fine-tuning (optional)
        self.tenant_adapters = {}
    
    def predict(self, tenant_id: str, customer_id: int, limit: int):
        # Get tenant data from tenant-specific schema
        with get_tenant_db(tenant_id) as db:
            customer_data = db.query(Customer).filter_by(id=customer_id).first()
            products = db.query(Product).all()
        
        # Add tenant embedding to features
        features = self._extract_features(customer_data, products)
        features['tenant_id'] = self._tenant_embedding(tenant_id)
        
        # Predict using shared model
        predictions = self.base_model.predict(features)
        
        return predictions
    
    def _tenant_embedding(self, tenant_id: str):
        """Learn tenant-specific patterns"""
        # Tenant characteristics: industry, size, behavior
        return self.tenant_adapters.get(tenant_id, default_embedding)
```

### 3.2 Cost Optimization

**Shared Model Benefits**:
- Train once, serve 1000x
- GPU cost: $500/month (vs $500/tenant)
- **Margin impact**: +75%

**When to Fine-tune**:
- Enterprise plan only
- >10K orders/month
- Charge $500/month extra

---

## 4. SAAS CONTROL PANEL

### 4.1 Admin Dashboard (Paksa IT)

**URL**: admin.luxebrain.ai

**Features**:
- Tenant list with MRR, churn risk
- System health (API latency, error rate)
- Cost per tenant (compute, storage)
- Feature usage heatmap
- Support tickets

**Key Metrics**:
```
┌─────────────────────────────────────────┐
│  MRR: $45,000  (+15% MoM)               │
│  Active Tenants: 120                    │
│  Churn Rate: 3.2%                       │
│  Gross Margin: 84%                      │
│  Avg Revenue/Tenant: $375               │
└─────────────────────────────────────────┘
```

### 4.2 Client Dashboard (Store Owner)

**URL**: {subdomain}.luxebrain.ai/dashboard

**Features**:
- Revenue impact (AI-driven sales)
- Feature usage (recommendations, pricing)
- Plan limits & usage
- Billing & invoices
- API keys
- Integration status

**First-time Experience**:
```
┌─────────────────────────────────────────┐
│  Welcome to LuxeBrain AI! 🎉            │
│                                         │
│  ✅ Plugin installed                    │
│  ⏳ Syncing products... (45/100)        │
│  ⏳ Training AI models... 2 min left    │
│                                         │
│  Next: Enable cross-sell on products   │
└─────────────────────────────────────────┘
```

---

## 5. PRICING STRATEGY

### 5.1 Pricing Tiers

| Feature | Starter | Growth | Pro | Enterprise |
|---------|---------|--------|-----|------------|
| **Price** | $99/mo | $299/mo | $799/mo | Custom |
| **Products** | 500 | 2,000 | 10,000 | Unlimited |
| **Orders/mo** | 1,000 | 5,000 | 25,000 | Unlimited |
| **API Calls** | 50K | 200K | 1M | Unlimited |
| **Recommendations** | ✅ | ✅ | ✅ | ✅ |
| **Dynamic Pricing** | ❌ | ✅ | ✅ | ✅ |
| **Chatbot** | ❌ | Basic | Advanced | Custom |
| **Visual Search** | ❌ | ❌ | ✅ | ✅ |
| **Email Automation** | 1K/mo | 5K/mo | 25K/mo | Unlimited |
| **WhatsApp** | ❌ | ❌ | ✅ | ✅ |
| **A/B Testing** | ❌ | ❌ | ✅ | ✅ |
| **Custom Models** | ❌ | ❌ | ❌ | ✅ |
| **Support** | Email | Email + Chat | Priority | Dedicated |
| **Onboarding** | Self-serve | Guided | White-glove | Custom |

### 5.2 Pricing Logic

**Value-based pricing**:
- Starter: $99 → Generates $2,000+ extra revenue
- Growth: $299 → Generates $6,000+ extra revenue
- Pro: $799 → Generates $20,000+ extra revenue

**ROI**: 20x minimum (customer pays $99, makes $2,000)

### 5.3 Usage-Based Overages

```python
# Overage pricing
OVERAGE_RATES = {
    'api_calls': 0.001,      # $1 per 1,000 calls
    'emails': 0.01,          # $1 per 100 emails
    'products': 0.10,        # $0.10 per product over limit
}

def calculate_bill(tenant_id, month):
    usage = get_usage(tenant_id, month)
    plan = get_plan(tenant_id)
    
    base_price = plan.price
    overages = 0
    
    if usage.api_calls > plan.api_limit:
        overages += (usage.api_calls - plan.api_limit) * OVERAGE_RATES['api_calls']
    
    if usage.emails > plan.email_limit:
        overages += (usage.emails - plan.email_limit) * OVERAGE_RATES['emails']
    
    total = base_price + overages
    
    return {
        'base': base_price,
        'overages': overages,
        'total': total,
        'margin': calculate_margin(total, usage)
    }
```

---

## 6. COST STRUCTURE & MARGINS

### 6.1 Cost Breakdown (per 100 tenants)

```
Infrastructure Costs:
├── Compute (Kubernetes)      $2,000/mo  ($20/tenant)
├── Database (RDS)            $1,500/mo  ($15/tenant)
├── ML GPU (shared)           $500/mo    ($5/tenant)
├── Storage (S3)              $300/mo    ($3/tenant)
├── CDN & Bandwidth           $200/mo    ($2/tenant)
└── Monitoring & Logs         $200/mo    ($2/tenant)
                              ─────────
Total Infrastructure:         $4,700/mo  ($47/tenant)

Revenue (100 tenants):
├── Starter (60 × $99)        $5,940/mo
├── Growth (30 × $299)        $8,970/mo
├── Pro (10 × $799)           $7,990/mo
└── Total Revenue:            $22,900/mo

Gross Margin:
Revenue:                      $22,900
COGS:                         -$4,700
Gross Profit:                 $18,200
Gross Margin:                 79.5%
```

### 6.2 Margin Optimization

**Target: 85% gross margin**

**Strategies**:
1. **Shared infrastructure**: One GPU serves all
2. **Efficient caching**: Redis reduces DB load 80%
3. **Lazy model training**: Train only when needed
4. **Tiered compute**: Starter gets less resources
5. **Auto-scaling**: Scale down at night

---

## 7. ONBOARDING FLOW

### 7.1 30-Minute Time-to-Value

```
Minute 0-5: Sign Up
├── Email + password
├── Store URL
├── Choose plan (14-day trial)
└── Stripe payment (trial, no charge)

Minute 5-10: Plugin Installation
├── Download WordPress plugin
├── Install & activate
├── Enter API key (auto-generated)
└── Connect WooCommerce

Minute 10-20: Data Sync
├── Sync products (automatic)
├── Sync orders (last 90 days)
├── Sync customers
└── Progress bar with ETA

Minute 20-25: AI Training
├── Train recommendation model
├── Train segmentation model
├── "Your AI is learning..." animation
└── Complete!

Minute 25-30: First Value
├── Enable cross-sell on products
├── See first recommendations
├── View revenue dashboard
└── "You're live! 🎉"
```

### 7.2 Onboarding Checklist

```python
ONBOARDING_STEPS = [
    {
        'id': 'signup',
        'title': 'Create account',
        'time': '2 min',
        'required': True
    },
    {
        'id': 'install_plugin',
        'title': 'Install WordPress plugin',
        'time': '3 min',
        'required': True,
        'help_url': '/docs/install'
    },
    {
        'id': 'connect_store',
        'title': 'Connect your store',
        'time': '2 min',
        'required': True
    },
    {
        'id': 'sync_data',
        'title': 'Sync products & orders',
        'time': '10 min',
        'required': True,
        'automated': True
    },
    {
        'id': 'train_ai',
        'title': 'Train AI models',
        'time': '5 min',
        'required': True,
        'automated': True
    },
    {
        'id': 'enable_features',
        'title': 'Enable cross-sell',
        'time': '2 min',
        'required': False
    },
    {
        'id': 'view_dashboard',
        'title': 'View your dashboard',
        'time': '1 min',
        'required': False
    }
]
```

---

## 8. FEATURE GATING

### 8.1 Implementation

```python
class FeatureGate:
    """Control feature access per plan"""
    
    FEATURES = {
        'recommendations': ['starter', 'growth', 'pro', 'enterprise'],
        'dynamic_pricing': ['growth', 'pro', 'enterprise'],
        'chatbot_basic': ['growth', 'pro', 'enterprise'],
        'chatbot_advanced': ['pro', 'enterprise'],
        'visual_search': ['pro', 'enterprise'],
        'whatsapp': ['pro', 'enterprise'],
        'ab_testing': ['pro', 'enterprise'],
        'custom_models': ['enterprise'],
        'white_label': ['enterprise'],
    }
    
    def can_access(self, tenant_id: str, feature: str) -> bool:
        tenant = get_tenant(tenant_id)
        allowed_plans = self.FEATURES.get(feature, [])
        return tenant.plan_id in allowed_plans
    
    def check_limit(self, tenant_id: str, resource: str) -> bool:
        tenant = get_tenant(tenant_id)
        usage = get_current_usage(tenant_id)
        
        limits = {
            'starter': {'products': 500, 'api_calls': 50000},
            'growth': {'products': 2000, 'api_calls': 200000},
            'pro': {'products': 10000, 'api_calls': 1000000},
        }
        
        limit = limits.get(tenant.plan_id, {}).get(resource, float('inf'))
        current = usage.get(resource, 0)
        
        return current < limit
```

### 8.2 Upgrade Prompts

```python
@app.get("/api/v1/recommendations")
async def get_recommendations(request: Request):
    tenant = request.state.tenant
    
    # Check feature access
    if not feature_gate.can_access(tenant.id, 'recommendations'):
        return {
            'error': 'Feature not available',
            'upgrade_url': f'/upgrade?feature=recommendations',
            'message': 'Upgrade to Growth plan to unlock recommendations'
        }
    
    # Check usage limits
    if not feature_gate.check_limit(tenant.id, 'api_calls'):
        return {
            'error': 'Limit exceeded',
            'current_usage': get_usage(tenant.id, 'api_calls'),
            'limit': get_limit(tenant.id, 'api_calls'),
            'upgrade_url': '/upgrade',
            'message': 'Upgrade to increase your API limit'
        }
    
    # Proceed with request
    return recommendation_engine.predict(tenant.id, ...)
```

---

## 9. SAAS ROADMAP (6-12 Months)

### Month 1-2: SaaS Foundation
- [ ] Multi-tenant database architecture
- [ ] Tenant management API
- [ ] Stripe billing integration
- [ ] Usage tracking system
- [ ] Feature gating implementation
- [ ] Admin dashboard (basic)

### Month 3-4: Client Experience
- [ ] Client dashboard
- [ ] Onboarding flow
- [ ] WordPress plugin (SaaS version)
- [ ] API key management
- [ ] Email notifications
- [ ] Help documentation

### Month 5-6: Scale & Optimize
- [ ] Auto-scaling infrastructure
- [ ] Performance optimization
- [ ] Cost monitoring
- [ ] Churn prediction
- [ ] Upgrade prompts
- [ ] Referral program

### Month 7-8: Growth Features
- [ ] White-label option (Enterprise)
- [ ] Custom domain support
- [ ] Advanced analytics
- [ ] Webhook integrations
- [ ] API marketplace
- [ ] Partner program

### Month 9-10: Enterprise Features
- [ ] SSO (SAML)
- [ ] Custom models
- [ ] Dedicated infrastructure
- [ ] SLA guarantees
- [ ] Audit logs
- [ ] Compliance (SOC 2)

### Month 11-12: Expansion
- [ ] Multi-language support
- [ ] Multi-currency billing
- [ ] Regional data centers
- [ ] Mobile app
- [ ] Shopify integration
- [ ] BigCommerce integration

---

## 10. GO-TO-MARKET STRATEGY

### 10.1 Launch Sequence

**Week 1-2: Private Beta**
- 10 hand-picked stores
- Free for 3 months
- Intensive feedback
- Case studies

**Week 3-4: Public Beta**
- 50 stores
- 50% discount
- Referral incentives
- Content marketing

**Week 5-8: General Availability**
- Full pricing
- Paid ads
- Partnerships
- PR launch

### 10.2 Customer Acquisition

**Channels**:
1. **Content Marketing**: SEO, blog, guides
2. **WordPress Plugin Directory**: Free version
3. **WooCommerce Marketplace**: Listed
4. **Paid Ads**: Google, Facebook
5. **Partnerships**: WooCommerce agencies
6. **Referrals**: 20% commission

**CAC Target**: $200
**LTV Target**: $4,000 (20x ROI)
**Payback Period**: 3 months

---

## 11. SUCCESS METRICS

### 11.1 SaaS Metrics

```
MRR (Monthly Recurring Revenue)
├── Month 3: $5,000 (50 beta customers)
├── Month 6: $15,000 (100 customers)
├── Month 9: $35,000 (200 customers)
└── Month 12: $60,000 (300 customers)

ARR: $720,000 (Year 1)

Churn Rate: <5% monthly
Gross Margin: 85%
CAC: $200
LTV: $4,000
LTV/CAC: 20x
```

### 11.2 Product Metrics

```
Activation Rate: >80% (complete onboarding)
Time to Value: <30 minutes
Feature Adoption: >60% use 3+ features
NPS Score: >50
Support Tickets: <2 per customer/month
```

---

## 12. RISK MITIGATION

### 12.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tenant data leak | Critical | Schema isolation, audit logs |
| Performance degradation | High | Auto-scaling, caching |
| Model accuracy drop | Medium | A/B testing, monitoring |
| API downtime | High | Multi-region, failover |

### 12.2 Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| High churn | Critical | Onboarding, support, value |
| Low margins | High | Cost optimization, pricing |
| Slow growth | Medium | Marketing, partnerships |
| Competition | Medium | Differentiation, speed |

---

**Next Steps**: Implement Month 1-2 foundation, launch private beta in 60 days.
