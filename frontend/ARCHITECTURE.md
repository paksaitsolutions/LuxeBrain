# LuxeBrain AI - Frontend Architecture

**Copyright © 2024 Paksa IT Solutions**

## Overview

Production-ready Next.js 14 monorepo with 3 standalone applications serving different user personas.

## Applications

### 1. Tenant Dashboard (`apps/tenant/`)
**Audience:** Store owners using LuxeBrain AI  
**Port:** 3000  
**Domain:** app.luxebrain.ai

**Features:**
- JWT authentication (login/signup)
- AI performance dashboard
- Revenue metrics (AI-driven revenue, conversion lift, AOV increase)
- Recommendations insights
- Marketing automation configuration
- Campaign management
- Analytics & reporting
- Billing & subscription management
- Settings & integrations

**Key Pages:**
- `/login` - Authentication
- `/signup` - New tenant registration
- `/overview` - Main dashboard with metrics
- `/recommendations` - Product recommendation insights
- `/automation` - Campaign configuration
- `/analytics` - Detailed reports
- `/settings` - Account settings
- `/billing` - Subscription & usage

### 2. Admin Panel (`apps/admin/`)
**Audience:** Paksa IT internal team  
**Port:** 3001  
**Domain:** admin.luxebrain.ai

**Features:**
- Admin-only authentication
- Tenant management (view, upgrade, suspend)
- Revenue analytics (MRR, ARR, churn rate, LTV)
- Usage monitoring across all tenants
- Support ticket management
- Feature toggles & kill switches
- System health monitoring

**Key Pages:**
- `/login` - Admin authentication
- `/tenants` - Tenant management table
- `/revenue` - Revenue dashboard
- `/usage` - System usage metrics
- `/support` - Support tools

### 3. Marketing Site (`apps/marketing/`)
**Audience:** Prospective customers  
**Port:** 3002  
**Domain:** luxebrain.ai

**Features:**
- Public-facing marketing pages
- SEO-optimized content
- Lead generation
- Product information
- Pricing comparison
- Interactive ROI calculator
- Case studies & testimonials
- Documentation

**Key Pages:**
- `/` - Homepage with hero & features
- `/pricing` - Pricing tiers & comparison
- `/roi-calculator` - Interactive calculator
- `/case-studies` - Success stories
- `/docs` - Documentation
- `/blog` - Content marketing (future)

## Shared Packages

### `@luxebrain/api`
API client for FastAPI backend communication.

**Files:**
- `client.ts` - Main API client class
- `types.ts` - TypeScript interfaces

**Usage:**
```typescript
import { createApiClient } from '@luxebrain/api/client';
const api = createApiClient('http://localhost:8000');
await api.getRecommendations(customerId, 10);
```

### `@luxebrain/auth`
Authentication utilities and middleware.

**Files:**
- `jwt.ts` - JWT token creation/verification
- `middleware.ts` - Next.js middleware for protected routes

**Usage:**
```typescript
import { authMiddleware } from '@luxebrain/auth/middleware';
export { authMiddleware as middleware };
```

### `@luxebrain/ui`
Shared React components.

**Components:**
- `Button` - Primary/secondary/danger variants
- `Card` - Container component

**Usage:**
```typescript
import { Button, Card } from '@luxebrain/ui';
```

### `@luxebrain/config`
Constants and configuration.

**Files:**
- `constants.ts` - API URLs, plans, routes

## Authentication Flow

### Tenant Login
1. User enters credentials on `/login`
2. Frontend calls `/api/auth/login` (Next.js API route)
3. Next.js proxies to FastAPI `/api/v1/auth/login`
4. FastAPI validates credentials, returns user data
5. Next.js creates JWT token with tenant_id, user_id, role
6. Token stored in HttpOnly cookie
7. Redirect to `/overview`

### Protected Routes
1. Middleware intercepts request
2. Reads `auth_token` cookie
3. Verifies JWT signature
4. Extracts tenant_id and role
5. Injects headers: `x-tenant-id`, `x-user-role`
6. Allows request or redirects to `/login`

### Role-Based Access
- Tenant routes: Any authenticated user
- Admin routes: Only `role === 'admin'` or `role === 'super_admin'`

## State Management

**Zustand** for client-side state:

