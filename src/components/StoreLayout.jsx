import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function StoreLayout() {
  return (
    <div className="page-shell">
      <Navbar />
      <div className="page-body">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
