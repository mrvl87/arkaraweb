ALTER TABLE ai_generations
  DROP CONSTRAINT IF EXISTS ai_generations_status_check;

ALTER TABLE ai_generations
  ADD CONSTRAINT ai_generations_status_check
  CHECK (status IN ('success', 'error'));
