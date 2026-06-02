-- Migration: create user_medical_profiles table
-- Dorpwag™ | Medical Profile for SOS dispatch
-- Created: 2026-06-02

CREATE TABLE IF NOT EXISTS user_medical_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  blood_type      VARCHAR(10),
  allergies       TEXT,
  medical_conditions TEXT,
  current_medications TEXT,
  doctor_name     VARCHAR(255),
  doctor_phone    VARCHAR(50),
  medical_aid_name VARCHAR(255),
  medical_aid_number VARCHAR(100),
  emergency_notes TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_medical_profiles_user_id ON user_medical_profiles(user_id);
