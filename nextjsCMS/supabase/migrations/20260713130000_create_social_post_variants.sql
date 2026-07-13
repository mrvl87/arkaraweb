CREATE TABLE IF NOT EXISTS public.social_post_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  variant_type text NOT NULL
    CHECK (variant_type IN (
      'hook',
      'headline',
      'caption',
      'cta',
      'first_comment',
      'visual_direction'
    )),
  label text,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  heuristic_scores jsonb NOT NULL DEFAULT '{}',
  is_selected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_post_variants_user
  ON public.social_post_variants(user_id);
CREATE INDEX IF NOT EXISTS idx_social_post_variants_post
  ON public.social_post_variants(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_variants_post_type
  ON public.social_post_variants(post_id, variant_type, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_post_variants_one_selected
  ON public.social_post_variants(user_id, post_id, variant_type)
  WHERE is_selected;

DROP TRIGGER IF EXISTS set_social_post_variants_updated_at ON public.social_post_variants;
CREATE TRIGGER set_social_post_variants_updated_at
  BEFORE UPDATE ON public.social_post_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.social_post_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own social post variants" ON public.social_post_variants;
CREATE POLICY "Users can manage their own social post variants"
  ON public.social_post_variants
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.social_posts
      WHERE social_posts.id = social_post_variants.post_id
        AND social_posts.user_id = (SELECT auth.uid())
    )
  );