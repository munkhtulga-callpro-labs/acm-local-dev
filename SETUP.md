# Local Development Setup

## Prerequisites

- Node.js 18+
- pnpm
- Docker Desktop

## Steps

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://acm:acm_dev_pass@localhost:5432/acm_dev"
REDIS_URL="redis://localhost:6379"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"

SEED_DEFAULT_PASSWORD="your-password-here"

# Google OAuth (optional for local dev)
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
```

### 3. Start Docker containers

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL on port 5432 and Redis on port 6379.

### 4. Push schema to database

> Note: `prisma migrate deploy` requires `DATABASE_URL` to be set in the shell because `prisma.config.ts` skips `.env` loading. Use the prefix below or `export DATABASE_URL=...` first.

```bash
DATABASE_URL="postgresql://acm:acm_dev_pass@localhost:5432/acm_dev" npx prisma db push
```

### 5. Generate Prisma client

```bash
DATABASE_URL="postgresql://acm:acm_dev_pass@localhost:5432/acm_dev" npx prisma generate
```

### 6. Seed the database

```bash
DATABASE_URL="postgresql://acm:acm_dev_pass@localhost:5432/acm_dev" npx prisma db seed
```

Seed users (password is whatever you set in `SEED_DEFAULT_PASSWORD`):

| Role | Email |
|------|-------|
| Admin | `admin@callpro.mn` |
| HR Manager | `hr@callpro.mn` |
| IT Staff | `it@callpro.mn` |
| Employee | `john.doe@company.com` |

### 7. Start the dev server

```bash
pnpm dev
```

App runs at http://localhost:3000.

---

## Useful commands

```bash
# View database in browser
DATABASE_URL="postgresql://acm:acm_dev_pass@localhost:5432/acm_dev" npx prisma studio

# Stop Docker containers
docker compose -f docker-compose.dev.yml down

# Wipe and reseed database
DATABASE_URL="postgresql://acm:acm_dev_pass@localhost:5432/acm_dev" npx prisma db push --force-reset && npx prisma db seed
```

## Notes

- `prisma.config.ts` skips `.env` loading — prefix all `npx prisma` commands with `DATABASE_URL=...` or export it in your shell session
- Production uses `docker-compose.prod.yml` with a full stack (app + nginx + postgres + redis)
- Production is deployed at https://acm.callpro.mn
