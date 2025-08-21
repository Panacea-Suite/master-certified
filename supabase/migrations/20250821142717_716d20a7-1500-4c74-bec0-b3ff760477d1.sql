-- Fix search path for helper functions to address security warnings
create or replace function public.gen_hex_token(p_bytes int default 16)
returns text
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $$
  select encode(extensions.gen_random_bytes(p_bytes), 'hex');
$$;

create or replace function public.gen_compact_uuid()
returns text
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $$
  select replace(extensions.gen_random_uuid()::text, '-', '');
$$;