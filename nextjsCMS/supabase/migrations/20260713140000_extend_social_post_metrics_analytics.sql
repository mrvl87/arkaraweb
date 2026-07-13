ALTER TABLE public.social_post_metrics
  ADD COLUMN IF NOT EXISTS reactions int,
  ADD COLUMN IF NOT EXISTS video_views int,
  ADD COLUMN IF NOT EXISTS average_watch_time_seconds numeric,
  ADD COLUMN IF NOT EXISTS followers_gained int,
  ADD COLUMN IF NOT EXISTS metric_window_hours int,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'social_post_metrics_reactions_non_negative'
      AND conrelid = 'public.social_post_metrics'::regclass
  ) THEN
    ALTER TABLE public.social_post_metrics
      ADD CONSTRAINT social_post_metrics_reactions_non_negative
      CHECK (reactions IS NULL OR reactions >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'social_post_metrics_video_views_non_negative'
      AND conrelid = 'public.social_post_metrics'::regclass
  ) THEN
    ALTER TABLE public.social_post_metrics
      ADD CONSTRAINT social_post_metrics_video_views_non_negative
      CHECK (video_views IS NULL OR video_views >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'social_post_metrics_average_watch_time_non_negative'
      AND conrelid = 'public.social_post_metrics'::regclass
  ) THEN
    ALTER TABLE public.social_post_metrics
      ADD CONSTRAINT social_post_metrics_average_watch_time_non_negative
      CHECK (average_watch_time_seconds IS NULL OR average_watch_time_seconds >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'social_post_metrics_followers_gained_non_negative'
      AND conrelid = 'public.social_post_metrics'::regclass
  ) THEN
    ALTER TABLE public.social_post_metrics
      ADD CONSTRAINT social_post_metrics_followers_gained_non_negative
      CHECK (followers_gained IS NULL OR followers_gained >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'social_post_metrics_metric_window_positive'
      AND conrelid = 'public.social_post_metrics'::regclass
  ) THEN
    ALTER TABLE public.social_post_metrics
      ADD CONSTRAINT social_post_metrics_metric_window_positive
      CHECK (metric_window_hours IS NULL OR metric_window_hours > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'social_post_metrics_source_check'
      AND conrelid = 'public.social_post_metrics'::regclass
  ) THEN
    ALTER TABLE public.social_post_metrics
      ADD CONSTRAINT social_post_metrics_source_check
      CHECK (source IN ('manual', 'csv', 'screenshot'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_social_post_metrics_user_recorded
  ON public.social_post_metrics(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_post_metrics_source
  ON public.social_post_metrics(source);
