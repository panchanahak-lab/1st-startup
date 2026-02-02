-- Create ai_usage_logs table for tracking all AI API calls
-- This enables analytics without increasing Gemini costs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN (
    'resume_ai', 'interview_ai', 'linkedin_ai', 
    'summary_ai', 'chatbot_ai', 'ats_ai'
  )),
  model TEXT NOT NULL CHECK (model IN ('flash', 'pro')),
  credits_used INTEGER NOT NULL DEFAULT 0,
  input_chars INTEGER NOT NULL DEFAULT 0,
  output_chars INTEGER NOT NULL DEFAULT 0,
  cached BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature ON ai_usage_logs(feature);

-- Enable Row Level Security
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own logs
CREATE POLICY "Users can view own usage" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert (API routes use service role)
CREATE POLICY "Service can insert logs" ON ai_usage_logs
  FOR INSERT WITH CHECK (TRUE);

-- Service role can select all (for admin analytics)
CREATE POLICY "Service can select all" ON ai_usage_logs
  FOR SELECT USING (TRUE);
