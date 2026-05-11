-- Zero Click Compliance (ZCC) Pay-Per-Report Feature Schema

-- 1. Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'pending_upload', 'pending_payment', 'processing', 'completed', 'failed'
  
  -- Stripe Fields
  stripe_payment_id TEXT,
  stripe_price_id TEXT NOT NULL, -- Link to Stripe price
  amount_cents INTEGER NOT NULL, -- Price in cents (e.g., 4900 for $49.00)
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'paid', 'refunded'
  
  -- Storage Paths
  pdf_storage_path TEXT, -- Path in Supabase Storage 'reports' bucket
  report_storage_path TEXT, -- Alternative/additional storage path
  
  -- Report Details
  report_data JSONB, -- Structured report data (findings, scores, etc.)
  error_message TEXT, -- If status = 'failed'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ -- For temporary reports
);

-- Indices for performance
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_vendor ON reports(vendor_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_payment_status ON reports(payment_status);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own reports
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert reports (must be their own user_id)
CREATE POLICY "Users can create their own reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own reports
CREATE POLICY "Users can update their own reports"
  ON reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow service role (API) to perform all operations for backend processing
CREATE POLICY "Service role has full access"
  ON reports FOR ALL
  USING (auth.role() = 'service_role');
