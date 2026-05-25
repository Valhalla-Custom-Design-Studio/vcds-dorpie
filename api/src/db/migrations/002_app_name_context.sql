-- Migration: 002_app_name_context.sql
-- Adds appName context to key tables for multi-app architecture
-- ODIN™ | VCDS™ | 2026-05-23

-- push_tokens: track which app registered the token
ALTER TABLE push_tokens
  ADD COLUMN IF NOT EXISTS app_name VARCHAR(50) DEFAULT 'dorpwag';

-- users: track which apps a user is registered on
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS registered_apps TEXT[] DEFAULT ARRAY['dorpwag'];

-- sos_events: track which app triggered the SOS
ALTER TABLE sos_events
  ADD COLUMN IF NOT EXISTS source_app VARCHAR(50) DEFAULT 'dorpwag';

-- notification_log: create table if not exists, with target_app
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255),
  body TEXT,
  type VARCHAR(50),
  target_app VARCHAR(50),
  push_token TEXT,
  status VARCHAR(20) DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_app ON notification_log(target_app);
CREATE INDEX IF NOT EXISTS idx_notification_log_created ON notification_log(created_at DESC);
