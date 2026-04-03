-- Zero Click Compliance (ZCC) Initial Schema

-- 1. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'awaiting_soc_2',
  auto_assess BOOLEAN DEFAULT TRUE,
  user_id UUID, -- For future multi-tenancy
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  year TEXT NOT NULL,
  date DATE NOT NULL,
  period_covered TEXT,
  expires_at DATE,
  status TEXT NOT NULL, -- 'approved', 'flagged'
  exceptions INTEGER DEFAULT 0,
  notes TEXT,
  report_name TEXT,
  report_url TEXT, -- Link to Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Agent Logs Table
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL, -- 'OUTREACH', 'PARSER', 'SCORING', 'MEMORY'
  message TEXT NOT NULL,
  session_id TEXT NOT NULL
);

-- Indices for performance
CREATE INDEX idx_assessments_vendor ON assessments(vendor_id);
CREATE INDEX idx_logs_vendor ON agent_logs(vendor_id);
CREATE INDEX idx_logs_session ON agent_logs(session_id);
