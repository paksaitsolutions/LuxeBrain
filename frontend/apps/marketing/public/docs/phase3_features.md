# Phase 3 Features Documentation
**Copyright © 2024 Paksa IT Solutions**

## Overview
Phase 3 introduces advanced ML operations, monitoring, and enterprise features to LuxeBrain AI.

## Features

### 1. Batch Inference System
Process recommendations for multiple customers asynchronously.

**Use Cases:**
- Email campaigns (send personalized recommendations to 1000+ customers)
- Scheduled reports (daily product suggestions)
- Bulk operations (catalog updates)

**API Endpoint:**
```bash
POST /api/v1/recommendations/batch
Content-Type: application/json

{
  "customer_ids": [1, 2, 3, 4, 5]
}

Response:
{
  "job_id": "batch_abc123",
  "status": "pending",
  "total_customers": 5
}
```

**Check Status:**
```bash
GET /api/v1/recommendations/batch/{job_id}

Response:
{
  "job_id": "batch_abc123",
  "status": "completed",
  "processed": 5,
  "failed": 0,
  "results": [...]
}
```

**Admin Monitoring:**
- Queue length: Jobs waiting to process
- Processing: Currently running jobs
- Failed jobs: Errors with retry option
- Processing rate: Jobs/minute

### 2. Model Versioning & A/B Testing
Manage multiple model versions and test performance.

**Register Version:**
```bash
POST /api/admin/models/register
{
  "model_name": "recommendation",
  "version": "v2.1.0",
  "model_path": "/models/recommendation_v2.1.0.h5"
}
```

**Activate Version:**
```bash
POST /api/admin/models/activate
{
  "model_name": "recommendation",
  "version": "v2.1.0",
  "ab_percentage": 100
}
```

**Setup A/B Test:**
```bash
POST /api/admin/models/ab-test
{
  "model_name": "recommendation",
  "version_a": "v2.0.0",
  "version_b": "v2.1.0",
  "split": 50
}
```

**Rollback:**
```bash
POST /api/admin/models/rollback?model_name=recommendation&version=v2.0.0
```

**Performance Metrics:**
- Click-through rate (CTR)
- Conversion rate
- Model accuracy
- Total recommendations

### 3. Anomaly Detection & Alerts
Real-time security monitoring with email and Slack alerts.

**Anomaly Types:**
- **High API Rate**: >100 calls/minute
- **Failed Auth**: 5+ failed login attempts
- **Large Order**: Orders >$10,000
- **Rapid Orders**: >10 orders in 5 minutes
- **Unusual Time**: Activity between 2-6 AM

**Severity Levels:**
- **High**: Immediate action required (triggers email + Slack)
- **Medium**: Review soon
- **Low**: Monitor only

**Get Alerts:**
```bash
GET /api/admin/alerts

Response:
{
  "alerts": [
    {
      "type": "security_anomaly",
      "data": {
        "type": "failed_auth",
        "tenant_id": "tenant_123",
        "severity": "high",
        "count": 5
      },
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

**Resolve Anomaly:**
```bash
POST /api/admin/anomalies/resolve
{
  "anomaly_id": "tenant_123-0",
  "status": "resolved",
  "notes": "False positive - legitimate traffic spike"
}
```

**Email Alerts:**
- Uses SendGrid API
- Sent to ADMIN_EMAIL from .env
- Includes full anomaly details

**Slack Alerts:**
- Uses webhook URL from .env
- Rich formatting with blocks
- Shows severity, tenant, timestamp

### 4. Tenant Model Isolation
Create dedicated models for enterprise customers.

**Create Tenant Model:**
```bash
POST /api/admin/models/create-tenant-model
{
  "tenant_id": "enterprise_customer_1",
  "base_model": "recommendation"
}
```

**Request Isolation (Tenant UI):**
```bash
POST /api/admin/models/request-isolation
{
  "tenant_id": "current_tenant",
  "model_name": "recommendation",
  "reason": "Need custom training on our product catalog"
}
```

**Check Status:**
```bash
GET /api/admin/models/isolation-status/{tenant_id}

