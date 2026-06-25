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
import StoreLayout from './components/StoreLayout'
import RequireAccount from './pages/account/RequireAccount'
import AccountLayout from './pages/account/AccountLayout'
import AccountDashboard from './pages/account/AccountDashboard'
import MyOrdersPage from './pages/MyOrdersPage'
import AdminLayout, { RequirePermission } from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminStats from './pages/admin/AdminStats'
import AdminUsers from './pages/admin/AdminUsers'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminCustomerDetail from './pages/admin/AdminCustomerDetail'
import AdminSuppliers from './pages/admin/AdminSuppliers'
import AdminShippingCarriers from './pages/admin/AdminShippingCarriers'
import LegalPage from './pages/LegalPage'
import NotFoundPage from './pages/NotFoundPage'
import AccountProfilePage from './pages/account/AccountProfilePage'

// AuthProvider envuelve TODA la app pero el loading ya no bloquea
// rutas públicas gracias al fix en AuthContext (loading solo afecta a AdminLayout)
export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<StoreLayout />}>
              <Route path="/"                     element={<StoreFront />} />
              <Route path="/producto/:id"         element={<ProductDetail />} />
              <Route path="/carrito"              element={<CartPage />} />
              <Route path="/checkout"             element={<CheckoutPage />} />
              <Route path="/deseos"               element={<WishlistPage />} />
              <Route path="/contacto"             element={<ContactPage />} />
              <Route path="/seguimiento"          element={<TrackingPage />} />
              <Route path="/seguimiento/:orderId" element={<TrackingPage />} />
              <Route path="/legal/:page" element={<LegalPage />} />
              <Route path="/cuenta" element={<RequireAccount />}>
                <Route element={<AccountLayout />}>
                  <Route index element={<AccountDashboard />} />
                  <Route path="pedidos" element={<MyOrdersPage />} />
                  <Route path="perfil" element={<AccountProfilePage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* ── Admin ─────────────────────────────────────────── */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={
                <RequirePermission permission="dashboard"><AdminDashboard /></RequirePermission>
              }/>
              <Route path="pedidos" element={
                <RequirePermission permission="pedidos.ver"><AdminOrders /></RequirePermission>
              }/>
              <Route path="productos" element={
                <RequirePermission permission="productos.ver"><AdminProducts /></RequirePermission>
              }/>
              <Route path="categorias" element={
                <RequirePermission permission="categorias.ver"><AdminCategories /></RequirePermission>
              }/>
              <Route path="proveedores" element={
                <RequirePermission permission="proveedores.ver"><AdminSuppliers /></RequirePermission>
              }/>
              <Route path="envios" element={
                <RequirePermission permission="envios.ver"><AdminShippingCarriers /></RequirePermission>
              }/>
              <Route path="estadisticas" element={
                <RequirePermission permission="estadisticas.ver"><AdminStats /></RequirePermission>
              }/>
              <Route path="usuarios" element={
                <RequirePermission permission="usuarios.ver"><AdminUsers /></RequirePermission>
              }/>
              <Route path="cupones" element={
                <RequirePermission permission="cupones.ver"><AdminCoupons /></RequirePermission>
              }/>
              <Route path="clientes" element={
                <RequirePermission permission="clientes.ver"><AdminCustomers /></RequirePermission>
              }/>
              <Route path="clientes/:id" element={
                <RequirePermission permission="clientes.ver"><AdminCustomerDetail /></RequirePermission>
              }/>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </StoreProvider>
  )
}
