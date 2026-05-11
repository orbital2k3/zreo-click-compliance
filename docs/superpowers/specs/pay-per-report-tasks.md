# Pay-Per-Report: Development Tasks

**Source:** `2026-05-10-pay-per-report-design.md`
**Existing codebase:** `zcc-api/` (Express + TS), `zcc-web/` (React 19 + Vite + TS)

Tasks are grouped into tiers. **All tasks within the same tier can run in parallel.** A tier can only start after all tasks in the previous tier are complete.

---

## Tier 1 — Foundation

> Everything in Tier 2+ depends on these. Run these two in parallel.

### Task 1A: Database & Auth — Backend

**Scope:** `zcc-api/`, Supabase

**Deliverables:**
1. Create Supabase migration `zcc-api/supabase/migrations/20260511_reports.sql`:
   ```sql
   CREATE TABLE reports (
     id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id                   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     vendor_name               text NOT NULL,
     status                    text NOT NULL DEFAULT 'pending_upload',
     stripe_session_id         text,
     stripe_payment_intent_id  text,
     pdf_storage_path          text,
     report_storage_path       text,
     error_message             text,
     created_at                timestamptz NOT NULL DEFAULT now(),
     completed_at              timestamptz
   );

   ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "users own their reports"
     ON reports FOR ALL
     USING (auth.uid() = user_id);

   CREATE INDEX reports_user_id_created_at ON reports(user_id, created_at DESC);
   ```
2. Create Supabase Storage buckets:
   - `uploads` (private) — for incoming PDFs
   - `reports` (private) — for generated .docx files
3. Install `@supabase/supabase-js` in `zcc-api/`
4. Create `zcc-api/src/lib/supabase.ts` — export two clients:
   - `supabaseAdmin` using `SUPABASE_SERVICE_ROLE_KEY` (for backend operations, bypasses RLS)
   - Helper to extract user from request `Authorization: Bearer <token>` header using `supabase.auth.getUser(token)`
5. Create auth middleware `zcc-api/src/middleware/auth.ts`:
   - Extracts Bearer token from `Authorization` header
   - Validates with Supabase, attaches `req.user = { id, email }` 
   - Returns 401 on failure
6. Update `zcc-api/.env.example` with all new env vars:
   ```
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   STRIPE_PRICE_AMOUNT=15000
   AI_MODEL_ENDPOINT=
   AI_MODEL_API_KEY=
   EMAIL_API_KEY=
   EMAIL_FROM_ADDRESS=
   APP_URL=http://localhost:5173
   ```

**Existing code context:**
- `zcc-api/src/index.ts` — Express app, routes at `/api/vendors` and `/webhooks`
- `zcc-api/supabase/migrations/20260324_init.sql` — existing migration for vendors/assessments/agent_logs
- Current `.env.example` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` already

---

### Task 1B: Auth & Route Shell — Frontend

**Scope:** `zcc-web/`

**Deliverables:**
1. Install `@supabase/supabase-js` and a client-side router (`react-router-dom`)
2. Create `zcc-web/src/lib/supabase.ts` — Supabase client using `SUPABASE_URL` and `SUPABASE_ANON_KEY` from `import.meta.env`
3. Create auth context `zcc-web/src/contexts/AuthContext.tsx`:
   - Provides `{ user, session, signIn, signUp, signInWithGoogle, signOut, loading }`
   - Uses `supabase.auth.onAuthStateChange` listener
   - Google OAuth via `supabase.auth.signInWithOAuth({ provider: 'google' })`
4. Build pages (minimal shells — content filled in Tier 2):
   - `/login` — `zcc-web/src/pages/LoginPage.tsx` — email/password form + Google SSO button
   - `/signup` — `zcc-web/src/pages/SignupPage.tsx` — email/password form + Google SSO button
   - `/upload` — `zcc-web/src/pages/UploadPage.tsx` — placeholder
   - `/report/:id` — `zcc-web/src/pages/ReportPage.tsx` — placeholder
   - `/dashboard` — `zcc-web/src/pages/DashboardPage.tsx` — auth-gated empty state showing "No reports yet"
   - `/` — `zcc-web/src/pages/LandingPage.tsx` — marketing page with "Get Started" CTA linking to `/signup`
5. Create `ProtectedRoute` component — redirects to `/login?returnTo=...` if not authenticated
6. Set up router in `App.tsx` (keep existing dashboard/sidebar for the `/dashboard` route)
7. Add env vars to `zcc-web/.env.example`:
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   VITE_API_URL=http://localhost:4000
   ```

