CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  preferred_locale VARCHAR(5) DEFAULT 'af',
  tier VARCHAR(20) DEFAULT 'free',
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_af VARCHAR(100),
  suburb VARCHAR(100),
  city VARCHAR(100) DEFAULT 'Pretoria',
  province VARCHAR(50) DEFAULT 'Gauteng',
  status VARCHAR(20) DEFAULT 'safe',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  area_id UUID REFERENCES areas(id),
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  title VARCHAR(200) NOT NULL,
  description TEXT,
  address TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  status VARCHAR(20) DEFAULT 'active',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patrols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID NOT NULL REFERENCES users(id),
  area_id UUID REFERENCES areas(id),
  name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  member_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patrol_members (
  patrol_id UUID NOT NULL REFERENCES patrols(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (patrol_id, user_id)
);

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  tier_name VARCHAR(20) NOT NULL,
  price_zar DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status VARCHAR(20) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  next_billing_date TIMESTAMPTZ,
  payfast_subscription_token VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  plan_id UUID REFERENCES plans(id),
  amount_zar DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payfast_payment_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed plans
INSERT INTO plans (name, tier_name, price_zar, description, features) VALUES
  ('Dorpwag Free', 'free', 0, 'Basic community safety', '["View alerts","Report incidents","Join patrols"]'),
  ('Dorpwag Plus', 'plus', 79, 'Enhanced safety', '["Everything Free","Push notifications","Area status history","Priority alerts"]'),
  ('Dorpwag Pro', 'pro', 149, 'Full platform', '["Everything Plus","Multi-area monitoring","Analytics dashboard","Export reports"]')
ON CONFLICT DO NOTHING;

-- Seed areas
INSERT INTO areas (name, name_af, suburb, city) VALUES
  ('Centurion', 'Centurion', 'Centurion', 'Pretoria'),
  ('Midrand', 'Midrand', 'Midrand', 'Johannesburg'),
  ('Sandton', 'Sandton', 'Sandton', 'Johannesburg')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_incidents_area ON incidents(area_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter ON incidents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_patrols_area ON patrols(area_id);
