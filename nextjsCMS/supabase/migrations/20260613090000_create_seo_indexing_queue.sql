CREATE TABLE IF NOT EXISTS seo_indexing_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url           TEXT NOT NULL,
  content_type  TEXT NOT NULL
                CHECK (content_type IN ('post','panduan')),
  content_id    UUID NULL,
  title         TEXT NOT NULL DEFAULT '',
  slug          TEXT NOT NULL DEFAULT '',
  source        TEXT NOT NULL DEFAULT 'manual'
                CHECK (source IN ('seo_repair_apply','content_update','content_publish','gap_draft','manual')),
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','submitted','failed','skipped')),
  indexing_type TEXT NOT NULL DEFAULT 'URL_UPDATED'
                CHECK (indexing_type IN ('URL_UPDATED','URL_DELETED')),
  created_by    UUID NULL,
  submitted_at  TIMESTAMPTZ NULL,
  error_message TEXT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_indexing_queue_status_created
  ON seo_indexing_queue(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_indexing_queue_content
  ON seo_indexing_queue(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_seo_indexing_queue_url
  ON seo_indexing_queue(url);

ALTER TABLE seo_indexing_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth manage seo_indexing_queue" ON seo_indexing_queue;
CREATE POLICY "auth manage seo_indexing_queue"
  ON seo_indexing_queue
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
