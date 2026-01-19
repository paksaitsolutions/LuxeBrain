# LuxeBrain AI - Quick Start Guide

**Copyright © 2024 Paksa IT Solutions**

---

## 🚀 Get Started in 5 Minutes

### Step 1: Clone and Setup

```bash
cd d:\LuxeBrain
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
copy .env.example .env
```

Edit `.env` and add your WooCommerce credentials:
```
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxx
```

### Step 3: Start Services

```bash
docker-compose up -d
```

### Step 4: Initialize Database

```bash
python scripts/init_db.py
```

### Step 5: Run API Server

```bash
uvicorn api.main:app --reload
```

### Step 6: Access Documentation

Open browser: http://localhost:8000/docs

---

## 📊 Dashboard Access

- **API Docs**: http://localhost:8000/docs
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **MLflow**: http://localhost:5000

---

## 🧪 Test the System

```bash
# Health check
curl http://localhost:8000/health

# Get recommendations
curl -X POST http://localhost:8000/api/v1/recommendations/ \
  -H "Content-Type: application/json" \
  -d '{"customer_id": 1, "limit": 10}'
```

---

## 📚 Next Steps

1. Read [Architecture Guide](docs/architecture.md)
2. Setup [WooCommerce Integration](docs/woocommerce_integration.md)
3. Train ML models: `python ml_models/train_all.py`
4. Configure webhooks in WooCommerce
5. Deploy to production: [Deployment Guide](docs/deployment.md)

---

## 🆘 Need Help?

- Documentation: `/docs` folder
- Support: support@paksait.com
- Issues: Contact Paksa IT Solutions

---

**Built with ❤️ by Paksa IT Solutions**
