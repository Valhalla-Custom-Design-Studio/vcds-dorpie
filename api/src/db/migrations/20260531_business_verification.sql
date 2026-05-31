-- Migration: Business Verification & Owner Claim System
-- Run: 2026-05-31

-- Add verification fields to businesses table
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS verification_badge TEXT DEFAULT 'none', -- 'none' | 'verified' | 'premium_partner'
  ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'unclaimed', -- 'unclaimed' | 'pending' | 'approved' | 'rejected'
  ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Owner claim requests table
CREATE TABLE IF NOT EXISTS business_claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  proof_document_url TEXT,
  proof_type TEXT, -- 'cipc', 'utility_bill', 'lease', 'other'
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  UNIQUE(business_id, user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_claim_requests_business ON business_claim_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_user ON business_claim_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON business_claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_businesses_verified ON businesses(is_verified);
CREATE INDEX IF NOT EXISTS idx_businesses_claim_status ON businesses(claim_status);