Response:
{
  "status": "approved",
  "model_name": "recommendation",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Storage:**
- Base models: `models/{model_name}/`
- Tenant models: `models/tenant_models/{model_name}/{tenant_id}/`

### 5. Performance Monitoring
Track model performance across all tenants.

**Get Performance:**
```bash
GET /api/admin/models/performance

Response:
{
  "ctr": 8.5,
  "conversion_rate": 3.2,
  "accuracy": 92.0,
  "total_recommendations": 15000
}
```

**Metrics History:**
```bash
GET /api/admin/models/metrics-history/recommendation?days=7

Response:
[
  {"date": "2024-01-15", "accuracy": 92, "precision": 88, "recall": 85, "f1": 86},
  {"date": "2024-01-14", "accuracy": 91, "precision": 87, "recall": 84, "f1": 85}
]
```

## Environment Variables

Add to `.env`:
```bash
# Email Alerts
EMAIL_API_KEY=your_sendgrid_api_key
ADMIN_EMAIL=admin@luxebrain.ai

# Slack Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## UI Components

### Admin Dashboard
- **Models Page**: Version management, A/B testing, performance charts
- **Anomalies Page**: Security alerts with resolve/ignore actions
- **Monitoring Page**: Batch queue statistics, failed jobs, retry
- **Isolation Requests**: Approve/reject tenant model requests

### Tenant Dashboard
- **Performance Widget**: CTR, conversion rate, accuracy, total recommendations
- **Request Isolated Model**: Enterprise feature for custom models
- **Batch Inference Widget**: Submit bulk recommendation requests

## Database Tables

### ModelVersion
```sql
CREATE TABLE model_versions (
    id INTEGER PRIMARY KEY,
    model_name VARCHAR(100),
    version VARCHAR(50),
    is_active BOOLEAN,
    ab_test_percentage INTEGER,
    performance_score FLOAT,
    created_at TIMESTAMP,
    deployed_at TIMESTAMP
);
```

### ModelIsolationRequest
```sql
CREATE TABLE model_isolation_requests (
    id INTEGER PRIMARY KEY,
    tenant_id VARCHAR(100),
    model_name VARCHAR(100),
    status VARCHAR(20),
    reason TEXT,
    created_at TIMESTAMP,
    approved_at TIMESTAMP
);
```

### AnomalyResolution
```sql
CREATE TABLE anomaly_resolutions (
    id INTEGER PRIMARY KEY,
    anomaly_id VARCHAR(100),
    status VARCHAR(20),
    notes TEXT,
    resolved_at TIMESTAMP
);
```

## Redis Keys

### Batch Queue
- `batch:queue` - Pending jobs (list)
- `batch:processing` - Currently processing (set)
- `batch:failed:{job_id}` - Failed job data (hash)
- `batch:completed:count` - Completed jobs counter

### Anomalies
- `anomalies:{tenant_id}` - Tenant anomalies (list)
- `admin:alerts` - Admin alerts (list)
- `anomaly:api:{tenant_id}` - API rate counter (expires 60s)
- `anomaly:auth:{tenant_id}` - Failed auth counter (expires 300s)

## Best Practices

### Batch Inference
- Limit batch size to 1000 customers per job
- Use for off-peak hours (email campaigns)
- Monitor failed jobs and retry with exponential backoff

### Model Versioning
- Always test new versions with A/B testing (50/50 split)
- Monitor for 7 days before full rollout
- Keep previous version for quick rollback

### Anomaly Detection
- Review high severity alerts within 1 hour
- Set up email and Slack for 24/7 monitoring
- Document false positives to improve detection

### Tenant Isolation
- Only for Enterprise plan customers
- Requires minimum 10,000 orders for training
- Monthly retraining recommended

## Troubleshooting

### Batch Jobs Stuck
```bash
# Check Redis queue
redis-cli LLEN batch:queue

# Clear stuck jobs
redis-cli DEL batch:processing
```

### Model Not Loading
```bash
# Check model file exists
ls -la models/recommendation/

# Verify permissions
chmod 644 models/recommendation/*.h5
```

### Anomaly Alerts Not Sending
```bash
# Test email
curl -X POST http://localhost:8000/api/internal/test-email

# Check Slack webhook
curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"Test"}'
```

## Performance Benchmarks

- Batch inference: 100 customers/second
- Model loading: <2 seconds
- Anomaly detection: <10ms overhead
- A/B test routing: <1ms overhead

## Security

- All admin endpoints require authentication
- Tenant isolation prevents cross-tenant data access
- Anomaly detection logs all security events
- Failed jobs don't expose sensitive data

## Support

For issues or questions:
- Email: support@paks.com.pk
- Documentation: https://docs.luxebrain.ai
- GitHub Issues: Internal only