**Design system context (from `memory-bank/techContext.md`):**
- Primary BG: `#0d1117`, Panel BG: `#161b22`, Accent: `#58a6ff`
- Fonts: `Inter` (sans), `JetBrains Mono` (mono)
- Dark-mode-first, premium aesthetic for security professionals
- Existing CSS is in `zcc-web/src/App.css` and `zcc-web/src/index.css`

---

## Tier 2 — Core Features

> Run all three in parallel after Tier 1 is complete.

### Task 2A: Upload Flow

**Scope:** `zcc-api/src/routes/reports.ts`, `zcc-web/src/pages/UploadPage.tsx`

**Deliverables — Backend:**
1. Create `zcc-api/src/routes/reports.ts` and register at `/api/reports` in `index.ts`
2. `POST /api/reports/initiate` (auth required):
   - Body: `{ vendor_name: string }`
   - Creates report row with `status: 'pending_upload'`, `user_id` from auth
   - Generates signed upload URL for Supabase Storage: path `/uploads/{user_id}/{report_id}.pdf`, 10-min expiry
   - Returns `{ report_id, upload_url }`
3. `POST /api/reports/:id/checkout` (auth required, must own report):
   - Validates report status is `pending_upload`
   - Validates PDF exists in storage at expected path
   - Updates `pdf_storage_path` on report row
   - Updates status to `pending_payment`
   - (Does NOT create Stripe session — that's Task 2B's job. Instead, returns `{ report_id, status: 'pending_payment' }`)
   - **Interface contract with Task 2B:** This endpoint will eventually create the Stripe Checkout Session. For now, just update status. Task 2B will add Stripe logic to this endpoint.

**Deliverables — Frontend:**
1. Build `UploadPage.tsx`:
   - PDF drag-and-drop zone (accept only `.pdf`, max 50MB)
   - Vendor name text input
   - "Continue to Payment" button (disabled until both fields filled)
   - On submit: call `POST /api/reports/initiate` → upload PDF to signed URL → call `POST /api/reports/:id/checkout` → redirect to `/report/:id`
   - Loading states and error handling
2. Style to match existing design system (dark theme, accent blue)

**Existing code to reference:**
- `zcc-api/src/routes/vendors.ts` — existing route pattern
- `zcc-api/src/middleware/auth.ts` — created by Task 1A (import and use)
- `zcc-api/src/lib/supabase.ts` — created by Task 1A

---

### Task 2B: Stripe Checkout Integration

**Scope:** `zcc-api/src/routes/reports.ts` (extend), `zcc-api/src/routes/stripe.ts`, `zcc-web/src/pages/ReportPage.tsx`

**Deliverables — Backend:**
1. Install `stripe` npm package in `zcc-api/`
2. Create `zcc-api/src/lib/stripe.ts` — Stripe client using `STRIPE_SECRET_KEY`
3. Modify `POST /api/reports/:id/checkout` (from Task 2A) to also:
   - Create Stripe Checkout Session with:
     - `mode: 'payment'`
     - `line_items`: 1x "SOC 2 Report Analysis" at `STRIPE_PRICE_AMOUNT` cents
     - `success_url`: `${APP_URL}/report/${report_id}?status=success`
     - `cancel_url`: `${APP_URL}/upload`
     - `metadata: { report_id, user_id }`
   - Store `stripe_session_id` on report row
   - Return `{ checkout_url }` — frontend redirects to Stripe
4. Create `POST /webhooks/stripe` endpoint:
   - **IMPORTANT:** Must parse raw body (not JSON) for signature verification. Add `express.raw({ type: 'application/json' })` for this route BEFORE `express.json()` middleware in `index.ts`
   - Verify Stripe signature using `STRIPE_WEBHOOK_SECRET`
   - On `checkout.session.completed`: update report `status → 'processing'`, store `stripe_payment_intent_id`
   - Return 200 always

