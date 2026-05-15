CREATE TABLE IF NOT EXISTS public.social_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  theme text,
  platform text NOT NULL DEFAULT 'facebook'
    CHECK (platform IN ('facebook', 'x', 'instagram', 'tiktok', 'youtube_shorts')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  primary_goal text,
  content_pillar text,
  tone_note text,
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'in_progress', 'completed', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.social_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'facebook'
    CHECK (platform IN ('facebook', 'x', 'instagram', 'tiktok', 'youtube_shorts')),
  post_type text NOT NULL
    CHECK (post_type IN (
      'narrative',
      'checklist',
      'carousel',
      'opinion',
      'article_link',
      'question',
      'poll',
      'recap',
      'short_video'
    )),
  title text NOT NULL,
  hook text,
  body text,
  cta text,
  target_url text,
  source_type text NOT NULL DEFAULT 'none'
    CHECK (source_type IN ('post', 'panduan', 'external', 'none')),
  source_id uuid,
  scheduled_date date,
  scheduled_time time,
  timezone text NOT NULL DEFAULT 'Asia/Jayapura',
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'drafting', 'ready', 'posted', 'reviewed', 'archived')),
  visual_prompt text,
  objective text,
  content_pillar text,
  caption_done boolean NOT NULL DEFAULT false,
  cta_done boolean NOT NULL DEFAULT false,
  visual_prompt_done boolean NOT NULL DEFAULT false,
  asset_done boolean NOT NULL DEFAULT false,
  copied_done boolean NOT NULL DEFAULT false,
  posted_done boolean NOT NULL DEFAULT false,
  metrics_done boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_carousel_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slide_number int NOT NULL CHECK (slide_number > 0),
  title_text text NOT NULL,
  paragraph_text text,
  visual_prompt text,
  image_status text NOT NULL DEFAULT 'needed'
    CHECK (image_status IN ('needed', 'prompt_ready', 'generated', 'uploaded', 'approved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, slide_number)
);

CREATE TABLE IF NOT EXISTS public.social_post_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  reach int CHECK (reach IS NULL OR reach >= 0),
  comments int CHECK (comments IS NULL OR comments >= 0),
  shares int CHECK (shares IS NULL OR shares >= 0),
  link_clicks int CHECK (link_clicks IS NULL OR link_clicks >= 0),
  notes text,
  next_action text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_campaigns_user_status
  ON public.social_campaigns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_dates
  ON public.social_campaigns(user_id, start_date DESC, end_date DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_campaign
  ON public.social_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_status
  ON public.social_posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_schedule
  ON public.social_posts(user_id, scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_social_carousel_slides_post
  ON public.social_carousel_slides(post_id, slide_number);
CREATE INDEX IF NOT EXISTS idx_social_post_metrics_post
  ON public.social_post_metrics(post_id, recorded_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_social_campaigns_updated_at ON public.social_campaigns;
CREATE TRIGGER set_social_campaigns_updated_at
  BEFORE UPDATE ON public.social_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_social_posts_updated_at ON public.social_posts;
CREATE TRIGGER set_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_social_carousel_slides_updated_at ON public.social_carousel_slides;
CREATE TRIGGER set_social_carousel_slides_updated_at
  BEFORE UPDATE ON public.social_carousel_slides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.social_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_carousel_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own social campaigns" ON public.social_campaigns;
CREATE POLICY "Users can manage their own social campaigns"
  ON public.social_campaigns
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their own social posts" ON public.social_posts;
CREATE POLICY "Users can manage their own social posts"
  ON public.social_posts
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their own carousel slides" ON public.social_carousel_slides;
CREATE POLICY "Users can manage their own carousel slides"
  ON public.social_carousel_slides
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their own social metrics" ON public.social_post_metrics;
CREATE POLICY "Users can manage their own social metrics"
  ON public.social_post_metrics
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
