-- Add obscured_count to session_reports

ALTER TABLE session_reports 
ADD COLUMN IF NOT EXISTS obscured_count integer NOT NULL DEFAULT 0;
