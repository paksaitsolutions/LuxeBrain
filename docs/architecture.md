# LuxeBrain AI - System Architecture
**Copyright © 2024 Paksa IT Solutions**

## Overview
LuxeBrain AI is a multi-tenant SaaS platform providing AI-driven recommendations for WooCommerce stores.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│              Frontend Layer (Next.js)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐         │
│  │ Marketing│  │  Tenant  │  │    Admin     │         │
│  │   App    │  │   App    │  │     App      │         │
│  └──────────┘  └──────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              API Gateway (FastAPI)                       │
│  • Authentication (JWT)                                  │
│  • Rate Limiting                                         │
│  • Request Routing                                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Business Logic Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │Recommendation│  │   Anomaly    │  │    Batch     │ │
│  │    Engine    │  │   Detector   │  │  Processing  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              ML Layer (TensorFlow)                       │
│  • Model Versioning                                      │
│  • A/B Testing                                           │
│  • Tenant Isolation                                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Data Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PostgreSQL  │  │    Redis     │  │   S3/MinIO   │ │
│  │  (Primary)   │  │   (Cache)    │  │   (Storage)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **ML**: TensorFlow 2.x
- **Database**: PostgreSQL 14+ / SQLite (dev)
- **Cache**: Redis 6+
- **Queue**: Celery + RabbitMQ
- **Storage**: AWS S3 / MinIO

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Hooks
- **Monorepo**: Turborepo

### Infrastructure
- **Containers**: Docker
- **Orchestration**: Kubernetes
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack
- **CI/CD**: GitHub Actions

## Database Schema

### Core Tables
- `users` - User accounts
- `tenants` - Tenant organizations
- `subscriptions` - Billing plans
- `api_keys` - API authentication

### ML Tables
- `model_versions` - Model registry
- `model_metrics` - Performance tracking
- `model_isolation_requests` - Tenant model requests

### Monitoring Tables
- `anomaly_resolutions` - Security events
- `usage_logs` - API usage tracking

## Redis Keys

### Caching
- `cache:recommendations:{customer_id}` - Recommendation cache (TTL: 1h)
- `cache:model:{model_name}` - Model metadata (TTL: 24h)

### Queues
- `batch:queue` - Pending batch jobs
- `batch:processing` - Active jobs
- `batch:failed:{job_id}` - Failed job data

### Monitoring
- `anomalies:{tenant_id}` - Tenant anomalies
- `admin:alerts` - Admin notifications
- `anomaly:api:{tenant_id}` - Rate limiting counters

## Security

### Authentication
- JWT tokens (1 hour expiry)
- Refresh tokens (30 days)
- OAuth2 (Google, GitHub)
- Magic links (email)

### Authorization
- Role-based access control (RBAC)
- Tenant isolation
- API key authentication

### Data Protection
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- PII anonymization
- GDPR compliance

## Scalability

### Horizontal Scaling
- Stateless API servers
- Load balancer (Nginx)
- Database read replicas
- Redis cluster

### Performance
- Response time: <100ms (p95)
- Throughput: 1000 req/s per instance
- Batch processing: 100 customers/s
- Model inference: <50ms

## Monitoring

### Metrics
- Request rate, latency, errors
- Model accuracy, CTR, conversion
- Queue length, processing rate
- Database connections, query time

### Alerts
- Email (SendGrid)
- Slack (Webhooks)
- PagerDuty (Critical)

## Deployment

### Environments
- **Development**: Local Docker Compose
- **Staging**: AWS ECS
- **Production**: AWS EKS (Kubernetes)

### CI/CD Pipeline
1. Code push → GitHub
2. Tests run → GitHub Actions
3. Build Docker image → ECR
4. Deploy to staging → Auto
5. Deploy to production → Manual approval

## File Structure

```
LuxeBrain/
├── api/                    # FastAPI backend
│   ├── routes/            # API endpoints
│   ├── models/            # Database models
│   ├── utils/             # Helper functions
│   └── middleware/        # Auth, rate limiting
├── ml_models/             # TensorFlow models
├── frontend/              # Next.js monorepo
│   ├── apps/
│   │   ├── admin/        # Admin dashboard
│   │   ├── tenant/       # Tenant dashboard
│   │   └── marketing/    # Landing page
│   └── packages/
│       ├── ui/           # Shared components
│       └── auth/         # Auth utilities
├── config/                # Configuration
├── docs/                  # Documentation
└── deployment/            # Docker, K8s configs
```
