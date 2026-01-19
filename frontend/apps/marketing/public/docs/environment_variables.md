# Environment Variables Documentation
**Copyright © 2024 Paksa IT Solutions**

## Overview
This document describes all environment variables used in LuxeBrain AI.

---

## Application Settings

### `APP_ENV`
- **Type:** String
- **Required:** Yes
- **Default:** `development`
- **Values:** `development`, `staging`, `production`
- **Description:** Application environment

### `DEBUG`
- **Type:** Boolean
- **Required:** Yes
- **Default:** `True`
- **Description:** Enable debug mode (disables Swagger in production)

### `API_HOST`
- **Type:** String
- **Required:** Yes
- **Default:** `0.0.0.0`
- **Description:** API server host

### `API_PORT`
- **Type:** Integer
- **Required:** Yes
- **Default:** `8000`
- **Description:** API server port

---

## Database

### `DATABASE_URL`
- **Type:** String
- **Required:** Yes
- **Default:** `sqlite:///./luxebrain.db`
- **Example:** `postgresql://user:password@localhost:5432/luxebrain`
- **Description:** Database connection string

### `DATABASE_POOL_SIZE`
- **Type:** Integer
- **Required:** No
- **Default:** `10`
- **Description:** Database connection pool size

---

## Redis

### `REDIS_URL`
- **Type:** String
- **Required:** Yes
- **Default:** `redis://localhost:6379/0`
- **Description:** Redis connection string

---

## JWT & Security

### `JWT_SECRET_KEY`
- **Type:** String
- **Required:** Yes
- **Security:** CRITICAL - Change in production
- **Description:** Secret key for JWT token signing

### `JWT_ALGORITHM`
- **Type:** String
- **Required:** No
- **Default:** `HS256`
- **Description:** JWT signing algorithm

### `JWT_EXPIRATION_MINUTES`
- **Type:** Integer
- **Required:** No
- **Default:** `60`
- **Description:** JWT token expiration time

---

## Stripe (Billing)

### `STRIPE_SECRET_KEY`
- **Type:** String
- **Required:** Yes (for billing features)
- **Example:** `sk_test_...` or `sk_live_...`
- **Description:** Stripe secret API key

### `STRIPE_PUBLISHABLE_KEY`
- **Type:** String
- **Required:** Yes (for billing features)
- **Example:** `pk_test_...` or `pk_live_...`
- **Description:** Stripe publishable key

### `STRIPE_WEBHOOK_SECRET`
- **Type:** String
- **Required:** Yes (for billing features)
- **Example:** `whsec_...`
- **Description:** Stripe webhook signing secret

---

## Email Service

### Option 1: SendGrid

#### `SENDGRID_API_KEY`
- **Type:** String
- **Required:** If using SendGrid
- **Description:** SendGrid API key

#### `SENDGRID_FROM_EMAIL`
- **Type:** String
- **Required:** If using SendGrid
- **Example:** `noreply@luxebrain.ai`
- **Description:** Sender email address

### Option 2: SMTP

#### `SMTP_HOST`
- **Type:** String
- **Required:** If using SMTP
- **Example:** `smtp.gmail.com`
- **Description:** SMTP server host

#### `SMTP_PORT`
- **Type:** Integer
- **Required:** If using SMTP
- **Default:** `587`
- **Description:** SMTP server port

#### `SMTP_USER`
- **Type:** String
- **Required:** If using SMTP
- **Description:** SMTP username

#### `SMTP_PASSWORD`
- **Type:** String
- **Required:** If using SMTP
- **Security:** CRITICAL
- **Description:** SMTP password

#### `SMTP_FROM_EMAIL`
- **Type:** String
- **Required:** If using SMTP
- **Description:** Sender email address

---

## Twilio (SMS/WhatsApp)

### `TWILIO_ACCOUNT_SID`
- **Type:** String
- **Required:** If using Twilio
- **Description:** Twilio account SID

### `TWILIO_AUTH_TOKEN`
- **Type:** String
- **Required:** If using Twilio
- **Security:** CRITICAL
- **Description:** Twilio auth token

### `TWILIO_PHONE_NUMBER`
- **Type:** String
- **Required:** If using SMS
- **Example:** `+1234567890`
- **Description:** Twilio phone number for SMS

### `TWILIO_WHATSAPP_NUMBER`
- **Type:** String
- **Required:** If using WhatsApp
- **Example:** `whatsapp:+1234567890`
- **Description:** Twilio WhatsApp number

---

## AWS (Optional)

### `AWS_ACCESS_KEY_ID`
- **Type:** String
- **Required:** If using AWS services
- **Description:** AWS access key

### `AWS_SECRET_ACCESS_KEY`
- **Type:** String
- **Required:** If using AWS services
- **Security:** CRITICAL
- **Description:** AWS secret key

### `AWS_REGION`
- **Type:** String
- **Required:** If using AWS services
- **Default:** `us-east-1`
- **Description:** AWS region

### `AWS_S3_BUCKET`
- **Type:** String
- **Required:** If using S3
- **Description:** S3 bucket name

---

## WooCommerce

### `WOOCOMMERCE_URL`
- **Type:** String
- **Required:** Yes
- **Example:** `https://your-store.com`
- **Description:** WooCommerce store URL

### `WOOCOMMERCE_CONSUMER_KEY`
- **Type:** String
- **Required:** Yes
- **Example:** `ck_...`
- **Description:** WooCommerce API consumer key

### `WOOCOMMERCE_CONSUMER_SECRET`
- **Type:** String
- **Required:** Yes
- **Example:** `cs_...`
- **Security:** CRITICAL
- **Description:** WooCommerce API consumer secret

---

## Frontend URLs

### `NEXT_PUBLIC_API_URL`
- **Type:** String
- **Required:** Yes
- **Default:** `http://localhost:8000`
- **Description:** Backend API URL

### `NEXT_PUBLIC_TENANT_APP_URL`
- **Type:** String
- **Required:** Yes
- **Default:** `http://localhost:3000`
- **Description:** Tenant app URL

### `NEXT_PUBLIC_ADMIN_APP_URL`
- **Type:** String
- **Required:** Yes
- **Default:** `http://localhost:3001`
- **Description:** Admin app URL

### `NEXT_PUBLIC_MARKETING_URL`
- **Type:** String
- **Required:** Yes
- **Default:** `http://localhost:3002`
- **Description:** Marketing site URL

---

## Monitoring (Optional)

### `SENTRY_DSN`
- **Type:** String
- **Required:** No
- **Description:** Sentry error tracking DSN

### `PROMETHEUS_PORT`
- **Type:** Integer
- **Required:** No
- **Default:** `9090`
- **Description:** Prometheus metrics port

### `GRAFANA_PORT`
- **Type:** Integer
- **Required:** No
- **Default:** `3000`
- **Description:** Grafana dashboard port

---

## MLflow (Optional)

### `MLFLOW_TRACKING_URI`
- **Type:** String
- **Required:** No
- **Default:** `http://localhost:5000`
- **Description:** MLflow tracking server URL

---

## Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update all `REQUIRED` variables

3. Change all `CRITICAL` security variables in production

4. Never commit `.env` to version control

---

## Validation

The application validates required environment variables on startup and will fail fast if critical variables are missing.

---

**Last Updated:** 2024-01-15
