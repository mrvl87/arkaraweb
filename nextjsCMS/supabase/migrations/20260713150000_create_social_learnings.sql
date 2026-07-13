CREATE TABLE IF NOT EXISTS public.social_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope_type text NOT NULL
    CHECK (scope_type IN ('global', 'campaign', 'content_pillar', 'post_type', 'template', 'publishing_time')),
  scope_id uuid,
  title text NOT NULL,
  observation text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}',
  evidence_count int NOT NULL DEFAULT 0 CHECK (evidence_count >= 0),
  confidence text NOT NULL DEFAULT 'low'
    CHECK (confidence IN ('low', 'medium', 'high')),
  recommendation text NOT NULL,
  status text NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'approved', 'rejected', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_learnings_user_id
  ON public.social_learnings(user_id);
CREATE INDEX IF NOT EXISTS idx_social_learnings_scope
  ON public.social_learnings(user_id, scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_social_learnings_status
  ON public.social_learnings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_social_learnings_confidence
  ON public.social_learnings(user_id, confidence);
CREATE INDEX IF NOT EXISTS idx_social_learnings_created_at
  ON public.social_learnings(user_id, created_at DESC);

DROP TRIGGER IF EXISTS set_social_learnings_updated_at ON public.social_learnings;
CREATE TRIGGER set_social_learnings_updated_at
  BEFORE UPDATE ON public.social_learnings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.social_learnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own social learnings" ON public.social_learnings;
CREATE POLICY "Users can manage their own social learnings"
  ON public.social_learnings
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);