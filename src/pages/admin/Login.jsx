import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { hasSupabase } from '../../lib/supabase'
import './Login.css'

// SVG del logo de Google (inline, sin dependencias)
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/admin')
  }

  async function handleGoogle() {
    setError('')
    setLoadingGoogle(true)
    const { error } = await signInWithGoogle()
    // Con Supabase real: redirige a Google → vuelve a /admin automáticamente
    // En modo demo: setUser ya ocurrió en signInWithGoogle, redirigimos aquí
    if (!error && !hasSupabase) {
      navigate('/admin')
      return
    }
    if (error) {
      setError(error.message)
      setLoadingGoogle(false)
    }
    // Si no hay error con Supabase real, la redirección la gestiona el proveedor OAuth
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
              Modo demo (sin Supabase) —{' '}
              <button onClick={fillDemo}>rellenar credenciales</button>
            </span>
          </div>
        )}

        {/* ── Google OAuth ─────────────────────────────────────────────── */}
        <button
          className="login-google-btn"
          onClick={handleGoogle}
          disabled={loadingGoogle}
          type="button"
        >
          {loadingGoogle
            ? <span className="spinner dark-spinner" />
            : <><GoogleIcon />{hasSupabase ? 'Continuar con Google' : 'Demo Google'}</>
          }
        </button>

        <div className="login-divider">
          <span>o accede con email</span>
        </div>

        {/* ── Email + contraseña ───────────────────────────────────────── */}
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
