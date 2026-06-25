-- Políticas RLS seguras para pedidos
-- Ejecutar en Supabase → SQL Editor (reemplaza orders_select_public)

alter table public.orders add column if not exists shipping_address jsonb;
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_phone text;

create or replace function public.is_admin_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles where user_id = auth.uid()
  );
$$;

drop policy if exists "orders_select_public" on public.orders;
drop policy if exists "orders_insert_public" on public.orders;
drop policy if exists "orders_update_authenticated" on public.orders;
drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "orders_select_staff" on public.orders;
drop policy if exists "orders_insert_checkout" on public.orders;
drop policy if exists "orders_update_staff" on public.orders;

create policy "orders_select_own"
  on public.orders for select
  using (
    auth.uid()::text = user_id
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "orders_select_staff"
  on public.orders for select
  using (public.is_admin_staff());

create policy "orders_insert_checkout"
  on public.orders for insert
  with check (true);

create policy "orders_update_staff"
  on public.orders for update
  using (public.is_admin_staff())
  with check (public.is_admin_staff());
