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
- Login demo: `admin@artesana.es` / `admin1234`
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
| `/admin/productos`    | CRUD productos + Cloudinary   |
| `/admin/categorias`   | CRUD categorías               |

---

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena las que tengas:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
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
```

---

## Modos de operación

| Variable faltante          | Comportamiento                                      |
|---------------------------|-----------------------------------------------------|
| Sin Supabase              | localStorage + login demo                           |
| Sin `VITE_STRIPE_*`       | Modo simulación con tarjetas de prueba              |
| Sin Cloudinary            | URL de objeto local (solo válido en la sesión)      |
| Sin Resend                | Pedido se confirma, email se omite silenciosamente  |

