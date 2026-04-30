# BUILD.md — Zero Click Compliance (ZCC)

## Overview

ZCC has two independently deployable pieces:

| Package | Stack | Default port |
|---|---|---|
| `zcc-web` | React 19 + Vite + TypeScript | 5173 (dev) |
| `zcc-api` | Node.js + Express 5 + TypeScript | 4000 |

Both share a **Supabase** Postgres database. The frontend is a static SPA; the API is a long-running Node process.

---

## Prerequisites

- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com) project (free tier works)
- A Google Gemini API key (for PDF parsing)
- An email provider API key — Postmark or SendGrid (for vendor outreach)

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd zreo-click-compliance

# Install both packages
(cd zcc-api && npm install)
(cd zcc-web && npm install)
```

---

## 2. Database Setup (Supabase)

Run the initial migration in the **Supabase SQL editor** or via the Supabase CLI:

```bash
# Via Supabase CLI (from repo root)
supabase db push --db-url "postgresql://postgres:<password>@<host>:5432/postgres"

# Or paste the contents of this file directly into the Supabase SQL editor:
# zcc-api/supabase/migrations/20260324_init.sql
```

This creates three tables: `vendors`, `assessments`, `agent_logs`.

---

## 3. API Configuration

```bash
cd zcc-api
cp .env.example .env
```

Edit `.env`:

```env
PORT=4000
NODE_ENV=development

# From your Supabase project → Settings → API
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # use service role, not anon key

# Google AI Studio → API keys
GEMINI_API_KEY=<your-gemini-key>

# Postmark or SendGrid
EMAIL_SERVICE_API_KEY=<your-email-key>
INBOUND_WEBHOOK_SECRET=<random-secret-string>
```

---

## 4. Running Locally

### API (watch mode)

```bash
cd zcc-api
npm run dev
# → http://localhost:4000
# → GET /health returns { status: "healthy" }
```

### Frontend (watch mode)

```bash
cd zcc-web
npm run dev
# → http://localhost:5173
```

Run both concurrently from the repo root:

```bash
(cd zcc-api && npm run dev) & (cd zcc-web && npm run dev)
```

---

## 5. Building for Production

### API

```bash
cd zcc-api
npm run build          # compiles TypeScript → dist/
npm start              # runs node dist/index.js
```

### Frontend

```bash
cd zcc-web
npm run build          # type-checks + Vite build → dist/
npm run preview        # locally preview the production build
```

The frontend build output is in `zcc-web/dist/` — a folder of static files ready to upload to any CDN or static host.

---

## 6. Deployment

### Frontend — Vercel (recommended)

1. Import the repo in [vercel.com](https://vercel.com).
2. Set **Root Directory** to `zcc-web`.
3. Vercel auto-detects Vite; no further config needed.
4. Add an env var `VITE_API_URL=https://<your-api-domain>` if the frontend needs to call the API directly.

Manual deploy:
```bash
cd zcc-web
npm run build
# Upload dist/ to Vercel, Netlify, S3+CloudFront, or any static host
```

### API — Railway / Render / Fly.io

**Railway (simplest):**
1. Create a new Railway project → "Deploy from GitHub".
2. Set the **Root Directory** to `zcc-api`.
3. Set the **Start Command** to `npm start`.
4. Add all environment variables from `.env` in the Railway dashboard.
5. Railway runs `npm install` and `npm run build` automatically on deploy.

**Render:**
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Root directory: `zcc-api`

**Docker (self-hosted):**
```dockerfile
# zcc-api/Dockerfile (create this if needed)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

```bash
docker build -t zcc-api ./zcc-api
docker run -p 4000:4000 --env-file zcc-api/.env zcc-api
```

---

## 7. API Endpoints Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/vendors` | List all vendors |
| `POST` | `/api/vendors` | Add vendor, trigger outreach agent |
| `POST` | `/api/vendors/:id/upload` | Manual SOC 2 PDF upload |
| `POST` | `/webhooks/inbound-email` | Inbound email webhook (Postmark/SendGrid) |

---

## 8. Linting & Type Checking

```bash
# Frontend
cd zcc-web
npm run lint
npx tsc --noEmit

# API
cd zcc-api
npx tsc --noEmit
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default: 4000) | API listen port |
| `NODE_ENV` | No | `development` or `production` |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `GEMINI_API_KEY` | Yes | Google Gemini key for PDF parsing |
| `EMAIL_SERVICE_API_KEY` | Yes | Postmark or SendGrid key |
| `INBOUND_WEBHOOK_SECRET` | Yes | Secret for validating inbound email webhooks |