```typescript
// apps/tenant/lib/store.ts
const useTenantStore = create((set) => ({
  tenantId: null,
  user: null,
  subscription: null,
  setTenant: (id) => set({ tenantId: id }),
}));
```

**Server Components** for data fetching (default in Next.js 14).

## API Integration Pattern

### Backend-for-Frontend (BFF)
Next.js API routes proxy to FastAPI:

```
Client → Next.js API Route → FastAPI Backend
```

**Benefits:**
- Hide backend URL from client
- Add authentication layer
- Transform responses
- Rate limiting

### Example
```typescript
// apps/tenant/app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  
  const response = await fetch(`${process.env.API_URL}/api/v1/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  const token = await createToken(data);
  
  const res = NextResponse.json({ success: true });
  res.cookies.set('auth_token', token, { httpOnly: true });
  return res;
}
```

## Routing Strategy

### App Router (Next.js 14)
- File-based routing
- Route groups for layouts: `(auth)`, `(dashboard)`, `(admin)`
- Nested layouts for shared UI

### Example Structure
```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── layout.tsx          # Auth layout (no sidebar)
├── (dashboard)/
│   ├── overview/page.tsx
│   ├── billing/page.tsx
│   └── layout.tsx          # Dashboard layout (with sidebar)
└── layout.tsx              # Root layout
```

## Styling

**Tailwind CSS** for utility-first styling.

**Configuration:**
- Shared config in each app
- Custom theme extensions
- Responsive design utilities

**Example:**
```tsx
<div className="bg-white p-6 rounded-lg shadow-lg">
  <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
</div>
```

## Security

### 1. JWT Tokens
- HttpOnly cookies (XSS protection)
- Secure flag in production
- SameSite=Strict (CSRF protection)
- 15-minute expiration
- Refresh token pattern (future)

### 2. Environment Variables
- Never expose secrets client-side
- Use `NEXT_PUBLIC_` prefix only for public vars
- Separate `.env.local` per environment

### 3. Headers
```typescript
// next.config.js
headers: [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
]
```

### 4. Rate Limiting
Implemented in middleware (future enhancement).

## Performance

### Server Components
- Default in Next.js 14
- Fetch data on server
- Reduce client bundle size

### Code Splitting
- Automatic route-based splitting
- Dynamic imports for heavy components

### Caching
- Next.js automatic caching
- Revalidation strategies
- CDN caching for static assets

## Deployment

### Vercel (Recommended)
- Zero-config deployment
- Automatic HTTPS
- Edge functions
- Analytics included
- $0 for hobby, $20/mo for pro

### VPS (Hostinger)
- PM2 for process management
- Nginx reverse proxy
- Let's Encrypt SSL
- $12-24/month

### Docker
- Multi-stage builds
- Optimized images
- Container orchestration

## Monitoring

### Vercel Analytics
- Page views
- Performance metrics
- Error tracking

### Custom Monitoring
- Sentry for error tracking
- PostHog for product analytics
- LogRocket for session replay

## Future Enhancements

### Phase 1 (Weeks 1-2)
- ✅ Basic authentication
- ✅ Dashboard layouts
- ✅ Core pages

### Phase 2 (Weeks 3-4)
- [ ] Real API integration
- [ ] Charts & visualizations
- [ ] Form validation
- [ ] Loading states
- [ ] Error boundaries

### Phase 3 (Weeks 5-6)
- [ ] Real-time updates (WebSocket)
- [ ] Advanced analytics
- [ ] A/B testing UI
- [ ] Notification system

### Phase 4 (Weeks 7-8)
- [ ] Mobile responsiveness
- [ ] Dark mode
- [ ] Internationalization (i18n)
- [ ] Accessibility (WCAG 2.1)

### Phase 5 (Production)
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Security audit
- [ ] Load testing
- [ ] Production deployment

## Development Workflow

### Local Development
```bash
cd frontend
npm install
npm run dev
```

### Testing
```bash
npm run lint
npm run type-check
npm run test  # (future)
```

### Building
```bash
npm run build
```

### Deployment
```bash
vercel --prod
```

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Auth | JWT + HttpOnly cookies |
| API | Fetch API |
| Monorepo | Turborepo |
| Deployment | Vercel / VPS |
| Monitoring | Vercel Analytics |

---

**Built with ❤️ by Paksa IT Solutions**
