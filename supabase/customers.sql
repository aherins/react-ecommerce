-- CRM de clientes de la tienda (registro, actividad, deseos, notas internas)
-- Ejecutar en Supabase → SQL Editor

-- Perfil extendido (compatible con tabla existente)
alter table public.profiles
  add column if not exists account_type text default 'customer'
    check (account_type in ('customer', 'staff')),
  add column if not exists last_seen_at timestamptz,
  add column if not exists registered_at timestamptz default now();

-- Eventos: vistas, búsquedas, carrito, deseos
create table if not exists public.customer_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'product_view', 'search', 'add_to_cart', 'wishlist_add', 'wishlist_remove'
  )),
  product_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists customer_events_user_created_idx
  on public.customer_events (user_id, created_at desc);

-- Lista de deseos persistida (usuarios logueados)
create table if not exists public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  added_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- Notas internas del equipo sobre un cliente
create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists customer_notes_user_idx
  on public.customer_notes (user_id, created_at desc);

-- Trigger: perfil al registrarse en la tienda
create or replace function public.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, account_type, registered_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'customer',
    coalesce(new.created_at, now())
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_customer on auth.users;
create trigger on_auth_user_created_customer
  after insert on auth.users
  for each row execute function public.handle_new_customer();

-- RLS
alter table public.customer_events enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.customer_notes enable row level security;

drop policy if exists "customer_events_insert_own" on public.customer_events;
create policy "customer_events_insert_own"
  on public.customer_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "wishlist_items_own" on public.wishlist_items;
create policy "wishlist_items_own"
  on public.wishlist_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Perfil: el usuario actualiza su last_seen
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Backfill perfiles de clientes ya registrados
insert into public.profiles (id, email, full_name, account_type, registered_at)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  case when exists (select 1 from public.user_roles ur where ur.user_id = u.id)
    then 'staff' else 'customer' end,
  u.created_at
from auth.users u
on conflict (id) do update
  set email = excluded.email,
      account_type = coalesce(public.profiles.account_type, excluded.account_type);
