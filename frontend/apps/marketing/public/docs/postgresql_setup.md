# PostgreSQL Setup for Production

**Copyright © 2024 Paksa IT Solutions**

## Overview

LuxeBrain AI uses PostgreSQL for production deployments. This guide covers setup and migration.

## Quick Start

### 1. Start PostgreSQL with Docker Compose

```bash
docker-compose up -d postgres
```

This starts PostgreSQL on port 5432 with:
- Database: `luxebrain`
- User: `luxebrain_user`
- Password: `luxebrain_pass`

### 2. Update Environment Variables

Edit `.env` file:

```bash
# Change from SQLite
DATABASE_URL=postgresql://luxebrain_user:luxebrain_pass@localhost:5432/luxebrain
```

### 3. Run Database Migrations

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

## Alembic Commands

### Create Migration

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply Migrations

```bash
# Upgrade to latest
alembic upgrade head

# Upgrade one version
alembic upgrade +1

# Downgrade one version
alembic downgrade -1
```

### View Migration History

```bash
alembic history
alembic current
```

## Production Configuration

### Connection Pooling

PostgreSQL uses connection pooling (configured in `config/database.py`):
- Pool size: 20 connections
- Max overflow: 40 connections
- Pre-ping: Enabled for connection health checks

### Backup Strategy

```bash
# Backup database
docker exec luxebrain-postgres pg_dump -U luxebrain_user luxebrain > backup.sql

# Restore database
docker exec -i luxebrain-postgres psql -U luxebrain_user luxebrain < backup.sql
```

### Performance Tuning

Edit `docker-compose.yml` to add PostgreSQL configuration:

```yaml
postgres:
  environment:
    POSTGRES_SHARED_BUFFERS: 256MB
    POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
    POSTGRES_MAX_CONNECTIONS: 100
```

## Switching from SQLite to PostgreSQL

1. Export data from SQLite:
```bash
python scripts/export_sqlite_data.py
```

2. Update `.env` with PostgreSQL URL

3. Run migrations:
```bash
alembic upgrade head
```

4. Import data:
```bash
python scripts/import_to_postgres.py
```

## Monitoring

### Check Connection Status

```bash
docker exec luxebrain-postgres psql -U luxebrain_user -d luxebrain -c "SELECT count(*) FROM pg_stat_activity;"
```

### View Active Queries

```bash
docker exec luxebrain-postgres psql -U luxebrain_user -d luxebrain -c "SELECT pid, usename, application_name, state, query FROM pg_stat_activity WHERE state = 'active';"
```

## Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs luxebrain-postgres
```

### Migration Conflicts

```bash
# Reset to specific version
alembic downgrade <revision>

# Stamp current version without running migrations
alembic stamp head
```

## Security

- Change default passwords in production
- Use SSL connections for remote databases
- Implement regular backup schedule
- Enable query logging for audit trails
