ALTER TABLE public.social_carousel_slides
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS visual_spec jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'social_carousel_slides_visual_spec_object_check'
      AND conrelid = 'public.social_carousel_slides'::regclass
  ) THEN
    ALTER TABLE public.social_carousel_slides
      ADD CONSTRAINT social_carousel_slides_visual_spec_object_check
      CHECK (visual_spec IS NULL OR jsonb_typeof(visual_spec) = 'object');
  END IF;
END $$;