# LuxeBrain AI - Frontend Flow
**Copyright © 2024 Paksa IT Solutions**

## Architecture

```
Frontend (Next.js Monorepo)
├── apps/
│   ├── marketing/     # Port 3002 - Landing page
│   ├── tenant/        # Port 3000 - Tenant dashboard
│   └── admin/         # Port 3001 - Admin panel
└── packages/
    ├── ui/            # Shared components
    ├── auth/          # Auth utilities
    ├── api/           # API client
    └── config/        # Shared config
```

## User Flows

### 1. Marketing Site (Port 3002)
**URL**: http://localhost:3002

**Pages**:
- `/` - Landing page with features, pricing, testimonials
- `/pricing` - Pricing plans comparison
- `/features` - Feature details
- `/about` - Company info
- `/contact` - Contact form

**Flow**:
```
Visitor → Landing Page → View Pricing → Sign Up → Redirect to Tenant App
```

**Key Features**:
- Hero section with CTA
- Feature showcase
- Pricing cards (Free, Starter, Growth, Pro, Enterprise)
- Social proof (92% model accuracy stat)
- Footer with links

---

### 2. Tenant Dashboard (Port 3000)
**URL**: http://localhost:3000

**Authentication Flow**:
```
Login Page → Enter Email/Password → API Auth → Dashboard
     ↓
Magic Link → Email → Click Link → Auto Login → Dashboard
     ↓
OAuth → Google/GitHub → Callback → Dashboard
```

**Pages**:

#### `/login`
- Email/password form
- Magic link option
- OAuth buttons (Google, GitHub)
- "Forgot password" link

#### `/register`
- Sign up form
- Plan selection
- Email verification

#### `/dashboard` (Protected)
- Overview metrics
- Recent recommendations
- Usage statistics
- Model performance widget (CTR, conversion, accuracy)

#### `/recommendations`
- Get recommendations for customers
- Batch inference widget
- View recommendation history

#### `/settings`
- Account settings
- API keys management
- Request isolated model (Enterprise)
- Billing information

#### `/usage`
- API usage charts
- Rate limit status
- Overage warnings

**Key Components**:
- `ModelPerformanceWidget` - Shows CTR, conversion rate, accuracy, total recommendations (auto-refresh every 5 min)
- `BatchInferenceWidget` - Submit batch jobs, check status
- `RequestIsolatedModel` - Enterprise feature to request custom models
- `UsageWidget` - Current usage vs plan limits
- `OverageWidget` - Overage alerts

**State Management**:
- React Hooks (useState, useEffect)
- No global state library
- API calls with fetch + credentials

---

### 3. Admin Panel (Port 3001)
**URL**: http://localhost:3001

**Authentication**:
- Admin-only access
- JWT token required
- Role check on every route

**Sidebar Navigation**:
- Tenants
- Revenue
- Monitoring (Batch Queue)
- Features
- ML Models
- Isolation Requests
- Anomalies (with red badge showing count)
- Database Pool
- Batch Operations
- Bot Detection
- Logs
- Usage
- Support

**Pages**:

#### `/tenants`
- List all tenants
- View tenant details
- Manage subscriptions
- Usage statistics

#### `/revenue`
- MRR tracking
- Revenue charts
- Churn analysis

#### `/monitoring`
- Batch queue statistics (queue length, processing, failed, rate)
- Failed jobs table with retry buttons
- Auto-refresh every 5 seconds
- Empty state when no jobs

#### `/models`
- Model version management
- A/B test setup (traffic split slider)
- Rollback functionality
- Performance metrics (CTR, conversion, accuracy)
- Performance charts (7-day accuracy, precision, recall, F1)
- Create tenant model button
- Empty state with "Register Version" CTA
- Tooltips on all actions

#### `/isolation-requests`
- Pending tenant model requests
- Approve/reject workflow
- Request details (tenant, model, reason)

#### `/anomalies`
- Security alerts list
- Severity badges (high/medium/low)
- Resolve/Ignore buttons
- Auto-refresh every 30 seconds
- Empty state when no anomalies
- Tooltips explaining severity levels

#### `/usage`
- System-wide usage statistics
- Per-tenant breakdown

