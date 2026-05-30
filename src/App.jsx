import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider } from './context/StoreContext'
import { AuthProvider } from './context/AuthContext'
import StoreFront from './pages/StoreFront'
import ProductDetail from './pages/ProductDetail'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminDashboard from './pages/admin/AdminDashboard'

export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Tienda */}
            <Route path="/" element={<StoreFront />} />
            <Route path="/producto/:id" element={<ProductDetail />} />
            <Route path="/carrito" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="productos" element={<AdminProducts />} />
              <Route path="categorias" element={<AdminCategories />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </StoreProvider>
  )
}
