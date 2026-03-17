/*
  # Speak2HR Interview Learning Platform - Initial Schema

  ## Overview
  Creates the foundational database structure for the interview learning platform
  including user profiles, interviews, assessments, sessions, and statistics.

  ## New Tables
  
  ### `user_profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, not null)
  - `full_name` (text)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
  
  ### `interviews`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `type` (text, 'ai' or 'hr')
  - `status` (text, 'pending', 'in_progress', 'completed')
  - `score` (numeric)
  - `feedback` (text)
  - `created_at` (timestamptz)
  - `completed_at` (timestamptz)
  
  ### `assessments`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `title` (text, not null)
  - `status` (text, 'pending', 'completed')
  - `score` (numeric)
  - `created_at` (timestamptz)
  - `completed_at` (timestamptz)
  
  ### `sessions`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `type` (text, 'interview' or 'assessment')
  - `reference_id` (uuid)
  - `duration_minutes` (integer)
  - `created_at` (timestamptz)
  
  ### `user_stats`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles, unique)
  - `completed_interviews` (integer, default 0)
  - `pending_assessments` (integer, default 0)
  - `average_score` (numeric, default 0)
  - `total_sessions` (integer, default 0)
  - `updated_at` (timestamptz, default now())

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to access their own data
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('ai', 'hr')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  score numeric CHECK (score >= 0 AND score <= 100),
  feedback text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interviews"
  ON interviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interviews"
  ON interviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews"
  ON interviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  score numeric CHECK (score >= 0 AND score <= 100),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessments"
  ON assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments"
  ON assessments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('interview', 'assessment')),
  reference_id uuid,
  duration_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  completed_interviews integer DEFAULT 0,
  pending_assessments integer DEFAULT 0,
  average_score numeric DEFAULT 0,
  total_sessions integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update user_stats automatically
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, completed_interviews, pending_assessments, average_score, total_sessions)
  VALUES (
    NEW.user_id,
    (SELECT COUNT(*) FROM interviews WHERE user_id = NEW.user_id AND status = 'completed'),
    (SELECT COUNT(*) FROM assessments WHERE user_id = NEW.user_id AND status = 'pending'),
    (SELECT COALESCE(AVG(score), 0) FROM interviews WHERE user_id = NEW.user_id AND status = 'completed' AND score IS NOT NULL),
    (SELECT COUNT(*) FROM sessions WHERE user_id = NEW.user_id)
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    completed_interviews = (SELECT COUNT(*) FROM interviews WHERE user_id = NEW.user_id AND status = 'completed'),
    pending_assessments = (SELECT COUNT(*) FROM assessments WHERE user_id = NEW.user_id AND status = 'pending'),
    average_score = (SELECT COALESCE(AVG(score), 0) FROM interviews WHERE user_id = NEW.user_id AND status = 'completed' AND score IS NOT NULL),
    total_sessions = (SELECT COUNT(*) FROM sessions WHERE user_id = NEW.user_id),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to update stats
DROP TRIGGER IF EXISTS update_stats_on_interview ON interviews;
CREATE TRIGGER update_stats_on_interview
  AFTER INSERT OR UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

DROP TRIGGER IF EXISTS update_stats_on_assessment ON assessments;
CREATE TRIGGER update_stats_on_assessment
  AFTER INSERT OR UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

DROP TRIGGER IF EXISTS update_stats_on_session ON sessions;
CREATE TRIGGER update_stats_on_session
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();