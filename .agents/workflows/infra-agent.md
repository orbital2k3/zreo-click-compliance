---
description: Infrastructure agent task for ZCC backend setup
---

# ZCC Infrastructure Agent Task

## Agent: `infra-agent`
## Task: Core Application Infrastructure — MVP Backend

You are an expert backend/infrastructure developer working on **Zero Click Compliance (ZCC)**, an autonomous SOC 2 vendor risk management platform. Your job is to set up the full backend infrastructure for the MVP.

---

## Read First
Before starting, read the memory bank files in order:
1. `memory-bank/projectbrief.md`
2. `memory-bank/productContext.md`
3. `memory-bank/systemContext.md`
4. `memory-bank/techContext.md`

---

## Your Mission

Build the backend infrastructure in `c:\Users\bogda\Code\zero-click-compliance\` alongside the existing `zcc-web` frontend. **Do not modify the frontend.**

### Step 1: Initialize the Backend Project
Create a new `zcc-api` folder with:
- Node.js + TypeScript + Express (or Hono for a lighter feel)
- `package.json`, `tsconfig.json`, `src/index.ts`
- A `.env.example` with all required environment variable keys

### Step 2: Supabase Setup
- Create a `supabase/` directory with migration SQL files for these tables:
  - `vendors` — id, name, email, status, created_at, auto_assess, user_id
  - `assessments` — id, vendor_id, year, date, period_covered, expires_at, status, exceptions, notes, report_name, report_url
  - `agent_logs` — id, vendor_id, timestamp, type, message, session_id
- Write a `README.md` in `supabase/` with setup instructions.

### Step 3: Email Webhook Endpoint
- `POST /webhooks/email-inbound` — receives vendor reply (Postmark/SendGrid inbound webhook format), extracts PDF attachment, stores it in Supabase Storage, and triggers the parser pipeline.

### Step 4: REST API Endpoints
- `GET /vendors` — list all vendors
- `POST /vendors` — create a vendor and trigger the outreach agent
- `GET /vendors/:id/assessments` — get full history
- `POST /vendors/:id/upload` — accept a manually uploaded PDF and trigger the parser pipeline

### Step 5: LLM Parser Service
In `src/services/llmParser.ts`:
- Accept a PDF buffer
- Extract text (use `pdf-parse` library)
- Call **Google Gemini API** with a structured prompt to:
  - Classify the auditor's opinion (UNQUALIFIED, QUALIFIED, ADVERSE)
  - Extract a list of exceptions/deficiencies (array of control id + description)
- Return a typed `ParseResult` object

### Step 6: Risk Scorer Service
In `src/services/riskScorer.ts`:
- Accept a `ParseResult`
- Apply a ruleset:
  - `UNQUALIFIED` + 0 exceptions → score 95–100, verdict `APPROVED`
  - `UNQUALIFIED` + 1-3 exceptions → score 70–85, verdict `FLAGGED`
  - `QUALIFIED` or more → score < 70, verdict `FLAGGED`
- Return `{ score, verdict }` typed

---

## Constraints
- Keep it simple and focused — this is MVP scope.
- Leave TODO comments where real API keys are needed.
- All TypeScript should be strict.
- Write a brief `AGENT_LOG.md` in `zcc-api/` summarizing what you built and any decisions made.

## Update Memory Bank When Done
Update:
- `memory-bank/progress.md` — mark "Backend Infrastructure" as completed ✅
- `memory-bank/activeContext.md` — set the next focus to "Frontend ↔ Backend Integration"
