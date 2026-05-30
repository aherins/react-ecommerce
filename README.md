# ShopMVP — Tienda + Panel Admin

MVP de tienda online con panel de administración. React + Vite, desplegable en Vercel.

## Stack
- **React 18** + **React Router v6**
- **Vite** (build tool / dev server)
- **localStorage** para persistencia (sin backend)
- **Lucide React** para iconos
- **Vercel** para despliegue

## Estructura
```
src/
  context/
    StoreContext.jsx   ← Estado global (productos, categorías, carrito)
  components/
    Navbar.jsx
    ProductCard.jsx
  pages/
    StoreFront.jsx     ← Tienda principal
    ProductDetail.jsx  ← Detalle de producto
    CartPage.jsx       ← Carrito
    admin/
      AdminLayout.jsx  ← Sidebar + layout admin
      AdminDashboard.jsx
      AdminProducts.jsx  ← CRUD productos
      AdminCategories.jsx ← CRUD categorías
```

## Desarrollo local

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Rutas

| Ruta                | Descripción              |
|---------------------|--------------------------|
| `/`                 | Tienda principal         |
| `/producto/:id`     | Detalle de producto      |
| `/carrito`          | Carrito de compra        |
| `/admin`            | Dashboard admin          |
| `/admin/productos`  | CRUD de productos        |
| `/admin/categorias` | CRUD de categorías       |

## Desplegar en Vercel

### Opción A — Vercel CLI
```bash
npm install -g vercel
vercel
```

### Opción B — GitHub + Vercel Dashboard
1. Sube el proyecto a GitHub
2. Ve a [vercel.com](https://vercel.com) → "New Project"
3. Importa tu repositorio
4. Configuración automática (detecta Vite):
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Deploy ✓

El archivo `vercel.json` ya incluye el rewrite necesario para el SPA routing.

## Próximos pasos (producción)

- [ ] Reemplazar localStorage con backend real (Supabase, Firebase, etc.)
- [ ] Añadir autenticación al panel admin
- [ ] Integrar pasarela de pago (Stripe, Redsys)
- [ ] Subida de imágenes (Cloudinary, S3)
- [ ] SEO + Open Graph meta tags
