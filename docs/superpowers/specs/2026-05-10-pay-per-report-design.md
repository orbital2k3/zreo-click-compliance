# ZCC Pay-Per-Report: Design Spec
**Date:** 2026-05-10
**Status:** Approved for implementation

---

## 1. Product Overview

Zero Click Compliance (ZCC) adds a **$150 per report** pay-per-process model. Small regulated companies (regional healthcare clinics, CPA firms, community banks, boutique law firms) are priced out of enterprise TPRM platforms ($10k–$30k/yr). ZCC fills this gap with a self-serve, transactional model that requires no annual commitment.

**Core user journey:**
1. User creates an account or signs in
2. Uploads a vendor's SOC 2 PDF
3. Pays $150 via Stripe Checkout
4. AI processes the document asynchronously (Azure or AWS hosted model)
5. User receives email when ready; downloads generated Word report
6. All past reports accessible from dashboard indefinitely

---

## 2. Architecture

```
User Browser (React/Vite/TypeScript)
      │
      ├── Supabase Auth  (email/password + Google OAuth)
      │
      └── zcc-api (Node/TypeScript)
            ├── POST /reports/initiate       → create pending report, return signed upload URL
            ├── POST /reports/:id/checkout   → create Stripe Checkout session
            ├── POST /webhooks/stripe        → payment_intent.succeeded → enqueue job
            ├── GET  /reports/:id/download   → verify ownership → return signed URL
            └── Background worker
                      └── fetch PDF from Supabase Storage
                      └── POST to Azure/AWS AI model (PDF + structured prompt)
                      └── parse JSON response → generate Word document
                      └── store Word doc in Supabase Storage
                      └── update report status → 'ready'
                      └── email user

Supabase
  ├── Auth (managed)
  ├── reports table
  └── Storage
        ├── /uploads/{user_id}/{report_id}.pdf     (private)
        └── /reports/{user_id}/{report_id}.docx    (private)
```

**Security invariants:**
- Stripe webhook is the sole source of truth for payment — frontend never self-reports success
- All storage is private; files served only via short-lived signed URLs (5-min expiry)
- Row Level Security on `reports` table: users can only read/write their own rows
- Stripe webhook signature verified on every request

---

## 3. Data Model

```sql
-- Supabase: reports table
CREATE TABLE reports (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_name               text NOT NULL,
  status                    text NOT NULL DEFAULT 'pending_upload',
  stripe_session_id         text,
  stripe_payment_intent_id  text,
  pdf_storage_path          text,   -- /uploads/{user_id}/{report_id}.pdf
  report_storage_path       text,   -- /reports/{user_id}/{report_id}.docx
  error_message             text,   -- populated on failure
  created_at                timestamptz NOT NULL DEFAULT now(),
  completed_at              timestamptz
);

-- Status lifecycle:
-- pending_upload → pending_payment → processing → ready | failed
-- Transition trigger:
--   pending_upload → pending_payment : POST /reports/:id/checkout (validates PDF exists in storage)
--   pending_payment → processing     : Stripe webhook (checkout.session.completed)
--   processing → ready               : background worker on success
--   processing → failed              : background worker on error

-- Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their reports"
  ON reports FOR ALL
  USING (auth.uid() = user_id);

-- Index for dashboard query
CREATE INDEX reports_user_id_created_at ON reports(user_id, created_at DESC);
```

---

## 4. API Endpoints

### POST /reports/initiate
**Auth:** Required
**Body:** `{ vendor_name: string }`
**Action:** Creates report row with status `pending_upload`. Returns a signed Supabase Storage upload URL (10-min expiry) for direct browser-to-storage upload.
**Response:** `{ report_id, upload_url }`

### POST /reports/:id/checkout
**Auth:** Required (must own report)
**Action:** Validates report is in `pending_upload` status and that the PDF file exists in Supabase Storage (guards against calls before upload completes). Updates status to `pending_payment`. Creates a Stripe Checkout Session for $150 one-time payment. Sets `success_url` to `/report/:id?status=success`, `cancel_url` to `/upload`.
**Response:** `{ checkout_url }` — frontend redirects

### POST /webhooks/stripe
**Auth:** Stripe signature header (no user auth)
**Action:** Verifies signature. On `checkout.session.completed`: updates report status to `processing`, stores `stripe_session_id` and `stripe_payment_intent_id`, enqueues background job.
**Response:** `200 OK` always (Stripe retries on non-200)

### GET /reports/:id/download
**Auth:** Required (must own report)
**Action:** Validates report status is `ready`. Generates a fresh signed URL for `report_storage_path` (5-min expiry).
**Response:** `{ download_url }`

### GET /reports (dashboard)
**Auth:** Required
**Action:** Returns all reports for the authenticated user, ordered by `created_at DESC`.
**Response:** Array of report objects (no storage paths exposed)

---

## 5. Background Worker

Triggered by Stripe webhook. Runs as a separate async process (can be a simple in-process queue for MVP, upgradeable to a dedicated queue like BullMQ later).

