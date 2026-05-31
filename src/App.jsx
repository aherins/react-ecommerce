import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider } from './context/StoreContext'
import { AuthProvider } from './context/AuthContext'
import StoreFront from './pages/StoreFront'
import ProductDetail from './pages/ProductDetail'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
// import WishlistPage from './pages/WishlistPage'
// import ContactPage from './pages/ContactPage'
// import TrackingPage from './pages/TrackingPage'
// import AuthPage from './pages/AuthPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
// import AdminOrders from './pages/admin/AdminOrders'
// import AdminStats from './pages/admin/AdminStats'
// import AdminShipping from './pages/admin/AdminShipping'

export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"            element={<StoreFront />} />
            <Route path="/producto/:id" element={<ProductDetail />} />
            <Route path="/carrito"     element={<CartPage />} />
            <Route path="/checkout"    element={<CheckoutPage />} />
            {/* <Route path="/deseos"      element={<WishlistPage />} /> */}
            {/* <Route path="/contacto"    element={<ContactPage />} /> */}
            <Route path="/seguimiento" element={<TrackingPage />} />
            <Route path="/seguimiento/:orderId" element={<TrackingPage />} />
            <Route path="/cuenta"      element={<AuthPage />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index                  element={<AdminDashboard />} />
              {/* <Route path="pedidos"         element={<AdminOrders />} /> */}
              <Route path="productos"       element={<AdminProducts />} />
              <Route path="categorias"      element={<AdminCategories />} />
              {/* <Route path="estadisticas"    element={<AdminStats />} /> */}
              {/* <Route path="envios"          element={<AdminShipping />} /> */}
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </StoreProvider>
  )
}