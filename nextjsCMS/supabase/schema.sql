-- POSTS
CREATE TABLE IF NOT EXISTS posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  content      TEXT NOT NULL DEFAULT '',
  description  TEXT,
  category     TEXT NOT NULL DEFAULT 'pangan'
               CHECK (category IN ('air','energi','pangan','medis','keamanan','komunitas')),
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','published')),
  cover_image  TEXT,
  quick_answer TEXT,
  key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb
               CHECK (jsonb_typeof(key_takeaways) = 'array'),
  faq           JSONB NOT NULL DEFAULT '[]'::jsonb
               CHECK (jsonb_typeof(faq) = 'array'),
  editorial_format TEXT NOT NULL DEFAULT 'legacy'
               CHECK (editorial_format IN ('legacy','mobile_reader','technical_guide')),
  meta_title   TEXT,
  meta_desc    TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  author_id    UUID,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

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

-- PANDUAN
CREATE TABLE IF NOT EXISTS panduan (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  content      TEXT NOT NULL DEFAULT '',
  bab_ref      TEXT,
  qr_slug      TEXT,
  cover_image  TEXT,
  quick_answer TEXT,
  key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb
               CHECK (jsonb_typeof(key_takeaways) = 'array'),
  faq           JSONB NOT NULL DEFAULT '[]'::jsonb
               CHECK (jsonb_typeof(faq) = 'array'),
  editorial_format TEXT NOT NULL DEFAULT 'legacy'
               CHECK (editorial_format IN ('legacy','mobile_reader','technical_guide')),
  meta_title   TEXT,
  meta_desc    TEXT,
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','published')),
  author_id    UUID,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

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

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Air','air','💧',1),('Energi','energi','⚡',2),('Pangan','pangan','🌾',3),
  ('Medis','medis','⚕️',4),('Keamanan','keamanan','🛡️',5),('Komunitas','komunitas','👥',6)
ON CONFLICT (slug) DO NOTHING;

-- SITE SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO site_settings (key, value) VALUES
  ('site_name','Arkara'),('tagline','Survive with Knowledge'),
  ('description','Platform pengetahuan survival Indonesia.'),
  ('og_image','/images/og-default.webp'),('site_url','https://arkara.id')
ON CONFLICT (key) DO NOTHING;

-- NAVIGATION
CREATE TABLE IF NOT EXISTS navigation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL, href TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_external BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO navigation (label, href, sort_order) VALUES
  ('Blog','/blog',1),('Panduan','/panduan',2);

-- HERO SECTION
CREATE TABLE IF NOT EXISTS hero_section (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL DEFAULT 'Arkara',
  subheadline TEXT,
  body_text TEXT,
  cta_primary_text TEXT DEFAULT 'Mulai Belajar',
  cta_primary_href TEXT DEFAULT '/blog',
  cta_secondary_text TEXT DEFAULT 'Lihat Panduan',
  cta_secondary_href TEXT DEFAULT '/panduan',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO hero_section (headline, subheadline, body_text) VALUES
  ('Arkara','Survive with Knowledge','Platform pengetahuan survival Indonesia. Pelajari teknik praktis untuk menghadapi krisis dengan kemandirian yang tepat.');

-- CTA SECTION
CREATE TABLE IF NOT EXISTS cta_section (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL DEFAULT 'Siap Hadapi Krisis?',
  body_text TEXT,
  button_text TEXT DEFAULT 'Pelajari Panduan Teknis',
  button_href TEXT DEFAULT '/panduan',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO cta_section (headline, body_text) VALUES
  ('Siap Hadapi Krisis?','Jangan biarkan ketidaktahuan menjadi penghalang keselamatan Anda.');

-- FOOTER
CREATE TABLE IF NOT EXISTS footer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tagline TEXT,
  copyright_text TEXT DEFAULT '© 2026 Arkara — Survive with Knowledge',
  social_links JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO footer (tagline, copyright_text) VALUES
  ('Membangun ketangguhan bangsa melalui pengetahuan.','© 2026 Arkara — Survive with Knowledge');

-- MEDIA
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL, url TEXT NOT NULL,
  size INTEGER, mime_type TEXT,
  alt_text TEXT DEFAULT '',
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO INDEXING QUEUE
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

-- SEO KEYWORD SIGNALS
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

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_slug_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE panduan ENABLE ROW LEVEL SECURITY;
ALTER TABLE panduan_slug_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE cta_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_indexing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keyword_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read published posts" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "public read active post slug redirects" ON post_slug_redirects FOR SELECT USING (is_active = true);
CREATE POLICY "public read published panduan" ON panduan FOR SELECT USING (status = 'published');
CREATE POLICY "public read active panduan slug redirects" ON panduan_slug_redirects FOR SELECT USING (is_active = true);
CREATE POLICY "public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "public read navigation" ON navigation FOR SELECT USING (is_active = true);
CREATE POLICY "public read hero" ON hero_section FOR SELECT USING (true);
CREATE POLICY "public read cta" ON cta_section FOR SELECT USING (true);
CREATE POLICY "public read footer" ON footer FOR SELECT USING (true);

CREATE POLICY "auth manage posts" ON posts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage post slug redirects" ON post_slug_redirects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage panduan" ON panduan FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage panduan slug redirects" ON panduan_slug_redirects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage navigation" ON navigation FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage hero" ON hero_section FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage cta" ON cta_section FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage footer" ON footer FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage media" ON media FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage seo_indexing_queue" ON seo_indexing_queue FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth manage seo_keyword_signals" ON seo_keyword_signals FOR ALL TO authenticated USING ((select auth.role()) = 'authenticated') WITH CHECK ((select auth.role()) = 'authenticated');

-- AI GENERATIONS (logging)
CREATE TABLE IF NOT EXISTS ai_generations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NULL,
  target_type  TEXT NULL,
  target_id    UUID NULL,
  operation    TEXT NOT NULL,
  model        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'success'
               CHECK (status IN ('success','error')),
  input_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json  JSONB NOT NULL DEFAULT '{}'::jsonb,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  error_message TEXT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_generations_operation ON ai_generations(operation);
CREATE INDEX IF NOT EXISTS idx_ai_generations_target ON ai_generations(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created ON ai_generations(created_at DESC);

ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage ai_generations" ON ai_generations FOR ALL USING (auth.role() = 'authenticated');
