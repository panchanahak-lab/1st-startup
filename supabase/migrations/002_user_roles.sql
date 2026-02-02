-- Create user_roles table for admin system
-- Admin users can bypass credit checks for testing

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all roles (admin operations)
CREATE POLICY "Service can manage roles" ON user_roles
  FOR ALL USING (TRUE);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_roles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_timestamp();
