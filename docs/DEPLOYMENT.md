# IHG Platform — Deployment Guide

> Production deployment instructions for the IHG Platform.

---

## Table of Contents

1. [Pre-deployment checklist](#1-pre-deployment-checklist)
2. [Option A: Vercel + Railway (Recommended for speed)](#2-option-a-vercel--railway-recommended-for-speed)
3. [Option B: Single VPS deployment](#3-option-b-single-vps-deployment)
4. [Option C: Docker deployment](#4-option-c-docker-deployment)
5. [Database setup (PostgreSQL)](#5-database-setup-postgresql)
6. [Environment variables reference](#6-environment-variables-reference)
7. [Post-deployment tasks](#7-post-deployment-tasks)
8. [Monitoring & maintenance](#8-monitoring--maintenance)
9. [Rollback procedure](#9-rollback-procedure)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Pre-deployment checklist

Before deploying to production, make sure you have:

- [ ] **Domain name** registered (e.g., `platform.ihg.com`)
- [ ] **SSL certificate** (most hosting providers issue these free via Let's Encrypt)
- [ ] **PostgreSQL database** (managed service recommended)
- [ ] **Email service** (Resend, SendGrid, or AWS SES)
- [ ] **Cloud storage** for file uploads (AWS S3, Cloudflare R2, or similar)
- [ ] **Backup strategy** defined
- [ ] **Monitoring** (Sentry, LogRocket, or similar)
- [ ] **CI/CD** pipeline (GitHub Actions, GitLab CI)
- [ ] **All environment variables** ready (see [Section 6](#6-environment-variables-reference))

### Production readiness verification

Run these locally before deploying:

```bash
# 1. Type check
npm run typecheck

# 2. Lint
npm run lint

# 3. Build (catches most issues)
npm run build

# 4. Run tests
npm test
```

---

## 2. Option A: Vercel + Railway (Recommended for speed)

> ~30 minutes from zero to production. Best for getting started.

### Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Vercel        │         │  Railway / Neon  │
│   (Next.js)     │────────▶│  (PostgreSQL)    │
│   Edge network  │         │                  │
└─────────────────┘         └──────────────────┘
```

### Step 1: Set up PostgreSQL

Use a managed service (no DevOps required):

**Option 1: Neon (free tier available)**
1. Go to https://neon.tech
2. Create account, create new project
3. Copy the connection string

**Option 2: Railway**
1. Go to https://railway.app
2. New project → Provision PostgreSQL
3. Copy the `DATABASE_URL` from Variables tab

**Option 3: Supabase**
1. Go to https://supabase.com
2. New project
3. Settings → Database → Connection string

### Step 2: Switch Prisma to PostgreSQL

Edit `prisma/schema.prisma`:

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

Then reintroduce the `enum` declarations that were converted to strings for SQLite:

```prisma
enum UserRole {
  SUPER_ADMIN
  PROPERTY_ADMIN
  MANAGER
  RECEPTION
  HOUSEKEEPING
  KITCHEN
  WAITER
  DELIVERY
  CUSTOMER
}
// ... and similar for RoomStatus, BookingStatus, etc.
```

(See the schema header comment for the full list.)

### Step 3: Deploy to Vercel

**Option 1: One-click via GitHub**

1. Push your code to GitHub
2. Go to https://vercel.com
3. Click **"New Project"**
4. Import your repository
5. Configure:
   - **Framework Preset:** Next.js
   - **Build Command:** `prisma generate && next build` (already in package.json)
6. Add **Environment Variables** (see Section 6)
7. Click **"Deploy"**

**Option 2: Vercel CLI**

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Step 4: Run migrations

After first deployment, run migrations against your production database:

```bash
# Locally, with production DATABASE_URL in your env:
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Or via Vercel CLI:
vercel env pull .env.production
npx prisma migrate deploy
```

### Step 5: Seed initial data (optional, only for first setup)

```bash
DATABASE_URL="postgresql://..." npm run db:seed
```

> ⚠️ **Only seed if it's a fresh database.** Don't run on production data.

### Step 6: Set up custom domain

1. In Vercel: **Settings → Domains**
2. Add `platform.ihg.com`
3. Update your DNS:
   - **CNAME** record pointing to `cname.vercel-dns.com`
4. Vercel auto-provisions SSL

---

## 3. Option B: Single VPS deployment

> More control, lower ongoing cost. Best for predictable workloads.

### Requirements

- VPS with **2 vCPU, 4GB RAM minimum** (8GB recommended for production)
- Ubuntu 22.04+ or similar Linux
- Domain pointed to server's IP

### Step 1: Server setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Set up PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE ihg_platform;
CREATE USER ihg_user WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE ihg_platform TO ihg_user;
\q
```

### Step 3: Deploy the app

```bash
# Create app user
sudo useradd -m -s /bin/bash ihgapp
sudo su - ihgapp

# Clone the repo
git clone <your-repo-url> /home/ihgapp/ihg-platform
cd /home/ihgapp/ihg-platform

# Install dependencies
npm ci --production

# Set up environment
cp .env.example .env
# Edit .env with production values

# Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate deploy

# Build
npm run build
```

### Step 4: Run with PM2 (process manager)

```bash
sudo npm install -g pm2

# Start the app
pm2 start npm --name "ihg-platform" -- start

# Auto-start on reboot
pm2 startup
pm2 save
```

### Step 5: Configure Nginx reverse proxy

```bash
sudo nano /etc/nginx/sites-available/ihg-platform
```

```nginx
server {
    listen 80;
    server_name platform.ihg.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ihg-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d platform.ihg.com
```

---

## 4. Option C: Docker deployment

> Reproducible, easy to scale.

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

Add to `next.config.mjs`:
```js
const nextConfig = {
  output: "standalone",
  // ... rest of config
};
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://ihg:ihgpass@db:5432/ihg_platform
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ihg
      POSTGRES_PASSWORD: ihgpass
      POSTGRES_DB: ihg_platform
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  pgdata:
```

### Run

```bash
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
```

---

## 5. Database setup (PostgreSQL)

### Switch from SQLite to PostgreSQL

The project ships with SQLite for easy local development. For production:

**Step 1: Edit `prisma/schema.prisma`**

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

**Step 2: Reintroduce enums (optional but recommended)**

Search for `// UserRole:` etc. comments in the schema and convert String fields back to proper Prisma enums. The TypeScript layer will need to be updated to import from `@prisma/client` again.

**Step 3: Set `DATABASE_URL`**

```env
DATABASE_URL="postgresql://ihg_user:STRONG_PASSWORD@db.host.com:5432/ihg_platform?schema=public"
```

**Step 4: Run migrations**

```bash
npx prisma migrate dev --name init  # local dev
npx prisma migrate deploy           # production
```

### Connection pooling

For serverless deployments (Vercel), use a connection pooler like PgBouncer or a service like Neon / Supabase that provides one automatically.

Add `?pgbouncer=true` to your connection string if using PgBouncer.

---

## 6. Environment variables reference

### Required

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | JWT signing secret (32+ chars) | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Public URL of the app | `https://platform.ihg.com` |
| `APP_URL` | Same as NEXTAUTH_URL (used in emails) | `https://platform.ihg.com` |

### Email (production)

| Variable | Description | Example |
|---|---|---|
| `EMAIL_MOCK` | Set to `"false"` to send real emails | `false` |
| `EMAIL_FROM` | Sender address | `IHG Platform <noreply@ihg.com>` |
| `SMTP_HOST` | SMTP server | `smtp.resend.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `resend` |
| `SMTP_PASS` | SMTP password | `re_xxxxx` |

> **Resend** (recommended): https://resend.com — free tier 100 emails/day
> **SendGrid:** https://sendgrid.com
> **AWS SES:** Cheapest at scale

### Optional

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Environment | `production` |
| `APP_NAME` | Application name | `IHG Platform` |
| `PAYMENT_DEMO_MODE` | Use mock payment processing | `true` |

### Generating secrets

```bash
# 32-byte random secret
openssl rand -base64 32

# Or in Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 7. Post-deployment tasks

After your first successful deployment:

### 7.1 Create your first super admin

The seed creates demo accounts. For production, create a real one:

```bash
DATABASE_URL="..." node -e "
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const db = new PrismaClient();
  (async () => {
    await db.user.create({
      data: {
        email: 'admin@ihg.com',
        passwordHash: await bcrypt.hash('CHANGE_THIS_PASSWORD', 10),
        name: 'Your Name',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    await db.\$disconnect();
  })();
"
```

### 7.2 Configure DNS

Add these records:

| Type | Name | Value |
|---|---|---|
| CNAME | platform | `cname.vercel-dns.com` (Vercel) |
| Or A | platform | your.server.ip (VPS) |

### 7.3 Set up monitoring

**Sentry (recommended):**
1. Create account at https://sentry.io
2. Create new Next.js project
3. Install: `npm install @sentry/nextjs`
4. Add `SENTRY_DSN` to env
5. Add `sentry.client.config.ts` and `sentry.server.config.ts`

**Uptime monitoring (free options):**
- UptimeRobot
- Better Uptime
- Cronitor

### 7.4 Set up database backups

For managed databases (Neon, Supabase, Railway), backups are automatic.

For self-hosted:

```bash
# Daily backup cron
0 2 * * * pg_dump -U ihg_user ihg_platform | gzip > /backups/ihg-$(date +\%Y\%m\%d).sql.gz
```

Store backups off-site (S3, Backblaze B2).

### 7.5 Smoke tests

Verify everything works:

1. ✅ Visit homepage — should show landing page
2. ✅ Sign in with each role
3. ✅ Create a test booking
4. ✅ Create a test order
5. ✅ Check that alerts appear
6. ✅ Verify email is sent (if configured)
7. ✅ Test on mobile device

---

## 8. Monitoring & maintenance

### Logs

**Vercel:**
- View real-time logs in the dashboard → Logs tab

**VPS (with PM2):**
```bash
pm2 logs ihg-platform          # Live tail
pm2 logs ihg-platform --lines 500  # Last 500 lines
```

### Metrics to watch

- **Response time:** Should be < 500ms for most pages
- **Error rate:** Should be < 0.1%
- **Database connections:** Should stay under 80% of pool size
- **Disk usage:** Alert at 80%
- **Memory:** Should be stable, not growing

### Updating the app

```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm ci --production

# Rebuild
npm run build

# Restart
pm2 restart ihg-platform
# OR for Vercel: just push to main, auto-deploys
```

### Database migrations

When schema changes:

```bash
# Generate migration
npx prisma migrate dev --name describe_change

# Apply to production
npx prisma migrate deploy
```

---

## 9. Rollback procedure

### Vercel

1. Go to Deployments tab
2. Find the last working deployment
3. Click the three dots → **"Promote to Production"**

### VPS

```bash
# Tag current as rollback target
pm2 stop ihg-platform
git checkout <previous-commit>
npm ci --production
npm run build
pm2 start ihg-platform

# If database migration was involved:
npx prisma migrate resolve --rolled-back <migration_name>
```

### Database rollback

⚠️ **Dangerous.** Always backup first.

```bash
# Restore from backup
pg_restore -d ihg_platform /backups/ihg-20260813.sql
```

---

## 10. Troubleshooting

### "PrismaClientInitializationError"

**Cause:** Database connection issue.

**Fix:**
- Verify `DATABASE_URL` is correct
- Check database server is running
- Check firewall allows connection from app server
- For managed DBs: ensure IP allowlist includes your app

### "NEXTAUTH_SECRET is not set"

**Cause:** Missing or empty environment variable.

**Fix:**
```bash
# Generate
openssl rand -base64 32
# Add to .env or hosting provider's env settings
NEXTAUTH_SECRET="<the-generated-value>"
```

### "Module not found" errors after deploy

**Cause:** Dependencies not installed properly.

**Fix:**
```bash
mavis-trash .next node_modules
npm ci
npm run build
```

### Slow page loads

**Checklist:**
- [ ] Database has proper indexes (run `\d+` in psql to verify)
- [ ] Add caching headers in `next.config.mjs`
- [ ] Check database query performance with `EXPLAIN ANALYZE`
- [ ] Use React Server Components for data-heavy pages
- [ ] Add `loading.tsx` for better perceived performance

### Emails not sending

- Verify `EMAIL_MOCK=false` in production
- Check SMTP credentials
- Test with a simple script: `node -e "..."` 
- Check spam folder
- Verify SPF/DKIM records on your sending domain

### Out of memory

- Increase server RAM
- Use `pm2 start ... --max-memory-restart 1G` to auto-restart on high memory
- Check for memory leaks with `clinic.js`

---

## 📞 Support contacts

For deployment issues, contact:
- **DevOps team:** devops@ihg.com
- **On-call:** [PagerDuty URL]
- **Documentation:** This guide + README.md

---

*Last updated: August 2026 · IHG Platform v1.0*
