import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider } from './context/StoreContext'
import { AuthProvider } from './context/AuthContext'
import StoreFront from './pages/StoreFront'
import ProductDetail from './pages/ProductDetail'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import WishlistPage from './pages/WishlistPage'
import ContactPage from './pages/ContactPage'
import TrackingPage from './pages/TrackingPage'
import AuthPage from './pages/AuthPage'
import MyOrdersPage from './pages/MyOrdersPage'
import AdminLayout, { RequirePermission } from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminStats from './pages/admin/AdminStats'
import AdminShipping from './pages/admin/AdminShipping'
import AdminUsers from './pages/admin/AdminUsers'
import AdminCoupons from './pages/admin/AdminCoupons'

// AuthProvider envuelve TODA la app pero el loading ya no bloquea
// rutas públicas gracias al fix en AuthContext (loading solo afecta a AdminLayout)
export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Tienda pública ─────────────────────────────────── */}
            <Route path="/"                     element={<StoreFront />} />
            <Route path="/producto/:id"         element={<ProductDetail />} />
            <Route path="/carrito"              element={<CartPage />} />
            <Route path="/checkout"             element={<CheckoutPage />} />
            <Route path="/deseos"               element={<WishlistPage />} />
            <Route path="/contacto"             element={<ContactPage />} />
            <Route path="/seguimiento"          element={<TrackingPage />} />
            <Route path="/seguimiento/:orderId" element={<TrackingPage />} />
            <Route path="/cuenta"               element={<AuthPage />} />
            <Route path="/cuenta/pedidos"       element={<MyOrdersPage />} />

            {/* ── Admin ─────────────────────────────────────────── */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={
                <RequirePermission permission="dashboard"><AdminDashboard /></RequirePermission>
              }/>
              <Route path="pedidos" element={
                <RequirePermission permission="pedidos.ver"><AdminOrders /></RequirePermission>
              }/>
              <Route path="productos" element={
                <RequirePermission permission="productos"><AdminProducts /></RequirePermission>
              }/>
              <Route path="categorias" element={
                <RequirePermission permission="categorias"><AdminCategories /></RequirePermission>
              }/>
              <Route path="estadisticas" element={
                <RequirePermission permission="estadisticas.ver"><AdminStats /></RequirePermission>
              }/>
              <Route path="envios" element={
                <RequirePermission permission="envios"><AdminShipping /></RequirePermission>
              }/>
              <Route path="usuarios" element={
                <RequirePermission permission="usuarios.ver"><AdminUsers /></RequirePermission>
              }/>
              <Route path="cupones" element={
                <RequirePermission permission="cupones"><AdminCoupons /></RequirePermission>
              }/>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </StoreProvider>
  )
}
