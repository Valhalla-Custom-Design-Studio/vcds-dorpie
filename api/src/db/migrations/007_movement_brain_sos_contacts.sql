-- Migration 007: Movement Brain + SOS Contacts + Guardian Ping Interval
-- VCDS™ Dorpwag™ | ODIN™ 2026

-- Movement patterns table (7-day learning engine)
CREATE TABLE IF NOT EXISTS movement_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expected_hour INTEGER NOT NULL CHECK (expected_hour >= 0 AND expected_hour <= 23),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  expected_status VARCHAR(50) NOT NULL DEFAULT 'Safe',
  sample_count INTEGER DEFAULT 0,
  confidence_score DECIMAL(4,3) DEFAULT 0.0,
  last_anomaly_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, expected_hour, day_of_week)
);
CREATE INDEX IF NOT EXISTS idx_movement_patterns_user ON movement_patterns(user_id);

-- SOS trusted contacts (user-managed emergency contacts)
CREATE TABLE IF NOT EXISTS sos_trusted_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sos_contacts_user ON sos_trusted_contacts(user_id);

-- Add ping_interval_minutes + escalation tracking to guardian_sessions
ALTER TABLE guardian_sessions
  ADD COLUMN IF NOT EXISTS ping_interval_minutes INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS last_escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalation_count INTEGER DEFAULT 0;

-- Add LPR camera scan table (if not exists from migration 005)
-- lpr_scans table already created in 005_lpr_areas_ai_crime.sql
-- Indexes already exist; skipping duplicate CREATE TABLE and index

-- LPR watchlist
CREATE TABLE IF NOT EXISTS lpr_watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate VARCHAR(20) UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  added_by UUID REFERENCES users(id),
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- LPR community reports
CREATE TABLE IF NOT EXISTS lpr_community_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate VARCHAR(20) NOT NULL,
  reported_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HOA members table
CREATE TABLE IF NOT EXISTS hoa_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  town_id UUID NOT NULL REFERENCES towns(id),
  role VARCHAR(50) DEFAULT 'member',
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, town_id)
);
CREATE INDEX IF NOT EXISTS idx_hoa_members_town ON hoa_members(town_id);

-- AI learning log (tracks what the AI has learned per user)
CREATE TABLE IF NOT EXISTS ai_learning_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  app_name VARCHAR(50) DEFAULT 'dorpwag',
  model_type VARCHAR(50) NOT NULL,
  input_data JSONB,
  output_data JSONB,
  confidence DECIMAL(5,3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_log_user ON ai_learning_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_log_app ON ai_learning_log(app_name);
