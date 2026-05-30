import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { hasSupabase } from '../../lib/supabase'
import './Login.css'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/admin')
  }

  function fillDemo() {
    setEmail('admin@artesana.es')
    setPassword('admin1234')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">ARTESANA</div>
        <h1 className="login-title">Panel de administración</h1>

        {!hasSupabase && (
          <div className="login-demo-banner">
            <Info size={15} />
            <span>
              Modo demo (sin Supabase) — <button onClick={fillDemo}>rellenar credenciales demo</button>
            </span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Email</label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@artesana.es"
            />
          </div>
          <div className="form-row">
            <label>Contraseña</label>
            <input
              type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <><LogIn size={16} />Entrar</>}
          </button>
        </form>
      </div>
    </div>
  )
}