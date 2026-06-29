-- Subcategorías (un nivel: categoría → subcategoría)
-- Ejecutar en Supabase → SQL Editor

alter table public.categories
  add column if not exists "parentId" text references public.categories(id) on delete cascade;

create index if not exists categories_parent_idx on public.categories ("parentId");
