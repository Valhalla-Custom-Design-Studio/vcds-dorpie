-- Migration 008: Complete Dorpwag™ feature tables
-- Dead man switch escalation tracking, LPR community reports, notification log

-- Add escalation columns to guardian_sessions if not exists
ALTER TABLE guardian_sessions 
  ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escalation_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_escalation_at TIMESTAMPTZ;

-- LPR community reports
CREATE TABLE IF NOT EXISTS lpr_community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate VARCHAR(20) NOT NULL,
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  location TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lpr_community_reports_plate ON lpr_community_reports(plate);

-- LPR scans (from camera or mobile)
CREATE TABLE IF NOT EXISTS lpr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate VARCHAR(20) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  camera_id VARCHAR(100),
  camera_name VARCHAR(200),
  location TEXT,
  flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  confidence FLOAT DEFAULT 0,
  image_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_lpr_scans_plate ON lpr_scans(plate);
CREATE INDEX IF NOT EXISTS idx_lpr_scans_timestamp ON lpr_scans(timestamp DESC);

-- LPR watchlist
CREATE TABLE IF NOT EXISTS lpr_watchlist (
  plate VARCHAR(20) PRIMARY KEY,
  reason TEXT NOT NULL,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification log
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT,
  type VARCHAR(100),
  target_app VARCHAR(100) DEFAULT 'dorpwag',
  status VARCHAR(50) DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(type, created_at DESC);

-- Push tokens (cross-app)
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  app_name VARCHAR(100) DEFAULT 'dorpwag',
  platform VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

-- SOS trusted contacts
CREATE TABLE IF NOT EXISTS sos_trusted_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(200),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sos_contacts_user ON sos_trusted_contacts(user_id);

-- Movement patterns
CREATE TABLE IF NOT EXISTS movement_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expected_hour INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  expected_status VARCHAR(100),
  sample_count INTEGER DEFAULT 1,
  confidence_score FLOAT DEFAULT 0.1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, expected_hour, day_of_week)
);

-- Movement checkins
CREATE TABLE IF NOT EXISTS movement_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lat FLOAT,
  lng FLOAT,
  status VARCHAR(100),
  is_safe BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_movement_checkins_user ON movement_checkins(user_id, created_at DESC);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'ZAR',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(100),
  reference VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(100) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id)
);
