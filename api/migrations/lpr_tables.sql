-- Dorpwag™ LPR Tables Migration
-- Run: psql $DATABASE_URL -f migrations/lpr_tables.sql

CREATE TABLE IF NOT EXISTS lpr_cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  port INTEGER DEFAULT 80,
  username VARCHAR(100),
  password VARCHAR(255),
  location VARCHAR(200),
  source VARCHAR(20) DEFAULT 'hikvision', -- hikvision | snipr | manual
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lpr_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL,
  camera_id UUID REFERENCES lpr_cameras(id),
  plate VARCHAR(20) NOT NULL,
  confidence DECIMAL(5,2),
  source VARCHAR(20) DEFAULT 'hikvision',
  location VARCHAR(200),
  is_watchlisted BOOLEAN DEFAULT false,
  watchlist_reason TEXT,
  scanned_by UUID,
  image_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lpr_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL,
  plate VARCHAR(20) NOT NULL,
  reason TEXT,
  added_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, plate)
);

CREATE TABLE IF NOT EXISTS resident_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL,
  user_id UUID NOT NULL,
  plate VARCHAR(20) NOT NULL,
  make VARCHAR(50),
  model VARCHAR(50),
  color VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, plate)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lpr_events_community ON lpr_events(community_id);
CREATE INDEX IF NOT EXISTS idx_lpr_events_plate ON lpr_events(plate);
CREATE INDEX IF NOT EXISTS idx_lpr_events_timestamp ON lpr_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lpr_watchlist_plate ON lpr_watchlist(community_id, plate);
