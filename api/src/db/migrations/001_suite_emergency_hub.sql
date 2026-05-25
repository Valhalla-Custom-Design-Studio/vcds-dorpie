-- ═══════════════════════════════════════════════════════════════════════════
-- Die Afrikaanse Suite™ — Emergency Hub Schema (Phase 1: Shared PostgreSQL)
-- ODIN™ | VCDS™ | 2026
-- Migration: 001_suite_emergency_hub.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── SUITE IDENTITY ──────────────────────────────────────────────────────────
-- Universal identity across all Suite apps
CREATE TABLE IF NOT EXISTS suite_users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(100) NOT NULL,
  phone           VARCHAR(20),
  phone_verified  BOOLEAN DEFAULT false,
  province        VARCHAR(50),
  preferred_locale VARCHAR(5) DEFAULT 'af',
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suite_users_email ON suite_users(email);
CREATE INDEX IF NOT EXISTS idx_suite_users_phone ON suite_users(phone);

-- App membership — one Suite user, many app profiles
CREATE TABLE IF NOT EXISTS suite_app_memberships (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suite_user_id   UUID NOT NULL REFERENCES suite_users(id) ON DELETE CASCADE,
  app_name        VARCHAR(50) NOT NULL, -- dorpwag | ouma_en_oppas | oppas | veekos | plaasboek | fitness_fuel | vleiskraft
  app_user_id     VARCHAR(255) NOT NULL, -- local user ID in that app's DB
  role            VARCHAR(50) DEFAULT 'user', -- resident | caregiver | admin | guardian | family
  is_active       BOOLEAN DEFAULT true,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(suite_user_id, app_name)
);
CREATE INDEX IF NOT EXISTS idx_suite_memberships_user ON suite_app_memberships(suite_user_id);
CREATE INDEX IF NOT EXISTS idx_suite_memberships_app ON suite_app_memberships(app_name, app_user_id);

-- ─── PUSH TOKEN REGISTRY ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suite_push_tokens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suite_user_id   UUID NOT NULL REFERENCES suite_users(id) ON DELETE CASCADE,
  app_name        VARCHAR(50) NOT NULL,
  token           VARCHAR(500) UNIQUE NOT NULL, -- Expo push token
  device_type     VARCHAR(10) DEFAULT 'android', -- ios | android
  is_active       BOOLEAN DEFAULT true,
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suite_push_tokens_user ON suite_push_tokens(suite_user_id);

-- ─── EMERGENCY CONTACT GRAPH ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suite_emergency_links (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id    UUID NOT NULL REFERENCES suite_users(id) ON DELETE CASCADE, -- person being protected
  to_user_id      UUID NOT NULL REFERENCES suite_users(id) ON DELETE CASCADE, -- person who gets notified
  relationship    VARCHAR(50) NOT NULL, -- family | caregiver | neighbour | patrol | guardian
  source_app      VARCHAR(50) NOT NULL, -- which app created this link
  notify_via_apps TEXT[] DEFAULT ARRAY['all'], -- which apps deliver the notification
  priority        INT DEFAULT 2, -- 1=first responder, 2=family, 3=community
  is_active       BOOLEAN DEFAULT true,
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);
CREATE INDEX IF NOT EXISTS idx_suite_links_from ON suite_emergency_links(from_user_id);
CREATE INDEX IF NOT EXISTS idx_suite_links_to ON suite_emergency_links(to_user_id);

-- Link requests (pending approval)
CREATE TABLE IF NOT EXISTS suite_link_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id    UUID NOT NULL REFERENCES suite_users(id) ON DELETE CASCADE,
  to_user_id      UUID NOT NULL REFERENCES suite_users(id) ON DELETE CASCADE,
  relationship    VARCHAR(50) NOT NULL,
  bidirectional   BOOLEAN DEFAULT true,
  status          VARCHAR(20) DEFAULT 'pending', -- pending | approved | rejected
  message         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  responded_at    TIMESTAMPTZ
);

-- ─── EMERGENCY ALERTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suite_alerts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suite_user_id   UUID NOT NULL REFERENCES suite_users(id),
  source_app      VARCHAR(50) NOT NULL,
  category        VARCHAR(50) NOT NULL,
  -- break_in | fire | medical | fall_detected | panic | sos_silent |
  -- movement_anomaly | deadman_expired | guardian_lost | medication_missed |
  -- wandering_alert | inactivity_alarm | panic_button | geofence_breach
  severity        VARCHAR(20) NOT NULL DEFAULT 'high', -- critical | high | medium | low
  trigger_method  VARCHAR(50), -- shake | phantom_pin | manual | fall_sensor | inactivity | deadman
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  address         TEXT,
  town_name       VARCHAR(100),
  message         TEXT,
  metadata        JSONB DEFAULT '{}',
  status          VARCHAR(20) DEFAULT 'active', -- active | resolved | false_alarm | escalated
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES suite_users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suite_alerts_user ON suite_alerts(suite_user_id);
CREATE INDEX IF NOT EXISTS idx_suite_alerts_status ON suite_alerts(status);
CREATE INDEX IF NOT EXISTS idx_suite_alerts_created ON suite_alerts(created_at DESC);

-- Dispatch log — who was notified, via which channel
CREATE TABLE IF NOT EXISTS suite_alert_dispatches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suite_alert_id  UUID NOT NULL REFERENCES suite_alerts(id) ON DELETE CASCADE,
  recipient_id    UUID NOT NULL REFERENCES suite_users(id),
  app_name        VARCHAR(50) NOT NULL,
  channel         VARCHAR(50), -- dorpwag-emergency | oppas-emergency | sms | whatsapp
  push_token      VARCHAR(500),
  phone           VARCHAR(20),
  priority        INT DEFAULT 2,
  status          VARCHAR(20) DEFAULT 'pending', -- pending | sent | delivered | failed
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  error           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dispatches_alert ON suite_alert_dispatches(suite_alert_id);

-- Responses — who acknowledged/responded
CREATE TABLE IF NOT EXISTS suite_alert_responses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suite_alert_id  UUID NOT NULL REFERENCES suite_alerts(id) ON DELETE CASCADE,
  responder_id    UUID NOT NULL REFERENCES suite_users(id),
  response_app    VARCHAR(50) NOT NULL,
  response        VARCHAR(30) NOT NULL, -- responding | acknowledged | false_alarm
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
