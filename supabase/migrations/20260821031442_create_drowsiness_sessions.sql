/*
# Create drowsiness detection session logs

1. Purpose
   Stores a log entry for each drowsiness or yawn alert event captured by the
   browser-based Driver Drowsiness Detection system. Each row represents one
   alert episode (eyes-closed drowsy event or yawn warning) during a monitoring
   session.

2. New Tables
   - `drowsiness_events`
     - `id` (uuid, primary key)
     - `session_id` (text, groups events from a single monitoring session)
     - `event_type` (text, either 'drowsy' or 'yawn')
     - `severity` (text, 'warning' or 'severe')
     - `duration_frames` (integer, how many consecutive frames triggered the event)
     - `ear_value` (double precision, eye aspect ratio at trigger time, nullable)
     - `mar_value` (double precision, mouth aspect ratio at trigger time, nullable)
     - `created_at` (timestamptz, when the event occurred)

3. Security
   - Enable RLS on `drowsiness_events`.
   - Single-tenant app with no sign-in screen: allow anon + authenticated full
     CRUD because the data is intentionally shared/public.

4. Notes
   - No user_id column — this app has no authentication.
   - Index on created_at for chronological ordering and session filtering.
*/

CREATE TABLE IF NOT EXISTS drowsiness_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('drowsy', 'yawn')),
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning', 'severe')),
  duration_frames integer NOT NULL DEFAULT 0,
  ear_value double precision,
  mar_value double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drowsiness_events_created_at
  ON drowsiness_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_drowsiness_events_session
  ON drowsiness_events (session_id);

ALTER TABLE drowsiness_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_events" ON drowsiness_events;
CREATE POLICY "anon_select_events" ON drowsiness_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_events" ON drowsiness_events;
CREATE POLICY "anon_insert_events" ON drowsiness_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_events" ON drowsiness_events;
CREATE POLICY "anon_update_events" ON drowsiness_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_events" ON drowsiness_events;
CREATE POLICY "anon_delete_events" ON drowsiness_events FOR DELETE
  TO anon, authenticated USING (true);