**Deliverables — Frontend:**
1. Build `ReportPage.tsx` (`/report/:id`):
   - Fetch report status from `GET /api/reports/:id`
   - Display different states:
     - `pending_upload` → "Upload in progress..."
     - `pending_payment` → "Awaiting payment" + "Pay Now" button
     - `processing` → animated spinner + "AI is analyzing your report..."
     - `ready` → success banner + "Download Report" button
     - `failed` → error message + "A refund has been issued"
   - Poll every 10s while status is `processing`

**Interface notes:**
- Task 2A creates the base `POST /api/reports/:id/checkout`. This task extends it with Stripe logic.
- Coordinate: if running in parallel, Task 2B should create the Stripe parts as a separate function that Task 2A's endpoint calls. Or: Task 2B can own the full checkout endpoint and Task 2A skips building it.

---

### Task 2C: Dashboard Page

**Scope:** `zcc-web/src/pages/DashboardPage.tsx`, `zcc-api/src/routes/reports.ts` (extend)

**Deliverables — Backend:**
1. Add `GET /api/reports` to `reports.ts` (auth required):
   - Returns all reports for the authenticated user, ordered by `created_at DESC`
   - Response fields: `id, vendor_name, status, created_at, completed_at` (no storage paths)
2. Add `GET /api/reports/:id` (auth required, must own report):
   - Returns single report object for status checking

**Deliverables — Frontend:**
1. Build full `DashboardPage.tsx`:
   - Reports table: vendor name, date submitted, status badge, actions (download/view)
   - Status badges styled per status: pending (yellow), processing (blue pulse), ready (green), failed (red)
   - "Download" button visible only when `status === 'ready'`
   - "New Report" button → navigates to `/upload`
   - Empty state: illustration + "Upload your first SOC 2 report to get started"
   - Poll `GET /api/reports` every 10s while any report has `status === 'processing'`
   - Mobile-responsive layout
2. Reuse `StatusBadge.tsx` component pattern from existing codebase (see `zcc-web/src/components/StatusBadge.tsx`)

**Existing code to reference:**
- `zcc-web/src/components/Dashboard.tsx` — existing vendor dashboard (different data model, but same design patterns)
- `zcc-web/src/components/StatusBadge.tsx` — reuse or extend for report statuses

---

## Tier 3 — Intelligence

> Starts after Tasks 2A and 2B are complete (needs upload + payment flow working).

### Task 3A: Background Worker & AI Integration

**Scope:** `zcc-api/src/services/`, `zcc-api/src/worker/`

**Deliverables:**
1. Create `zcc-api/src/worker/queue.ts` — simple in-process async job queue:
   - `enqueue(reportId: string)` — adds job
   - Processes jobs sequentially (one at a time)
   - Retries once on failure before marking as failed
2. Create `zcc-api/src/worker/processReport.ts` — the main worker function:
   - Fetch PDF from Supabase Storage using service-role key
   - Send PDF content + structured prompt to AI model endpoint (see prompt below)
   - Parse JSON response, validate with Zod schema
   - Generate .docx file using `docx` npm package (install it)
   - Upload .docx to Supabase Storage at `/reports/{user_id}/{report_id}.docx`
   - Update report: `status → 'ready'`, set `report_storage_path`, `completed_at`
   - On failure: `status → 'failed'`, set `error_message`, trigger Stripe refund, (email handled by Task 4A)
3. Create `zcc-api/src/services/docxGenerator.ts`:
   - Input: parsed AI JSON response
   - Output: .docx Buffer
   - Sections: Vendor Overview, Auditor's Opinion, Subservice Orgs, Exceptions table, CUECs table, Reviewer Attestation block
   - Header: "Generated by ZCC AI | {date} | Requires Internal Sign-Off"
   - Footer: report ID + user email
