-- Políticas RLS para que el panel pueda leer roles y perfiles.
-- Ejecutar en Supabase → SQL Editor si la lista de /admin/usuarios sale vacía.

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'superadmin'
  );
$$;

alter table public.user_roles enable row level security;

drop policy if exists "user_roles_select_own" on public.user_roles;
drop policy if exists "user_roles_select_superadmin" on public.user_roles;

create policy "user_roles_select_own"
on public.user_roles for select
using (auth.uid() = user_id);

create policy "user_roles_select_superadmin"
on public.user_roles for select
using (public.is_superadmin());

drop policy if exists "user_roles_insert_superadmin" on public.user_roles;
create policy "user_roles_insert_superadmin"
on public.user_roles for insert
with check (public.is_superadmin());

drop policy if exists "user_roles_update_superadmin" on public.user_roles;
create policy "user_roles_update_superadmin"
on public.user_roles for update
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "user_roles_delete_superadmin" on public.user_roles;
create policy "user_roles_delete_superadmin"
on public.user_roles for delete
using (public.is_superadmin());

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_superadmin" on public.profiles;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_select_superadmin"
on public.profiles for select
using (public.is_superadmin());
