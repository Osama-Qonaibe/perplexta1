# Deployment Guide — Perplexta

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 15+ running
- PM2 installed globally: `npm install -g pm2`
- Environment variables configured (see `.env.production.example`)

## Step 1: Clone & Install

```bash
git clone https://github.com/Osama-Qonaibe/perplexta.git
cd perplexta
npm install --production
```

## Step 2: Environment Setup

```bash
cp .env.production.example .env
# Edit .env with your production values:
# - DATABASE_URL
# - ADMIN_EMAIL, ADMIN_PASSWORD
# - ALLOWED_ORIGINS
# - JWT_SECRET (generate: `openssl rand -hex 32`)
```

## Step 3: Database Migrations

```bash
npm run migrate
# Verify: npm run verify-db
```

## Step 4: Build

```bash
npm run build
```

## Step 5: Start with PM2 (Bare Metal / VPS)

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

## Alternative: Docker & Docker Compose Deployment (Recommended for Production)

The project includes a multi-stage production `Dockerfile` and `docker-compose.yml`:

```bash
# Build and run containers in detached mode:
docker compose up -d --build

# View logs:
docker compose logs -f app

# Run migrations inside container:
docker compose exec app npm run migrate
```

## Cloudflare & Nginx Reverse Proxy Setup

When deploying behind Cloudflare:
1. Set SSL/TLS encryption mode to **Full (Strict)** in the Cloudflare dashboard.
2. Ensure WebSocket connections are enabled in **Network settings**.
3. Use the Nginx reverse proxy configuration with real IP restoration (`CF-Connecting-IP`).
4. Set client request limits (`client_max_body_size 100M;`).

## Step 6: Verify

```bash
curl https://perplexta.com/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

## Troubleshooting

- **DB connection failed**: Check DATABASE_URL, SSL mode
- **Port 3000 in use**: Edit `ecosystem.config.cjs`
- **Migration errors**: Run `npm run migrate:verify`
