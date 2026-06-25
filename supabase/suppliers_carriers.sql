-- ═══════════════════════════════════════════════════════════════════════════
-- Proveedores y empresas de envío — ejecutar en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.suppliers (
  id           text primary key,
  name         text not null,
  contact_name text,
  email        text,
  phone        text,
  website      text,
  address      text,
  notes        text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.shipping_carriers (
  id                    text primary key,
  name                  text not null,
  code                  text,
  tracking_url_template text,
  phone                 text,
  website               text,
  notes                 text,
  active                boolean not null default true,
  created_at            timestamptz not null default now()
);

alter table public.products add column if not exists "supplierId" text references public.suppliers(id) on delete set null;
alter table public.orders add column if not exists carrier_id text references public.shipping_carriers(id) on delete set null;

alter table public.suppliers enable row level security;
alter table public.shipping_carriers enable row level security;

drop policy if exists "suppliers_select_public" on public.suppliers;
drop policy if exists "suppliers_all_authenticated" on public.suppliers;
create policy "suppliers_select_public" on public.suppliers for select using (true);
create policy "suppliers_all_authenticated" on public.suppliers for all using (auth.role() = 'authenticated');

drop policy if exists "carriers_select_public" on public.shipping_carriers;
drop policy if exists "carriers_all_authenticated" on public.shipping_carriers;
create policy "carriers_select_public" on public.shipping_carriers for select using (true);
create policy "carriers_all_authenticated" on public.shipping_carriers for all using (auth.role() = 'authenticated');
