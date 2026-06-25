-- ═══════════════════════════════════════════════════════════════════════════
-- TABLA orders — ejecutar en Supabase → SQL Editor → Run
-- (Copia y pega TODO este archivo de una vez)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.orders (
  id              text primary key,
  payment_id      text,
  user_id         text,
  created_at      timestamptz not null default now(),
  status          text not null default 'pending'
                  check (status in ('pending','processing','shipped','delivered','cancelled')),
  total           numeric not null,
  subtotal        numeric,
  discount        numeric default 0,
  coupon_code     text,
  items           jsonb not null default '[]'::jsonb,
  email           text,
  tracking_number text,
  simulated       boolean default false
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_user_id_idx    on public.orders (user_id);
create index if not exists orders_email_idx      on public.orders (email);

-- Ver supabase/orders_rls.sql para políticas seguras (reemplaza orders_select_public)

alter table public.orders add column if not exists shipping_address jsonb;
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_phone text;

alter table public.orders enable row level security;

drop policy if exists "orders_select_public" on public.orders;
drop policy if exists "orders_insert_public" on public.orders;
drop policy if exists "orders_update_authenticated" on public.orders;

-- Tras migrar, ejecuta supabase/orders_rls.sql para políticas de privacidad

-- Realtime (opcional — si falla, ignóralo; la app funciona igual)
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
