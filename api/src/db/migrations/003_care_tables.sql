-- Migration: 003_care_tables.sql
-- Ouma en Oppas™ care-specific tables for Option A shared backend
-- ODIN™ | VCDS™ | 2026-05-23

-- Care schedules (Ouma en Oppas™)
CREATE TABLE IF NOT EXISTS care_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caregiver_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  recurrence VARCHAR(50),  -- 'daily', 'weekly', 'monthly', null
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_care_schedules_elder ON care_schedules(elder_user_id);
CREATE INDEX IF NOT EXISTS idx_care_schedules_caregiver ON care_schedules(caregiver_user_id);
CREATE INDEX IF NOT EXISTS idx_care_schedules_scheduled ON care_schedules(scheduled_at);

-- Medications (Ouma en Oppas™)
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(50) NOT NULL,  -- 'daily', 'twice_daily', 'weekly', etc.
  times TEXT[] DEFAULT ARRAY[]::TEXT[],  -- ['08:00', '20:00']
  notes TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medications_elder ON medications(elder_user_id);

-- Fall events (Ouma en Oppas™ — links to sos_events)
CREATE TABLE IF NOT EXISTS fall_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sos_event_id UUID REFERENCES sos_events(id) ON DELETE SET NULL,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  confidence INTEGER,  -- 0-100 detection confidence
  device_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fall_events_user ON fall_events(user_id);

-- Daily check-ins (Ouma en Oppas™)
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood VARCHAR(20) DEFAULT 'good',  -- 'good', 'okay', 'bad'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(DATE(created_at));
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, DATE(created_at));