**Key Features**:
- Real-time anomaly count badge (polls every 30s)
- Error boundaries on all pages
- Loading spinners during data fetch
- Tooltips on complex features
- Empty states with CTAs

---

## Shared Components (packages/ui)

### Core Components
- `Button` - Styled button
- `Card` - Container component
- `Spinner` - Loading indicator (sm/md/lg)
- `Tooltip` - Hover tooltips with InfoIcon
- `PageErrorBoundary` - Error handling

### Feature Components
- `UsageWidget` - Usage tracking
- `OverageWidget` - Overage alerts
- `ModelPerformanceWidget` - Model metrics
- `BatchInferenceWidget` - Batch jobs
- `RequestIsolatedModel` - Isolation requests
- `AnomalyBanner` - Alert banner

### Utility Components
- `LoadingSkeleton` - Skeleton loaders
- `PasswordStrength` - Password validator
- `ConfirmDialog` - Confirmation modals
- `OfflineDetector` - Network status
- `AutoSaveIndicator` - Auto-save status
- `ProgressBar` - Progress indicators
- `RateLimitIndicator` - Rate limit status

### Utilities
- `fetchWithAuth` - Authenticated fetch
- `handleApiError` - Error handling
- `getCsrfToken` - CSRF protection
- `useFeatureGate` - Feature flags
- `useAutoSave` - Auto-save hook
- `useUndo` - Undo functionality

---

## API Integration

### Base URL
```typescript
const API_URL = 'http://localhost:8000';
```

### Authentication
```typescript
// All requests include credentials
fetch(url, { credentials: 'include' })
```

### Error Handling
```typescript
try {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
} catch (error) {
  console.error('Failed:', error);
}
```

### Common Patterns

#### Data Fetching
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  setLoading(true);
  try {
    const res = await fetch(url, { credentials: 'include' });
    setData(await res.json());
  } catch (error) {
    console.error(error);
  }
  setLoading(false);
};
```

#### Auto-refresh
```typescript
useEffect(() => {
  loadData();
  const interval = setInterval(loadData, 30000); // 30s
  return () => clearInterval(interval);
}, []);
```

---

## Styling

### Tailwind CSS
All apps use Tailwind for styling:
- Utility-first approach
- Responsive design
- Dark mode support (future)

### Common Classes
- Layout: `flex`, `grid`, `p-6`, `gap-4`
- Colors: `bg-blue-600`, `text-white`, `border-gray-200`
- Typography: `text-2xl`, `font-bold`, `text-sm`
- States: `hover:bg-blue-700`, `disabled:opacity-50`

---

## State Management

### No Global State
- Each page manages its own state
- React Hooks (useState, useEffect)
- Props for component communication

### Why No Redux/Zustand?
- Simple data flows
- Server state from API
- No complex client state
- Easier to maintain

---

## Performance

### Optimizations
- Component-level code splitting
- Image optimization (Next.js)
- API response caching (future)
- Lazy loading (future)

### Metrics
- First Contentful Paint: <1s
- Time to Interactive: <2s
- Lighthouse Score: >90

---

## Security

### Authentication
- JWT tokens in HTTP-only cookies
- CSRF protection
- Session timeout (1 hour)

### Authorization
- Role-based access (tenant/admin)
- Route protection
- API endpoint validation

### Data Protection
- No sensitive data in localStorage
- HTTPS only in production
- XSS prevention (React escaping)

---

## Development

### Start All Apps
```bash
cd frontend
npm install
npm run dev
```

### Start Individual App
```bash
cd frontend/apps/admin
npm run dev
```

### Build for Production
```bash
npm run build
npm run start
```

---

## Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Docker
```bash
docker build -t luxebrain-frontend .
docker run -p 3000:3000 luxebrain-frontend
```

### Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://api.luxebrain.ai
NEXT_PUBLIC_STRIPE_KEY=pk_live_...
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Build Errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API Connection Failed
- Check backend is running on port 8000
- Verify CORS settings
- Check credentials: 'include' in fetch

---

## Future Enhancements

- [ ] Dark mode support
- [ ] Mobile app (React Native)
- [ ] Real-time updates (WebSockets)
- [ ] Offline support (PWA)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)
