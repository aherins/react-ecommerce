-- Alertas de stock: avisar al cliente cuando un producto vuelva a estar disponible
-- Ejecutar en Supabase → SQL Editor

create table if not exists public.stock_alerts (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null,
  email       text not null,
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  notified_at timestamptz,
  unique (product_id, email)
);

create index if not exists stock_alerts_product_idx on public.stock_alerts (product_id);
create index if not exists stock_alerts_email_idx on public.stock_alerts (lower(email));

alter table public.stock_alerts enable row level security;

drop policy if exists "stock_alerts_insert" on public.stock_alerts;
drop policy if exists "stock_alerts_select" on public.stock_alerts;
drop policy if exists "stock_alerts_delete" on public.stock_alerts;

create policy "stock_alerts_insert" on public.stock_alerts
  for insert with check (product_id is not null and email is not null);

create policy "stock_alerts_select" on public.stock_alerts
  for select using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or auth.uid() = user_id
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
    )
  );

create policy "stock_alerts_delete" on public.stock_alerts
  for delete using (
    auth.uid() = user_id
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
