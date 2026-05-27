-- Migration: 004_watchlist_subscriptions.sql
-- Registers Dorpie users as watchlist subscribers for their area

CREATE TABLE IF NOT EXISTS watchlist_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_subs_area ON watchlist_subscriptions(area_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_subs_user ON watchlist_subscriptions(user_id);

-- Auto-subscribe all existing users
INSERT INTO watchlist_subscriptions (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE watchlist_subscriptions IS
  'Tracks which Dorpie users receive watchlist match push notifications';
