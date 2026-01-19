# LuxeBrain AI
**Copyright © 2024 Paksa IT Solutions**

AI-driven automation system for women's fashion eCommerce on WooCommerce.

## Quick Start

### Single Command (Windows)
```bash
start.bat
```

### Single Command (Linux/Mac)
```bash
chmod +x start.sh
./start.sh
```

### Manual Start

**Backend:**
```bash
python -m uvicorn api.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Access URLs

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Tenant App**: http://localhost:3000
- **Admin App**: http://localhost:3001
- **Marketing**: http://localhost:3002

## Prerequisites

- Python 3.10+
- Node.js 18+
- Redis 6+
- PostgreSQL 14+ (optional, SQLite for dev)

## Installation

```bash
# Backend
pip install -r requirements.txt
cp .env.example .env
python scripts/init_db.py

# Frontend
cd frontend
npm install
```

## Documentation

- [API Reference](docs/api_reference.md)
- [Architecture](docs/architecture.md)
- [Frontend Flow](docs/frontend_flow.md)
- [Deployment](docs/deployment.md)
- [Phase 3 Features](docs/phase3_features.md)
- [Phase 3 User Guide](docs/phase3_user_guide.md)

## Features

### Phase 1: Core
- Multi-tenant SaaS architecture
- JWT + OAuth authentication
- Stripe billing integration
- Rate limiting & usage tracking

### Phase 2: ML
- Product recommendations
- Customer segmentation
- Demand forecasting
- Dynamic pricing

### Phase 3: Advanced
- Batch inference system
- Model versioning & A/B testing
- Anomaly detection with email/Slack alerts
- Tenant model isolation
- Performance monitoring

## Tech Stack

**Backend**: FastAPI, TensorFlow, PostgreSQL, Redis  
**Frontend**: Next.js, TypeScript, Tailwind CSS  
**Infrastructure**: Docker, Kubernetes, AWS

## Support

- Email: support@paks.com.pk
- GitHub: https://github.com/paksaitsolutions/LuxeBrain
- Docs: https://docs.luxebrain.ai

## License

Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
