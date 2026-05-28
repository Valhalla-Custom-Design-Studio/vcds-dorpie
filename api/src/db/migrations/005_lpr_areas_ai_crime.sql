-- Migration 005: LPR tables + Areas
-- VCDS Holdings | Dorpwag™ | ODIN-generated | 2026-05-28

CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  town_id UUID NOT NULL REFERENCES towns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  boundary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lpr_cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  town_id UUID NOT NULL REFERENCES towns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lpr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  town_id UUID NOT NULL REFERENCES towns(id) ON DELETE CASCADE,
  camera_id UUID REFERENCES lpr_cameras(id) ON DELETE SET NULL,
  plate TEXT NOT NULL,
  confidence NUMERIC(5,2) DEFAULT 0,
  image_url TEXT,
  flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lpr_scans_town ON lpr_scans(town_id);
CREATE INDEX IF NOT EXISTS idx_lpr_scans_plate ON lpr_scans(plate);
CREATE INDEX IF NOT EXISTS idx_lpr_scans_scanned_at ON lpr_scans(scanned_at DESC);

CREATE TABLE IF NOT EXISTS lpr_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  town_id UUID NOT NULL REFERENCES towns(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  reason TEXT NOT NULL,
  added_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(town_id, plate)
);

CREATE INDEX IF NOT EXISTS idx_lpr_watchlist_town_plate ON lpr_watchlist(town_id, plate);

CREATE TABLE IF NOT EXISTS lpr_community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  town_id UUID NOT NULL REFERENCES towns(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES lpr_scans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Crime predictions cache
CREATE TABLE IF NOT EXISTS ai_crime_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  town_id UUID NOT NULL REFERENCES towns(id) ON DELETE CASCADE,
  prediction_date DATE NOT NULL,
  hotspot_geojson JSONB,
  risk_level TEXT CHECK (risk_level IN ('low','medium','high','critical')),
  crime_types JSONB,
  confidence NUMERIC(5,2),
  model_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(town_id, prediction_date)
);
