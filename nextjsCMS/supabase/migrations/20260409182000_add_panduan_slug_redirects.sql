CREATE TABLE IF NOT EXISTS panduan_slug_redirects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panduan_id     UUID NOT NULL REFERENCES panduan(id) ON DELETE CASCADE,
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_panduan_slug_redirects_source_path
  ON panduan_slug_redirects(source_path);
CREATE INDEX IF NOT EXISTS idx_panduan_slug_redirects_panduan_id
  ON panduan_slug_redirects(panduan_id);
CREATE INDEX IF NOT EXISTS idx_panduan_slug_redirects_active
  ON panduan_slug_redirects(is_active, source_slug);

ALTER TABLE panduan_slug_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active panduan slug redirects"
  ON panduan_slug_redirects FOR SELECT
  USING (is_active = true);

CREATE POLICY "auth manage panduan slug redirects"
  ON panduan_slug_redirects FOR ALL
  USING (auth.role() = 'authenticated');
