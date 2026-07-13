ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS first_comment text,
  ADD COLUMN IF NOT EXISTS alt_text text,
  ADD COLUMN IF NOT EXISTS visual_spec jsonb,
  ADD COLUMN IF NOT EXISTS selected_template_id text,
  ADD COLUMN IF NOT EXISTS aspect_ratio text NOT NULL DEFAULT '1:1',
  ADD COLUMN IF NOT EXISTS utm_source text NOT NULL DEFAULT 'facebook',
  ADD COLUMN IF NOT EXISTS utm_medium text NOT NULL DEFAULT 'social',
  ADD COLUMN IF NOT EXISTS utm_campaign text;

UPDATE public.social_posts
SET aspect_ratio = '1:1'
WHERE aspect_ratio IS NULL;

UPDATE public.social_posts
SET utm_source = 'facebook'
WHERE utm_source IS NULL;

UPDATE public.social_posts
SET utm_medium = 'social'
WHERE utm_medium IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'social_posts_aspect_ratio_check'
      AND conrelid = 'public.social_posts'::regclass
  ) THEN
    ALTER TABLE public.social_posts
      ADD CONSTRAINT social_posts_aspect_ratio_check
      CHECK (aspect_ratio IN ('1:1', '4:5', '9:16'));
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.social_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,
  slide_id uuid REFERENCES public.social_carousel_slides(id) ON DELETE CASCADE,
  asset_type text NOT NULL
    CHECK (asset_type IN ('background', 'poster', 'carousel_slide', 'reel_cover', 'thumbnail')),
  storage_path text NOT NULL,
  mime_type text,
  width int CHECK (width IS NULL OR width > 0),
  height int CHECK (height IS NULL OR height > 0),
  aspect_ratio text
    CHECK (aspect_ratio IS NULL OR aspect_ratio IN ('1:1', '4:5', '9:16')),
  template_id text,
  version int NOT NULL DEFAULT 1 CHECK (version > 0),
  generation_prompt text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(metadata) = 'object'),
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'ready', 'approved', 'archived', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (post_id IS NOT NULL OR slide_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.social_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  published_at timestamptz NOT NULL DEFAULT now(),
  platform text NOT NULL DEFAULT 'facebook'
    CHECK (platform IN ('facebook', 'x', 'instagram', 'tiktok', 'youtube_shorts')),
  publication_method text NOT NULL DEFAULT 'manual'
    CHECK (publication_method IN ('manual')),
  facebook_url text,
  caption_snapshot text,
  first_comment_snapshot text,
  asset_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_assets_user_id
  ON public.social_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_social_assets_post_id
  ON public.social_assets(post_id);
CREATE INDEX IF NOT EXISTS idx_social_assets_slide_id
  ON public.social_assets(slide_id);
CREATE INDEX IF NOT EXISTS idx_social_assets_status
  ON public.social_assets(status);
CREATE INDEX IF NOT EXISTS idx_social_publications_user_id
  ON public.social_publications(user_id);
CREATE INDEX IF NOT EXISTS idx_social_publications_post_id
  ON public.social_publications(post_id);
CREATE INDEX IF NOT EXISTS idx_social_publications_published_at
  ON public.social_publications(published_at DESC);

DROP TRIGGER IF EXISTS set_social_assets_updated_at ON public.social_assets;
CREATE TRIGGER set_social_assets_updated_at
  BEFORE UPDATE ON public.social_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.social_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_publications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own social assets" ON public.social_assets;
CREATE POLICY "Users can manage their own social assets"
  ON public.social_assets
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their own social publications" ON public.social_publications;
CREATE POLICY "Users can manage their own social publications"
  ON public.social_publications
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('social-assets', 'social-assets', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

DROP POLICY IF EXISTS "Public can read social assets" ON storage.objects;
CREATE POLICY "Public can read social assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'social-assets');

DROP POLICY IF EXISTS "Users can insert own social asset files" ON storage.objects;
CREATE POLICY "Users can insert own social asset files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'social-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Users can update own social asset files" ON storage.objects;
CREATE POLICY "Users can update own social asset files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'social-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'social-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Users can delete own social asset files" ON storage.objects;
CREATE POLICY "Users can delete own social asset files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'social-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
