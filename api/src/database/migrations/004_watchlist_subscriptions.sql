-- 004_watchlist_subscriptions.sql
-- Auto-subscribe all existing users to watchlist alerts

CREATE TABLE IF NOT EXISTS watchlist_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    area_id UUID,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, area_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_subs_user ON watchlist_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_subs_area ON watchlist_subscriptions(area_id);

-- Auto-subscribe all existing users (NULL area = all areas)
INSERT INTO watchlist_subscriptions (user_id, area_id)
SELECT id, NULL FROM users
ON CONFLICT (user_id, area_id) DO NOTHING;
