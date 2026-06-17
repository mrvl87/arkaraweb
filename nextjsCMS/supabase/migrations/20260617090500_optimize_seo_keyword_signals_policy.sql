DROP POLICY IF EXISTS "auth manage seo_keyword_signals" ON seo_keyword_signals;

CREATE POLICY "auth manage seo_keyword_signals"
  ON seo_keyword_signals
  FOR ALL
  TO authenticated
  USING ((select auth.role()) = 'authenticated')
  WITH CHECK ((select auth.role()) = 'authenticated');
