# Frontend Deployment Guide

**Copyright © 2024 Paksa IT Solutions**

## Vercel Deployment (Recommended)

### Prerequisites
- Vercel account
- GitHub repository connected

### Deploy All Apps

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy tenant app
cd apps/tenant
vercel --prod

# Deploy admin app
cd apps/admin
vercel --prod

# Deploy marketing site
cd apps/marketing
vercel --prod
```

### Custom Domains

In Vercel dashboard:
1. Tenant: app.luxebrain.ai
2. Admin: admin.luxebrain.ai
3. Marketing: luxebrain.ai

### Environment Variables

Add in Vercel dashboard for each app:

**Tenant & Admin:**
```
NEXT_PUBLIC_API_URL=https://api.luxebrain.ai
API_URL=https://api.luxebrain.ai
JWT_SECRET=<production-secret>
```

**Marketing:**
```
NEXT_PUBLIC_API_URL=https://api.luxebrain.ai
```

## Docker Deployment

### Build Images

```bash
# Tenant
docker build -t luxebrain-tenant -f apps/tenant/Dockerfile .

# Admin
docker build -t luxebrain-admin -f apps/admin/Dockerfile .

# Marketing
docker build -t luxebrain-marketing -f apps/marketing/Dockerfile .
```

### Run Containers

```bash
docker run -p 3000:3000 -e API_URL=http://api:8000 luxebrain-tenant
docker run -p 3001:3000 -e API_URL=http://api:8000 luxebrain-admin
docker run -p 3002:3000 luxebrain-marketing
```

## Hostinger VPS Deployment

### Setup

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone repository
git clone https://github.com/paksaitsolutions/LuxeBrain.git
cd LuxeBrain/frontend

# Install dependencies
npm install

# Build all apps
npm run build
```

### Run with PM2

```bash
# Tenant app
cd apps/tenant
pm2 start npm --name "luxebrain-tenant" -- start

# Admin app
cd apps/admin
pm2 start npm --name "luxebrain-admin" -- start

# Marketing site
cd apps/marketing
pm2 start npm --name "luxebrain-marketing" -- start

# Save PM2 config
pm2 save
pm2 startup
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/luxebrain

# Tenant Dashboard
server {
    listen 80;
    server_name app.luxebrain.ai;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Panel
server {
    listen 80;
    server_name admin.luxebrain.ai;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Marketing Site
server {
    listen 80;
    server_name luxebrain.ai www.luxebrain.ai;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable sites:
```bash
sudo ln -s /etc/nginx/sites-available/luxebrain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d app.luxebrain.ai -d admin.luxebrain.ai -d luxebrain.ai -d www.luxebrain.ai
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Monitoring

### Vercel Analytics
- Automatic in Vercel dashboard
- Real-time performance metrics

### Custom Monitoring
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure in next.config.js
```

## Cost Estimates

### Vercel
- Hobby: $0/month (1 team member)
- Pro: $20/month per member
- Enterprise: Custom

### VPS (Hostinger)
- 2 vCPU, 4GB RAM: $12/month
- 4 vCPU, 8GB RAM: $24/month

---

**Built with ❤️ by Paksa IT Solutions**
