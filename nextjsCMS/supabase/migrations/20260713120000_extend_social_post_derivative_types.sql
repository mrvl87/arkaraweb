DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname
    INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'social_posts'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%post_type%'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.social_posts DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.social_posts
  ADD CONSTRAINT social_posts_post_type_check
  CHECK (post_type IN (
    'narrative',
    'editorial_poster',
    'checklist',
    'carousel',
    'myth_vs_fact',
    'scenario',
    'opinion',
    'article_link',
    'question',
    'poll',
    'recap',
    'short_video',
    'quote_statement'
  ));