4. Create `zcc-api/src/services/aiAnalyzer.ts`:
   - Sends PDF text + prompt to `AI_MODEL_ENDPOINT` with `AI_MODEL_API_KEY`
   - Prompt (from design spec):
     ```
     You are a SOC 2 Type 2 audit expert. Analyze the attached document and return a JSON object with this exact structure:
     {
       "vendor_name": string,
       "report_type": string,
       "trust_criteria": string[],
       "audit_period_start": string (ISO date),
       "audit_period_end": string (ISO date),
       "auditor_firm": string,
       "opinion": "UNQUALIFIED" | "QUALIFIED" | "ADVERSE" | "DISCLAIMER",
       "opinion_summary": string (2-3 sentences),
       "subservice_method": "CARVE_OUT" | "INCLUSIVE" | "NONE",
       "subservice_organizations": [{ name: string, services: string }],
       "exceptions": [{
         "category": string,
         "description": string,
         "vendor_response": string,
         "ai_risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
       }],
       "cuecs": [{ "id": string, "requirement": string }]
     }
     Return only valid JSON. No markdown, no explanation.
     ```
   - Returns parsed & validated JSON
5. Add `GET /api/reports/:id/download` to reports routes (auth required, must own report):
   - Validates `status === 'ready'`
   - Generates signed URL for `report_storage_path` (5-min expiry)
   - Returns `{ download_url }`
6. Wire the webhook handler (from Task 2B) to call `queue.enqueue(reportId)` after setting status to `processing`

**Dependencies to install:** `docx`, `stripe` (if not already installed by Task 2B)

**Existing code to reference:**
- `zcc-api/src/services/llmParser.ts` — existing LLM integration pattern
- `zcc-api/src/services/riskScorer.ts` — existing scoring logic
- `zcc-api/package.json` already has `pdf-parse` and `zod`

---

## Tier 4 — Polish

> Starts after Tier 3 is complete.

### Task 4A: Email Notifications

**Scope:** `zcc-api/src/services/emailService.ts`

**Deliverables:**
1. Install email SDK (`resend` or `@sendgrid/mail` — pick one)
2. Create `zcc-api/src/services/emailService.ts` with three templates:
   - **Report Ready**: "Your SOC 2 review for {vendor_name} is ready" + link to `/report/:id`
   - **Refund Issued**: "We encountered an issue processing your report for {vendor_name}. A full refund has been issued to your card."
   - Payment receipt: verify Stripe's automatic receipts are enabled (no code needed, just document the Stripe dashboard setting)
3. Integrate into worker:
   - On success → send "Report Ready" email
   - On failure → send "Refund Issued" email
4. Emails should be plain HTML, mobile-friendly, with ZCC branding (dark theme)

---

### Task 4B: Landing Page

**Scope:** `zcc-web/src/pages/LandingPage.tsx`

**Deliverables:**
1. Build marketing landing page at `/`:
   - Hero section: headline ("SOC 2 Reviews in Minutes, Not Days"), subheading, CTA button → `/signup`
   - How it works: 3-step visual (Upload → AI Analyzes → Download Report)
   - Pricing: "$150 per report. No subscription required."
   - Trust signals: "Bank-grade security", "AI-powered analysis", "Refund guarantee"
   - Footer with links
2. Match design system (dark theme, `#0d1117` bg, `#58a6ff` accent)
3. Responsive (mobile + desktop)

---

## Dependency Graph

```
Tier 1:  [1A: DB & Auth Backend] ──┐
         [1B: Auth & Routes FE]  ──┤
                                   │
Tier 2:  [2A: Upload Flow] ────────┤ (all parallel)
         [2B: Stripe Checkout] ────┤
         [2C: Dashboard Page] ─────┤
                                   │
Tier 3:  [3A: Worker & AI] ────────┤ (needs 2A + 2B)
                                   │
Tier 4:  [4A: Email Notifications] ┤ (needs 3A)
         [4B: Landing Page] ───────┘ (independent, can run anytime after 1B)
```

> **Note:** Task 4B (Landing Page) has no real dependency on Tier 3 — it can run in parallel with Tier 2 or 3 if desired. It only needs the router from Task 1B.
