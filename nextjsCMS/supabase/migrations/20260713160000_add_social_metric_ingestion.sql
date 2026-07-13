ALTER TABLE public.social_post_metrics
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.social_metric_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.social_campaigns(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'csv'
    CHECK (source IN ('csv', 'screenshot')),
  file_name text,
  file_mime_type text,
  row_count int NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  imported_count int NOT NULL DEFAULT 0 CHECK (imported_count >= 0),
  skipped_count int NOT NULL DEFAULT 0 CHECK (skipped_count >= 0),
  error_summary jsonb NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('previewed', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_metric_imports_user_id
  ON public.social_metric_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_social_metric_imports_campaign_id
  ON public.social_metric_imports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_metric_imports_source
  ON public.social_metric_imports(user_id, source);
CREATE INDEX IF NOT EXISTS idx_social_metric_imports_created_at
  ON public.social_metric_imports(user_id, created_at DESC);

ALTER TABLE public.social_metric_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own social metric imports" ON public.social_metric_imports;
CREATE POLICY "Users can manage their own social metric imports"
  ON public.social_metric_imports
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
