/*
# Create session reports table

1. Purpose
   Stores aggregated session data for the Driver Drowsiness Detection system.
   Each row represents one complete driving/monitoring session.

2. New Tables
   - `session_reports`
     - `id` (uuid, primary key)
     - `session_id` (text, matches the events logged during the session)
     - `start_time` (timestamptz, when the session started)
     - `end_time` (timestamptz, when the session ended)
     - `total_frames` (integer, total frames processed)
     - `drowsy_count` (integer, total drowsy warnings)
     - `severe_count` (integer, total severe drowsy alerts)
     - `yawn_count` (integer, total yawn warnings)
     - `created_at` (timestamptz, record creation time)

3. Security
   - Enable RLS on `session_reports`.
   - Allow anon + authenticated full CRUD for now.
*/

CREATE TABLE IF NOT EXISTS session_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  total_frames integer NOT NULL DEFAULT 0,
  drowsy_count integer NOT NULL DEFAULT 0,
  severe_count integer NOT NULL DEFAULT 0,
  yawn_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_reports_created_at
  ON session_reports (created_at DESC);

ALTER TABLE session_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reports" ON session_reports;
CREATE POLICY "anon_select_reports" ON session_reports FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reports" ON session_reports;
CREATE POLICY "anon_insert_reports" ON session_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reports" ON session_reports;
CREATE POLICY "anon_update_reports" ON session_reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reports" ON session_reports;
CREATE POLICY "anon_delete_reports" ON session_reports FOR DELETE
  TO anon, authenticated USING (true);
