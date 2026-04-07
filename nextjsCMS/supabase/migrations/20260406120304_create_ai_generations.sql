CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  target_type text NULL,
  target_id uuid NULL,
  operation text NOT NULL,
  model text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  input_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  prompt_version text NOT NULL DEFAULT 'v1',
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_operation ON ai_generations(operation);
CREATE INDEX IF NOT EXISTS idx_ai_generations_target ON ai_generations(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created ON ai_generations(created_at DESC);

ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth manage ai_generations" ON ai_generations;
CREATE POLICY "auth manage ai_generations" ON ai_generations
  FOR ALL
  USING (auth.role() = 'authenticated');
