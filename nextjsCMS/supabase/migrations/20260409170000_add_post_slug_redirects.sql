CREATE TABLE IF NOT EXISTS post_slug_redirects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id        UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  source_slug    TEXT NOT NULL,
  source_path    TEXT NOT NULL,
  target_slug    TEXT NOT NULL,
  target_path    TEXT NOT NULL,
  redirect_type  TEXT NOT NULL DEFAULT 'permanent'
                 CHECK (redirect_type IN ('permanent')),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_slug_redirects_source_path
  ON post_slug_redirects(source_path);
CREATE INDEX IF NOT EXISTS idx_post_slug_redirects_post_id
  ON post_slug_redirects(post_id);
CREATE INDEX IF NOT EXISTS idx_post_slug_redirects_active
  ON post_slug_redirects(is_active, source_slug);

ALTER TABLE post_slug_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active post slug redirects"
  ON post_slug_redirects FOR SELECT
  USING (is_active = true);

CREATE POLICY "auth manage post slug redirects"
  ON post_slug_redirects FOR ALL
  USING (auth.role() = 'authenticated');
