DROP POLICY IF EXISTS "auth manage seo_indexing_queue" ON seo_indexing_queue;

CREATE POLICY "auth manage seo_indexing_queue"
  ON seo_indexing_queue
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
