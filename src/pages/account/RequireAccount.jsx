import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthForms from '../AuthPage'

export default function RequireAccount() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-main">
        <span className="spinner dark"/>
      </div>
    )
  }

  if (!user) return <AuthForms />

  return <Outlet />
}
