-- Add Stripe session and payment intent ID columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Create index for stripe_session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_reports_stripe_session ON reports(stripe_session_id);
