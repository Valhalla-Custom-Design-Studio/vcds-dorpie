-- Dorpwag™ — Complete Database Schema v2.1
-- 26 tables | ODIN™ | VCDS™ 2026
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ─── CORE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS towns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  province VARCHAR(50) NOT NULL,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, province)
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(30) DEFAULT 'resident',
  town_id UUID REFERENCES towns(id),
  profile_photo_id UUID,
  subscription_tier VARCHAR(20) DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  payfast_subscription_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_town ON users(town_id);

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  cloud_storage_path TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  content_type VARCHAR(100),
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  device_type VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notices BOOLEAN DEFAULT true,
  emergencies BOOLEAN DEFAULT true,
  events BOOLEAN DEFAULT true,
  messages BOOLEAN DEFAULT true,
  sos_alerts BOOLEAN DEFAULT true,
  patrol_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTICES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'General',
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  town_id UUID NOT NULL REFERENCES towns(id),
  is_pinned BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notices_town ON notices(town_id);
CREATE INDEX IF NOT EXISTS idx_notices_created ON notices(created_at DESC);

CREATE TABLE IF NOT EXISTS notice_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notice_id, user_id)
);

CREATE TABLE IF NOT EXISTS notice_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MARKETPLACE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  category VARCHAR(50) DEFAULT 'Other',
  condition VARCHAR(20) DEFAULT 'Good',
  status VARCHAR(20) DEFAULT 'active',
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  town_id UUID NOT NULL REFERENCES towns(id),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listings_town ON listings(town_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0
);

-- ─── BUSINESSES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  address TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  town_id UUID NOT NULL REFERENCES towns(id),
  logo_file_id UUID REFERENCES files(id),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_businesses_town ON businesses(town_id);

CREATE TABLE IF NOT EXISTS business_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- ─── EVENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'General',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  town_id UUID NOT NULL REFERENCES towns(id),
  max_attendees INTEGER,
  is_free BOOLEAN DEFAULT true,
  ticket_price DECIMAL(10,2),
  cover_file_id UUID REFERENCES files(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_town ON events(town_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_at);

CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'going',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ─── COMMUNITY TOPICS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'General',
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  town_id UUID NOT NULL REFERENCES towns(id),
  is_pinned BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_topics_town ON topics(town_id);

CREATE TABLE IF NOT EXISTS topic_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topic_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(topic_id, user_id)
);

-- ─── MESSAGES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_a, participant_b)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at DESC);

-- ─── SAFETY ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'Other',
  severity VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  town_id UUID NOT NULL REFERENCES towns(id),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incidents_town ON incidents(town_id);

CREATE TABLE IF NOT EXISTS incident_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS patrols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  town_id UUID NOT NULL REFERENCES towns(id),
  status VARCHAR(20) DEFAULT 'active',
  schedule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patrol_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patrol_id UUID NOT NULL REFERENCES patrols(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patrol_id, user_id)
);

CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'high',
  category VARCHAR(50) DEFAULT 'General',
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  town_id UUID NOT NULL REFERENCES towns(id),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alerts_town ON emergency_alerts(town_id);

-- ─── SOS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  message TEXT,
  source VARCHAR(30) DEFAULT 'manual',
  trigger_method VARCHAR(30) DEFAULT 'button',
  status VARCHAR(20) DEFAULT 'active',
  alert_level VARCHAR(10) DEFAULT 'red',
  escalation_attempts INTEGER DEFAULT 0,
  last_escalation_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sos_user ON sos_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_status ON sos_events(status);

CREATE TABLE IF NOT EXISTS sos_gps_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sos_event_id UUID NOT NULL REFERENCES sos_events(id) ON DELETE CASCADE,
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  speed DECIMAL(6,2),
  heading DECIMAL(6,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sos_trusted_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GUARDIAN ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guardian_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_ping_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guardian_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  push_token TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movement_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  note TEXT,
  is_safe BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIPTIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ZAR',
  status VARCHAR(20) DEFAULT 'pending',
  payfast_payment_id VARCHAR(255),
  payfast_token VARCHAR(255),
  tier VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REPORTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(30) NOT NULL,
  target_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL,
  body TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HEATMAP ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS heatmap_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  town_id UUID NOT NULL REFERENCES towns(id),
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  intensity DECIMAL(4,2) DEFAULT 1.0,
  category VARCHAR(50) DEFAULT 'incident',
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_heatmap_town ON heatmap_points(town_id);

-- ─── SEED DATA ─────────────────────────────────────────────
INSERT INTO towns (name, province, lat, lng) VALUES
  ('Stellenbosch', 'Western Cape', -33.9321, 18.8602),
  ('Paarl', 'Western Cape', -33.7342, 18.9637),
  ('Franschhoek', 'Western Cape', -33.9100, 19.1200),
  ('Worcester', 'Western Cape', -33.6462, 19.4480),
  ('Hermanus', 'Western Cape', -34.4187, 19.2345),
  ('George', 'Western Cape', -33.9608, 22.4597),
  ('Knysna', 'Western Cape', -34.0356, 23.0465),
  ('Mossel Bay', 'Western Cape', -34.1831, 22.1408),
  ('Oudtshoorn', 'Western Cape', -33.5906, 22.2014),
  ('Beaufort West', 'Western Cape', -32.3568, 22.5832),
  ('Upington', 'Northern Cape', -28.4478, 21.2561),
  ('Kimberley', 'Northern Cape', -28.7282, 24.7499),
  ('Springbok', 'Northern Cape', -29.6640, 17.8864),
  ('Bloemfontein', 'Free State', -29.0852, 26.1596),
  ('Welkom', 'Free State', -27.9767, 26.7345),
  ('Bethlehem', 'Free State', -28.2310, 28.3080),
  ('Potchefstroom', 'North West', -26.7145, 27.1022),
  ('Rustenburg', 'North West', -25.6670, 27.2420),
  ('Klerksdorp', 'North West', -26.8667, 26.6667),
  ('Polokwane', 'Limpopo', -23.9045, 29.4689),
  ('Tzaneen', 'Limpopo', -23.8333, 30.1667),
  ('Nelspruit', 'Mpumalanga', -25.4745, 30.9703),
  ('Witbank', 'Mpumalanga', -25.8742, 29.2408),
  ('Newcastle', 'KwaZulu-Natal', -27.7569, 29.9318),
  ('Ladysmith', 'KwaZulu-Natal', -28.5597, 29.7814),
  ('Pietermaritzburg', 'KwaZulu-Natal', -29.6006, 30.3794),
  ('Richards Bay', 'KwaZulu-Natal', -28.7833, 32.0833),
  ('East London', 'Eastern Cape', -33.0153, 27.9116),
  ('Port Elizabeth', 'Eastern Cape', -33.9608, 25.6022),
  ('Grahamstown', 'Eastern Cape', -33.3042, 26.5328)
ON CONFLICT DO NOTHING;