**Steps:**
1. Fetch PDF from Supabase Storage using service-role key
2. Send to Azure/AWS AI model with the structured TPRM prompt (see Section 6)
3. Parse structured JSON response
4. Generate Word document (.docx) matching the sample report format
5. Upload .docx to Supabase Storage at `/reports/{user_id}/{report_id}.docx`
6. Update report: `status → 'ready'`, `report_storage_path`, `completed_at`
7. Send email to user: "Your SOC 2 review for {vendor_name} is ready"

**On failure:**
1. Update report: `status → 'failed'`, `error_message`
2. Trigger Stripe refund via API (`stripe.refunds.create({ payment_intent: ... })`)
3. Email user with apology and refund confirmation

---

## 6. AI Prompt Structure

The worker sends the following to the AI model:

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
  "cuecs": [{
    "id": string,
    "requirement": string
  }]
}

Return only valid JSON. No markdown, no explanation.
```

---

## 7. Generated Report Format

Output is a Word document (.docx) matching this structure:

1. **Vendor Overview & Audit Scope** — name, report type, trust criteria, audit period, auditor firm
2. **Auditor's Opinion & Reliability** — opinion badge + AI summary
3. **Subservice Organizations (Fourth-Party Risk)** — methodology + action required if carve-out
4. **Exceptions & Deviations** — table per exception with risk level and vendor response
5. **CUECs** — table with Internal Owner and Sign-Off columns (blank, for the client to fill)
6. **Internal Reviewer Attestation** — signature block

Header includes: "Generated by ZCC AI | {date} | Requires Internal Sign-Off"
Footer includes: report ID and user's email for audit trail.

---

## 8. Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page with "Get Started" CTA |
| `/login` | Sign in: email/password + Google SSO button |
| `/signup` | Create account: email/password + Google SSO button |
| `/upload` | Upload PDF + enter vendor name; requires auth |
| `/report/:id` | Single report status page; shows processing state or download button |
| `/dashboard` | All reports table with status badges and download actions |

**Dashboard status polling:** While any report is `processing`, the dashboard polls `GET /reports` every 10 seconds and updates status badges without full page reload.

---

## 9. Implementation Phases

Phases are designed for parallel agent execution. Phases within the same tier can run concurrently.

### Tier 1 — Foundation (sequential, everything depends on this)

**Phase 1: Auth & Database Setup**
- Supabase Auth: enable email/password and Google OAuth provider
- Create `reports` table with RLS policies and index
- Add Supabase client config to both `zcc-web` and `zcc-api`
- Build `/login` and `/signup` pages (email/password form + Google SSO button)
- Implement protected route wrapper; redirect to `/login` with return URL
- Build minimal `/dashboard` shell (auth-gated, empty state)

---

### Tier 2 — Core Features (run in parallel after Tier 1)

**Phase 2A: Upload Flow**
- Build `/upload` page: PDF drag-and-drop + vendor name input + "Continue to Payment" button
- `POST /reports/initiate` endpoint
- Direct browser-to-Supabase Storage upload using signed URL
- Update report status to `pending_payment` after upload completes
- Redirect to `/report/:id` showing "Awaiting payment" state

**Phase 2B: Stripe Checkout Integration**
- Stripe account setup, API keys in environment variables
- `POST /reports/:id/checkout` endpoint (creates Checkout Session)
- `POST /webhooks/stripe` endpoint with signature verification
- On success: update report to `processing`, log payment IDs
- `/report/:id` page: shows correct state for each status (pending/processing/ready/failed)
- Stripe test mode end-to-end test with test card

**Phase 2C: Dashboard UI**
- Full `/dashboard` page: reports table with vendor name, date, status badge, download button
- `GET /reports` endpoint
- Status polling (10s interval) while any report is `processing`
- Empty state (no reports yet)
- Mobile-responsive layout

---

### Tier 3 — Intelligence (after Phase 2A and 2B complete)

**Phase 3: Background Worker & AI Integration**
- In-process job queue (simple async queue for MVP)
- Worker: fetch PDF from storage → call AI model → parse JSON response
- .docx generation from parsed JSON (use `docx` npm package)
- Store generated report in Supabase Storage
- Update report to `ready` with `report_storage_path` and `completed_at`
- `GET /reports/:id/download` endpoint (ownership check + signed URL)
- Failure handling: set `failed` status, trigger Stripe refund, email user

---

### Tier 4 — Polish (after Tier 3)

**Phase 4: Email Notifications**
- "Report ready" email with direct link to `/report/:id`
- Payment confirmation email (Stripe handles receipt automatically — just verify it's enabled)
- "Refund issued" email on failure
- Use Resend or SendGrid (whichever is already in the stack)

---

## 10. Environment Variables Required

```
# Supabase
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_AMOUNT=15000  # cents

# AI Model (Azure or AWS — TBD)
AI_MODEL_ENDPOINT
AI_MODEL_API_KEY

# Email
EMAIL_API_KEY
EMAIL_FROM_ADDRESS

# App
APP_URL  # for Stripe redirect URLs
```

---

## 11. Out of Scope (MVP)

- Bulk pricing / credit wallet
- Embedded Stripe Payment Element
- Team accounts / multi-user orgs
- Custom branding on generated reports
- AI model selection (locked to one provider at launch)
- Webhook retry dead-letter queue (simple retry on failure is sufficient for MVP)
