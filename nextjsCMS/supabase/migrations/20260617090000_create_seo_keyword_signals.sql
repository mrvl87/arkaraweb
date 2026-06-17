CREATE TABLE IF NOT EXISTS seo_keyword_signals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query            TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  source           TEXT NOT NULL
                   CHECK (source IN ('google_search_console','bing_webmaster','manual')),
  cluster          TEXT NULL
                   CHECK (cluster IS NULL OR cluster IN ('air','energi','pangan','medis','keamanan','komunitas')),
  landing_page     TEXT NOT NULL DEFAULT '',
  impressions      INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks           INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  ctr              NUMERIC(7,4) NULL CHECK (ctr IS NULL OR (ctr >= 0 AND ctr <= 1)),
  average_position NUMERIC(8,2) NULL CHECK (average_position IS NULL OR average_position >= 0),
  intent           TEXT NULL,
  priority         TEXT NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('high','medium','low')),
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','ignored','used')),
  notes            TEXT NULL,
  created_by       UUID NULL,
  last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, normalized_query, landing_page)
);

CREATE INDEX IF NOT EXISTS idx_seo_keyword_signals_status_priority
  ON seo_keyword_signals(status, priority, impressions DESC);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_signals_cluster
  ON seo_keyword_signals(cluster, impressions DESC);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_signals_query
  ON seo_keyword_signals USING gin (to_tsvector('simple', query));

ALTER TABLE seo_keyword_signals ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_keyword_signals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_keyword_signals TO service_role;

DROP POLICY IF EXISTS "auth manage seo_keyword_signals" ON seo_keyword_signals;
CREATE POLICY "auth manage seo_keyword_signals"
  ON seo_keyword_signals
  FOR ALL
  TO authenticated
  USING ((select auth.role()) = 'authenticated')
  WITH CHECK ((select auth.role()) = 'authenticated');
