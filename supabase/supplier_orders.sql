-- ═══════════════════════════════════════════════════════════════════════════
-- Productos ↔ proveedores (N:N) y pedidos a proveedores con facturas
-- Ejecutar en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.products add column if not exists "supplierIds" jsonb not null default '[]'::jsonb;

-- Migrar supplierId legacy → supplierIds
update public.products
set "supplierIds" = jsonb_build_array("supplierId")
where "supplierId" is not null
  and ("supplierIds" is null or "supplierIds" = '[]'::jsonb);

create table if not exists public.supplier_orders (
  id           text primary key,
  supplier_id  text not null references public.suppliers(id) on delete restrict,
  reference    text,
  status       text not null default 'draft'
               check (status in ('draft','sent','received','cancelled')),
  items        jsonb not null default '[]'::jsonb,
  total        numeric not null default 0,
  notes        text,
  invoices     jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  expected_at  timestamptz,
  received_at  timestamptz
);

create index if not exists supplier_orders_supplier_idx on public.supplier_orders (supplier_id);
create index if not exists supplier_orders_created_idx on public.supplier_orders (created_at desc);

alter table public.supplier_orders enable row level security;

drop policy if exists "supplier_orders_select_auth" on public.supplier_orders;
drop policy if exists "supplier_orders_all_auth" on public.supplier_orders;
create policy "supplier_orders_select_auth" on public.supplier_orders for select using (auth.role() = 'authenticated');
create policy "supplier_orders_all_auth" on public.supplier_orders for all using (auth.role() = 'authenticated');
