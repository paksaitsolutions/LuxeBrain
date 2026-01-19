# LuxeBrain AI - Frontend

**Copyright © 2024 Paksa IT Solutions**

## Architecture

Next.js 14 monorepo with 3 applications:

1. **Tenant Dashboard** (port 3000) - `apps/tenant/`
2. **Admin Panel** (port 3001) - `apps/admin/`
3. **Marketing Site** (port 3002) - `apps/marketing/`

## Quick Start

```bash
cd frontend

# Install dependencies
npm install

# Run all apps
npm run dev

# Run specific app
cd apps/tenant && npm run dev
cd apps/admin && npm run dev
cd apps/marketing && npm run dev
```

## URLs

- Tenant Dashboard: http://localhost:3000
- Admin Panel: http://localhost:3001
- Marketing Site: http://localhost:3002

## Environment Variables

Create `.env.local` in each app:

```bash
# apps/tenant/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
API_URL=http://localhost:8000
JWT_SECRET=your-secret-key

# apps/admin/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
API_URL=http://localhost:8000
JWT_SECRET=your-secret-key
```

## Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

Custom domains:
- app.luxebrain.ai → Tenant Dashboard
- admin.luxebrain.ai → Admin Panel
- luxebrain.ai → Marketing Site

### Docker

```bash
docker build -t luxebrain-tenant -f apps/tenant/Dockerfile .
docker build -t luxebrain-admin -f apps/admin/Dockerfile .
docker build -t luxebrain-marketing -f apps/marketing/Dockerfile .
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- JWT authentication
- Turborepo (monorepo)

## Shared Packages

- `@luxebrain/api` - API client
- `@luxebrain/auth` - Authentication utilities
- `@luxebrain/ui` - Shared UI components
- `@luxebrain/config` - Constants and configuration

## Features

### Tenant Dashboard
- AI performance metrics
- Recommendations insights
- Marketing automation
- Billing management
- Analytics dashboard

### Admin Panel
- Tenant management
- Revenue analytics (MRR, ARR, churn)
- Usage monitoring
- Support tools

### Marketing Site
- Homepage with hero
- Pricing page
- ROI calculator
- Case studies
- Documentation

## Security

- JWT tokens in HttpOnly cookies
- CSRF protection
- Rate limiting
- Role-based access control
- Secure headers

---

**Built with ❤️ by Paksa IT Solutions**
