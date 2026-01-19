# LuxeBrain AI - API Reference
**Copyright © 2024 Paksa IT Solutions**

Base URL: `http://localhost:8000`

## Authentication

All API requests require authentication via JWT token or session cookie.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "tenant"
  }
}
```

### Logout
```http
POST /api/auth/logout

Response: 200 OK
{"message": "Logged out"}
```

---

## Recommendations

### Get Recommendations
```http
GET /api/v1/recommendations?customer_id=123&limit=5

Response: 200 OK
{
  "customer_id": 123,
  "recommendations": [
    {"product_id": 456, "score": 0.95, "reason": "Similar to past purchases"},
    {"product_id": 789, "score": 0.87, "reason": "Trending in your category"}
  ]
}
```

### Batch Recommendations
```http
POST /api/v1/recommendations/batch
Content-Type: application/json

{
  "customer_ids": [1, 2, 3, 4, 5]
}

Response: 202 Accepted
{
  "job_id": "batch_abc123",
  "status": "pending",
  "total_customers": 5
}
```

### Check Batch Status
```http
GET /api/v1/recommendations/batch/{job_id}

Response: 200 OK
{
  "job_id": "batch_abc123",
  "status": "completed",
  "processed": 5,
  "failed": 0,
  "results": [...]
}
```

---

## Model Management (Admin)

### List Model Versions
```http
GET /api/admin/models/list/{model_name}

Response: 200 OK
{
  "model_name": "recommendation",
  "versions": [
    {
      "version": "v2.1.0",
      "is_active": true,
      "ab_test_percentage": 100,
      "performance_score": 0.92,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Register Model Version
```http
POST /api/admin/models/register
Content-Type: application/json

{
  "model_name": "recommendation",
  "version": "v2.1.0",
  "model_path": "/models/recommendation_v2.1.0.h5"
}

Response: 201 Created
{"message": "Model registered", "version": "v2.1.0"}
```

### Activate Model Version
```http
POST /api/admin/models/activate
Content-Type: application/json

{
  "model_name": "recommendation",
  "version": "v2.1.0",
  "ab_percentage": 100
}

Response: 200 OK
{"message": "Model activated"}
```

### Setup A/B Test
```http
POST /api/admin/models/ab-test
Content-Type: application/json

{
  "model_name": "recommendation",
  "version_a": "v2.0.0",
  "version_b": "v2.1.0",
  "split": 50
}

Response: 200 OK
{"message": "A/B test started"}
```

### Rollback Model
```http
POST /api/admin/models/rollback?model_name=recommendation&version=v2.0.0

Response: 200 OK
{"message": "Rolled back to v2.0.0"}
```

### Get Performance Metrics
```http
GET /api/admin/models/performance

Response: 200 OK
{
  "ctr": 8.5,
  "conversion_rate": 3.2,
  "accuracy": 92.0,
  "total_recommendations": 15000
}
```

### Get Metrics History
```http
GET /api/admin/models/metrics-history/{model_name}?days=7

Response: 200 OK
[
  {"date": "2024-01-15", "accuracy": 92, "precision": 88, "recall": 85, "f1": 86},
  {"date": "2024-01-14", "accuracy": 91, "precision": 87, "recall": 84, "f1": 85}
]
```

---

## Tenant Model Isolation

### Request Isolation (Tenant)
```http
POST /api/admin/models/request-isolation
Content-Type: application/json

{
  "tenant_id": "current_tenant",
  "model_name": "recommendation",
  "reason": "Need custom training"
}

Response: 201 Created
{"message": "Request submitted", "request_id": 1}
```

### Check Isolation Status
```http
GET /api/admin/models/isolation-status/{tenant_id}

Response: 200 OK
{
  "status": "approved",
  "model_name": "recommendation",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Get Isolation Requests (Admin)
```http
GET /api/admin/models/isolation-requests

Response: 200 OK
{
  "requests": [
    {
      "id": 1,
      "tenant_id": "tenant_123",
      "model_name": "recommendation",
      "status": "pending",
      "reason": "Custom training needed"
    }
  ]
}
```

### Approve/Reject Request (Admin)
```http
PUT /api/admin/models/isolation-requests/{request_id}
Content-Type: application/json

{
  "status": "approved"
}

Response: 200 OK
{"message": "Request approved"}
```

### Create Tenant Model (Admin)
```http
POST /api/admin/models/create-tenant-model
Content-Type: application/json

{
  "tenant_id": "enterprise_customer_1",
  "base_model": "recommendation"
}

Response: 201 Created
{"message": "Tenant model created"}
```

### Get Tenants List (Admin)
```http
GET /api/admin/models/tenants

Response: 200 OK
["tenant_123", "tenant_456", "tenant_789"]
```

---

## Anomaly Detection

### Get Admin Alerts
```http
GET /api/admin/alerts

Response: 200 OK
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

### Get Tenant Anomalies
```http
GET /api/admin/anomalies/{tenant_id}

Response: 200 OK
{
  "tenant_id": "tenant_123",
  "anomalies": [...]
}
```

### Resolve Anomaly
```http
POST /api/admin/anomalies/resolve
Content-Type: application/json

{
  "anomaly_id": "tenant_123-0",
  "status": "resolved",
  "notes": "False positive"
}

Response: 200 OK
{"status": "resolved", "anomaly_id": "tenant_123-0"}
```

### Get Anomaly Count
```http
GET /api/admin/anomalies/count

Response: 200 OK
{"count": 3}
```

---

## Batch Queue Monitoring

### Get Batch Statistics
```http
GET /api/admin/batch/stats

Response: 200 OK
{
  "queue_length": 10,
  "processing": 2,
  "failed_count": 1,
  "failed_jobs": [
    {"job_id": "batch_xyz", "error": "Timeout"}
  ],
  "completed_last_hour": 50,
  "processing_rate": 25
}
```

### Retry Failed Job
```http
POST /api/admin/batch/retry/{job_id}

Response: 200 OK
{"message": "Job requeued", "job_id": "batch_xyz"}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async operation) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

---

## Rate Limits

- **Free Plan**: 100 requests/hour
- **Starter Plan**: 1,000 requests/hour
- **Growth Plan**: 10,000 requests/hour
- **Pro Plan**: 50,000 requests/hour
- **Enterprise Plan**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642262400
```

---

## Webhooks

Configure webhooks in admin panel to receive real-time notifications.

### Events
- `recommendation.generated` - New recommendation created
- `model.deployed` - Model version activated
- `anomaly.detected` - Security anomaly detected
- `batch.completed` - Batch job finished

### Payload Example
```json
{
  "event": "anomaly.detected",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "type": "high_api_rate",
    "tenant_id": "tenant_123",
    "severity": "high"
  }
}
```

---

## SDKs

### Python
```python
from luxebrain import LuxeBrainClient

client = LuxeBrainClient(api_key="your_api_key")
recommendations = client.get_recommendations(customer_id=123, limit=5)
```

### JavaScript
```javascript
import LuxeBrain from '@luxebrain/sdk';

const client = new LuxeBrain({ apiKey: 'your_api_key' });
const recommendations = await client.getRecommendations({ customerId: 123, limit: 5 });
```

### PHP (WordPress Plugin)
```php
$luxebrain = new LuxeBrain_API('your_api_key');
$recommendations = $luxebrain->get_recommendations(123, 5);
```

---

## Support

- Email: support@paks.com.pk
- Documentation: https://docs.luxebrain.ai
- Status Page: https://status.luxebrain.ai
