# ShopMVP — Tienda + Panel Admin

MVP de tienda online con panel de administración completo.

## Stack
- **React 18** + React Router v6 + Vite
- **Supabase** — base de datos PostgreSQL + auth (con fallback a localStorage)
- **Stripe** — pagos con tarjeta (con modo simulación si no hay credenciales)
- **Cloudinary** — subida de imágenes (con fallback a object URL local)
- **Resend** — emails de confirmación de pedido
- **Vercel** — despliegue + Edge Functions para Stripe y Resend

---

## Arrancar en local

```bash
cp .env.example .env.local   # edita con tus credenciales (o deja vacío para modo demo)
npm install
npm run dev
# → http://localhost:5173
```

**Sin credenciales todo funciona en modo demo:**
- Datos en localStorage
- Usuarios demo del panel (sin Supabase):
  - `superadmin@artesana.es` / `super1234`
  - `admin@artesana.es` / `admin1234`
  - `editor@artesana.es` / `editor1234`
  - `viewer@artesana.es` / `viewer1234`
- Pagos simulados con tarjetas de prueba

---

## Rutas

| Ruta                  | Descripción                   |
|-----------------------|-------------------------------|
| `/`                   | Tienda principal              |
| `/producto/:id`       | Detalle de producto           |
| `/carrito`            | Carrito                       |
| `/checkout`           | Pago (Stripe real o simulado) |
| `/admin`              | Dashboard admin               |
| `/admin/pedidos`      | Pedidos y envíos              |
| `/admin/productos`    | CRUD productos                |
| `/admin/categorias`   | CRUD categorías               |
| `/admin/estadisticas` | Estadísticas y export CSV     |
| `/admin/cupones`      | Cupones de descuento          |
| `/admin/usuarios`     | Gestión de roles              |
| `/cuenta`             | Panel de usuario              |
| `/cuenta/pedidos`     | Pedidos del usuario           |

---

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena las que tengas:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=                   ← mismo valor que VITE_SUPABASE_URL (solo servidor)
SUPABASE_SERVICE_ROLE_KEY=      ← solo en Vercel; crea usuarios desde /admin/usuarios
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=              ← solo en Vercel (no exponer al cliente)
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
RESEND_API_KEY=                 ← solo en Vercel
RESEND_FROM=
```

---

## Desplegar en Vercel

```bash
npm i -g vercel
vercel
```

O conecta el repositorio en [vercel.com](https://vercel.com) y añade las variables de entorno en **Settings → Environment Variables**.

**Crear usuarios del panel:** entra como superadmin → `/admin/usuarios` → **Nuevo usuario**. Requiere `SUPABASE_SERVICE_ROLE_KEY` en Vercel (Settings → API → `service_role`). En local usa `npx vercel dev` para que funcione `/api/invite-admin-user`.

- Build: `npm run build`
- Output: `dist`
- El `vercel.json` ya configura el SPA routing y las Edge Functions en `/api/`

---

## SQL para Supabase

Ejecuta esto en **Supabase → SQL Editor** para crear las tablas:

```sql
-- Categorías
create table categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

-- Productos
create table products (
  id text primary key,
  name text not null,
  price numeric not null,
  "categoryId" text references categories(id),
  image text,
  description text,
  stock int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Habilitar realtime
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table categories;

-- RLS: lectura pública, escritura solo autenticados
alter table products   enable row level security;
alter table categories enable row level security;

create policy "Lectura pública" on products   for select using (true);
create policy "Lectura pública" on categories for select using (true);
create policy "Solo admin"      on products   for all using (auth.role() = 'authenticated');
create policy "Solo admin"      on categories for all using (auth.role() = 'authenticated');

-- Pedidos (checkout + panel admin + /cuenta/pedidos)
-- También disponible en: supabase/orders.sql
create table if not exists orders (
  id text primary key,
  payment_id text,
  user_id text,
  created_at timestamptz default now(),
  status text default 'pending',
  total numeric not null,
  subtotal numeric,
  discount numeric default 0,
  coupon_code text,
  items jsonb not null default '[]',
  email text,
  tracking_number text,
  simulated boolean default false
);

alter table orders enable row level security;

create policy "orders_select_public" on orders for select using (true);
create policy "orders_insert_public" on orders for insert with check (true);
create policy "orders_update_authenticated" on orders for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table orders;

-- Roles del panel admin (ver supabase/user_roles_rls.sql para políticas RLS)
-- create table if not exists public.user_roles ( ... );
```

Si `/admin/usuarios` sale vacío con usuarios en la BBDD, ejecuta `supabase/user_roles_rls.sql` y configura `SUPABASE_SERVICE_ROLE_KEY` en Vercel.

---

## Modos de operación

| Variable faltante          | Comportamiento                                      |
|---------------------------|-----------------------------------------------------|
| Sin Supabase              | localStorage + login demo                           |
| Sin `VITE_STRIPE_*`       | Modo simulación con tarjetas de prueba              |
| Sin Cloudinary            | URL de objeto local (solo válido en la sesión)      |
| Sin Resend                | Pedido se confirma, email se omite silenciosamente  |

