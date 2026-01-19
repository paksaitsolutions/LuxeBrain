# LuxeBrain AI - Complete Documentation
**Copyright © 2024 Paksa IT Solutions**

## Quick Links
- [Installation](#installation)
- [API Reference](api_reference.md)
- [Architecture](architecture.md)
- [Deployment](deployment.md)
- [WooCommerce Integration](woocommerce_integration.md)
- [Environment Variables](environment_variables.md)

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ / SQLite
- Redis 6+
- Docker (optional)

### Backend Setup
```bash
cd LuxeBrain
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python scripts/init_db.py
uvicorn api.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Access:
- Admin: http://localhost:3001
- Tenant: http://localhost:3000
- Marketing: http://localhost:3002
- API: http://localhost:8000

## Features

### Phase 1: Core Features
- ✅ User authentication (JWT, OAuth, Magic Links)
- ✅ Multi-tenant architecture
- ✅ Subscription management (Stripe)
- ✅ API rate limiting
- ✅ Usage tracking

### Phase 2: ML Features
- ✅ Product recommendations
- ✅ Customer segmentation
- ✅ Demand forecasting
- ✅ Dynamic pricing

### Phase 3: Advanced Features
- ✅ Batch inference system
- ✅ Model versioning & A/B testing
- ✅ Anomaly detection & alerts
- ✅ Tenant model isolation
- ✅ Performance monitoring

## API Endpoints

### Authentication
```bash
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/register
GET  /api/auth/oauth/{provider}
POST /api/auth/magic-link
```

### Recommendations
```bash
GET  /api/v1/recommendations
POST /api/v1/recommendations/batch
GET  /api/v1/recommendations/batch/{job_id}
```

### Model Management (Admin)
```bash
GET  /api/admin/models/list/{model_name}
POST /api/admin/models/register
POST /api/admin/models/activate
POST /api/admin/models/ab-test
POST /api/admin/models/rollback
GET  /api/admin/models/performance
GET  /api/admin/models/metrics-history/{model_name}
```

### Tenant Isolation
```bash
POST /api/admin/models/request-isolation
GET  /api/admin/models/isolation-status/{tenant_id}
GET  /api/admin/models/isolation-requests
PUT  /api/admin/models/isolation-requests/{id}
POST /api/admin/models/create-tenant-model
GET  /api/admin/models/tenants
```

### Anomaly Detection
```bash
GET  /api/admin/alerts
GET  /api/admin/anomalies/{tenant_id}
POST /api/admin/anomalies/resolve
GET  /api/admin/anomalies/count
```

### Batch Monitoring
```bash
GET  /api/admin/batch/stats
POST /api/admin/batch/retry/{job_id}
```

See [API Reference](api_reference.md) for complete documentation.

## Environment Variables

Required variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/luxebrain
REDIS_URL=redis://localhost:6379/0

# Security
JWT_SECRET_KEY=your-secret-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Alerts
EMAIL_API_KEY=your_sendgrid_api_key
ADMIN_EMAIL=admin@luxebrain.ai

# Slack Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# WooCommerce
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...
```

See [Environment Variables](environment_variables.md) for complete list.

## Database Tables

### Core (21 tables)
- users, tenants, subscriptions, api_keys
- usage_logs, rate_limits, feature_flags
- model_versions, model_metrics, model_isolation_requests
- anomaly_resolutions, audit_logs

### Migrations
```bash
# Create migration
alembic revision -m "description"

# Run migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Testing

```bash
# Backend tests
pytest
pytest --cov=. --cov-report=html

# Frontend tests
cd frontend
npm test
npm run test:coverage
```

## Deployment

### Docker Compose (Development)
```bash
docker-compose up -d
```

### Kubernetes (Production)
```bash
kubectl apply -f deployment/k8s/
kubectl scale deployment luxebrain-api --replicas=3
```

See [Deployment Guide](deployment.md) for details.

## Monitoring

### Dashboards
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- MLflow: http://localhost:5000

### Logs
```bash
tail -f logs/api.log
tail -f logs/anomalies.log
```

## Troubleshooting

### API not starting
```bash
# Check database connection
psql -U postgres -d luxebrain

# Check Redis
redis-cli ping

# Check logs
tail -f logs/api.log
```

### Frontend build errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Model not loading
```bash
# Check model files
ls -la models/recommendation/

# Verify permissions
chmod 644 models/recommendation/*.h5
```

## Performance Benchmarks

- API response time: <100ms (p95)
- Batch processing: 100 customers/second
- Model inference: <50ms
- Database queries: <10ms (indexed)

## Security

- JWT authentication with 1-hour expiry
- Rate limiting: 1000 req/hour (Starter plan)
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- GDPR compliant

## Support

- Email: support@paks.com.pk
- Documentation: https://docs.luxebrain.ai
- GitHub: https://github.com/paksaitsolutions/LuxeBrain
- Response time: <24 hours

## License

Copyright © 2024 Paksa IT Solutions. All Rights Reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
