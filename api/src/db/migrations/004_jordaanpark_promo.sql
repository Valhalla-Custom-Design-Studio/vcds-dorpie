-- Migration: Jordaanpark town + promo code redemptions table
-- Run on Dorpwag database

-- Add Jordaanpark as a town (Gauteng)
INSERT INTO towns (name, province, lat, lng)
VALUES ('Jordaanpark', 'Gauteng', -26.5167, 28.3667)
ON CONFLICT (name) DO NOTHING;

-- Create promo code redemptions table
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  town_id     UUID REFERENCES towns(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, code)
);

CREATE INDEX IF NOT EXISTS idx_promo_redemptions_code ON promo_code_redemptions(code);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_code_redemptions(user_id);
