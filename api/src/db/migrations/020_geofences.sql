-- Geofences table
CREATE TABLE IF NOT EXISTS geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radius INTEGER NOT NULL DEFAULT 200,
  active BOOLEAN NOT NULL DEFAULT true,
  notify_on_exit BOOLEAN NOT NULL DEFAULT true,
  notify_on_enter BOOLEAN NOT NULL DEFAULT false,
  linked_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  linked_user_name TEXT,
  last_inside BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_geofences_user ON geofences(user_id);
CREATE INDEX IF NOT EXISTS idx_geofences_linked ON geofences(linked_user_id);
