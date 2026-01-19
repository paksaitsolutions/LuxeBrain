# Deployment Guide

**Copyright © 2024 Paksa IT Solutions**

---

## 1. LOCAL DEVELOPMENT SETUP

### Prerequisites
- Python 3.10+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 6+

### Installation Steps

```bash
# Clone repository
git clone <repository-url>
cd LuxeBrain

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env
# Edit .env with your credentials

# Start infrastructure services
docker-compose up -d

# Initialize database
python scripts/init_db.py

# Run API server
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Verify Installation

```bash
# Check API health
curl http://localhost:8000/health

# Check API docs
# Open browser: http://localhost:8000/docs
```

---

## 2. PRODUCTION DEPLOYMENT (AWS)

### 2.1 Infrastructure Setup

**Required AWS Services**:
- ECS/EKS for container orchestration
- RDS PostgreSQL (db.t3.medium or higher)
- ElastiCache Redis (cache.t3.medium)
- S3 for image storage
- ALB for load balancing
- CloudWatch for logging
- Secrets Manager for credentials

### 2.2 Database Setup

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier luxebrain-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username admin \
  --master-user-password <password> \
  --allocated-storage 100 \
  --vpc-security-group-ids sg-xxxxx

# Run migrations
export DATABASE_URL="postgresql://admin:<password>@luxebrain-db.xxxxx.rds.amazonaws.com:5432/luxebrain"
python scripts/init_db.py
```

### 2.3 Docker Build & Push

```bash
# Build Docker image
docker build -t luxebrain/api:latest .

# Tag for ECR
docker tag luxebrain/api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/luxebrain:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/luxebrain:latest
```

### 2.4 Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace luxebrain

# Create secrets
kubectl create secret generic luxebrain-secrets \
  --from-literal=database-url=$DATABASE_URL \
  --from-literal=redis-url=$REDIS_URL \
  --from-literal=jwt-secret=$JWT_SECRET_KEY \
  -n luxebrain

# Deploy application
kubectl apply -f deployment/k8s/deployment.yaml -n luxebrain

# Check deployment status
kubectl get pods -n luxebrain
kubectl get services -n luxebrain

# Get external IP
kubectl get service luxebrain-api-service -n luxebrain
```

### 2.5 Configure Auto-Scaling

```bash
# Apply HPA
kubectl apply -f deployment/k8s/deployment.yaml -n luxebrain

# Verify HPA
kubectl get hpa -n luxebrain
```

---

## 3. MONITORING SETUP

### 3.1 Prometheus

```bash
# Deploy Prometheus
kubectl apply -f deployment/k8s/prometheus.yaml -n luxebrain

# Access Prometheus UI
kubectl port-forward svc/prometheus 9090:9090 -n luxebrain
# Open: http://localhost:9090
```

### 3.2 Grafana

```bash
# Deploy Grafana
kubectl apply -f deployment/k8s/grafana.yaml -n luxebrain

# Get admin password
kubectl get secret grafana-admin -n luxebrain -o jsonpath="{.data.password}" | base64 --decode

# Access Grafana
kubectl port-forward svc/grafana 3000:3000 -n luxebrain
# Open: http://localhost:3000
```

### 3.3 MLflow

```bash
# Deploy MLflow
kubectl apply -f deployment/k8s/mlflow.yaml -n luxebrain

# Access MLflow UI
kubectl port-forward svc/mlflow 5000:5000 -n luxebrain
# Open: http://localhost:5000
```

---

## 4. SSL/TLS CONFIGURATION

### Using Let's Encrypt with Cert-Manager

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Create Ingress with TLS
kubectl apply -f deployment/k8s/ingress.yaml -n luxebrain
```

---

## 5. BACKUP & DISASTER RECOVERY

### Database Backups

```bash
# Automated daily backups (RDS)
aws rds modify-db-instance \
  --db-instance-identifier luxebrain-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"

# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier luxebrain-db \
  --db-snapshot-identifier luxebrain-backup-$(date +%Y%m%d)
```

### Model Backups

```bash
# Sync models to S3
aws s3 sync models/trained/ s3://luxebrain-models/trained/ --delete
```

---

## 6. CI/CD PIPELINE

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to ECR
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
      
      - name: Build and push Docker image
        run: |
          docker build -t luxebrain/api:${{ github.sha }} .
          docker tag luxebrain/api:${{ github.sha }} ${{ secrets.ECR_REGISTRY }}/luxebrain:latest
          docker push ${{ secrets.ECR_REGISTRY }}/luxebrain:latest
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/luxebrain-api api=${{ secrets.ECR_REGISTRY }}/luxebrain:latest -n luxebrain
          kubectl rollout status deployment/luxebrain-api -n luxebrain
```

---

## 7. PERFORMANCE OPTIMIZATION

### Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_user_interactions_timestamp ON user_interactions(timestamp);

-- Analyze tables
ANALYZE customers;
ANALYZE products;
ANALYZE orders;
```

### Redis Caching Strategy

```python
# Cache recommendations for 1 hour
CACHE_TTL = 3600

# Cache keys
rec_key = f"rec:{customer_id}:personalized"
segment_key = f"segment:{customer_id}"
```

---

## 8. SECURITY HARDENING

### Network Security

```bash
# Configure security groups
# Allow only necessary ports:
# - 443 (HTTPS)
# - 5432 (PostgreSQL - from app only)
# - 6379 (Redis - from app only)

# Enable VPC flow logs
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids vpc-xxxxx \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs
```

### Application Security

```python
# Enable CORS properly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific domain
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# Rate limiting
RATE_LIMIT_PER_MINUTE = 60
```

---

## 9. TROUBLESHOOTING

### Common Issues

**Issue**: Pods not starting
```bash
kubectl describe pod <pod-name> -n luxebrain
kubectl logs <pod-name> -n luxebrain
```

**Issue**: Database connection failed
```bash
# Check connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- psql -h <db-host> -U admin -d luxebrain
```

**Issue**: High memory usage
```bash
# Check resource usage
kubectl top pods -n luxebrain
kubectl top nodes
```

---

## 10. ROLLBACK PROCEDURE

```bash
# View deployment history
kubectl rollout history deployment/luxebrain-api -n luxebrain

# Rollback to previous version
kubectl rollout undo deployment/luxebrain-api -n luxebrain

# Rollback to specific revision
kubectl rollout undo deployment/luxebrain-api --to-revision=2 -n luxebrain
```

---

## 11. MAINTENANCE WINDOWS

**Weekly**:
- Model retraining (Sunday 2 AM)
- Database optimization (Sunday 3 AM)

**Monthly**:
- Security patches
- Dependency updates
- Performance review

---

**For support, contact: support@paksait.com**
