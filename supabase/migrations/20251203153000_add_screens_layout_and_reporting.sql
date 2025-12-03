-- Add current_layout_id and subtitle to screens
ALTER TABLE IF EXISTS screens
  ADD COLUMN IF NOT EXISTS current_layout_id uuid REFERENCES layouts(id),
  ADD COLUMN IF NOT EXISTS subtitle text;

-- Table to store device status reported by the client app
CREATE TABLE IF NOT EXISTS device_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id uuid REFERENCES screens(id) ON DELETE CASCADE,
  app_version text,
  os text,
  resolution text,
  used_space text,
  free_space text,
  mac text,
  info jsonb,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Table to store play events (reporting what was played, when and where)
CREATE TABLE IF NOT EXISTS play_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id uuid REFERENCES screens(id) ON DELETE CASCADE,
  file_id uuid REFERENCES files(id),
  playlist_id uuid REFERENCES playlists(id),
  layout_id uuid REFERENCES layouts(id),
  started_at timestamptz,
  duration_seconds integer,
  occurrences integer DEFAULT 1,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes to help reporting queries
CREATE INDEX IF NOT EXISTS idx_play_events_screen_started_at ON play_events(screen_id, started_at);
CREATE INDEX IF NOT EXISTS idx_device_status_screen_last_seen ON device_status(screen_id, last_seen DESC);
