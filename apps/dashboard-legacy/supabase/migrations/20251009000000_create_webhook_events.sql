-- Create webhook_events table for idempotency protection
-- This table tracks processed Stripe webhook events to prevent duplicate processing

CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  processed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Index for fast lookups by stripe_event_id (used in idempotency check)
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id
  ON webhook_events(stripe_event_id);

-- Index for cleanup queries (finding old events to delete)
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at
  ON webhook_events(processed_at DESC);

-- Enable Row Level Security
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (webhooks use service role)
CREATE POLICY "Service role full access on webhook_events"
  ON webhook_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add table comment for documentation
COMMENT ON TABLE webhook_events IS 'Tracks processed Stripe webhook events to prevent duplicate processing. Each event is recorded once, preventing race conditions and duplicate updates.';
COMMENT ON COLUMN webhook_events.stripe_event_id IS 'Unique Stripe event ID (e.g., evt_xxx). UNIQUE constraint enforces idempotency at database level.';
COMMENT ON COLUMN webhook_events.processed_at IS 'Timestamp when event was successfully processed';

-- Optional: Function to cleanup old webhook events (keeps last 90 days)
-- Can be called manually or via scheduled job
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM webhook_events
  WHERE processed_at < now() - interval '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_webhook_events IS 'Deletes webhook events older than 90 days. Returns count of deleted rows. Run periodically to prevent table bloat.';
