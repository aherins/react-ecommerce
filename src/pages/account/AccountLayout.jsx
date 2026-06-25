import React from 'react'
import { Outlet } from 'react-router-dom'
import AccountSidebar from './AccountSidebar'
import './AccountLayout.css'

export default function AccountLayout() {
  return (
    <main className="account-main">
      <div className="account-inner">
        <div className="account-layout">
          <AccountSidebar />
          <section className="account-content">
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  )
}
