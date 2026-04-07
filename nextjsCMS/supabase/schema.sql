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

-- PANDUAN
CREATE TABLE IF NOT EXISTS panduan (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  content      TEXT NOT NULL DEFAULT '',
  bab_ref      TEXT,
  qr_slug      TEXT,
  cover_image  TEXT,
  meta_title   TEXT,
  meta_desc    TEXT,
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','published')),
  author_id    UUID,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

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

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE panduan ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE cta_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read published posts" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "public read published panduan" ON panduan FOR SELECT USING (status = 'published');
CREATE POLICY "public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "public read navigation" ON navigation FOR SELECT USING (is_active = true);
CREATE POLICY "public read hero" ON hero_section FOR SELECT USING (true);
CREATE POLICY "public read cta" ON cta_section FOR SELECT USING (true);
CREATE POLICY "public read footer" ON footer FOR SELECT USING (true);

CREATE POLICY "auth manage posts" ON posts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage panduan" ON panduan FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage navigation" ON navigation FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage hero" ON hero_section FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage cta" ON cta_section FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage footer" ON footer FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth manage media" ON media FOR ALL USING (auth.role() = 'authenticated');

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
