alter table if exists public.posts
  add column if not exists quick_answer text,
  add column if not exists key_takeaways jsonb not null default '[]'::jsonb check (jsonb_typeof(key_takeaways) = 'array'),
  add column if not exists faq jsonb not null default '[]'::jsonb check (jsonb_typeof(faq) = 'array'),
  add column if not exists editorial_format text not null default 'legacy' check (editorial_format in ('legacy', 'mobile_reader', 'technical_guide'));

alter table if exists public.panduan
  add column if not exists quick_answer text,
  add column if not exists key_takeaways jsonb not null default '[]'::jsonb check (jsonb_typeof(key_takeaways) = 'array'),
  add column if not exists faq jsonb not null default '[]'::jsonb check (jsonb_typeof(faq) = 'array'),
  add column if not exists editorial_format text not null default 'legacy' check (editorial_format in ('legacy', 'mobile_reader', 'technical_guide'));
