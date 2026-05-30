-- Mood logs table
CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 0,
  alert BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mood_logs_user ON mood_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_logs_created ON mood_logs(created_at DESC);
