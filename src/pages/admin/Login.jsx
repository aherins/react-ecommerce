import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Info, Store } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { DEMO_USERS, ROLE_LABELS, ROLE_COLORS } from '../../lib/roles'
import './Login.css'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function Login() {
  const { signIn, signInWithGoogle, hasSupabase } = useAuth()
  const navigate = useNavigate()
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [loadingG,    setLoadingG]    = useState(false)
  const [resetSent,   setResetSent]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setResetSent(false); setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/admin')
  }

  async function handleGoogle() {
    setError(''); setLoadingG(true)
    const { error } = await signInWithGoogle()
    if (error) { setError(error.message); setLoadingG(false); return }
    if (!hasSupabase) navigate('/admin')
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    if (!hasSupabase || !supabase) return
    if (!email.trim()) { setError('Introduce tu email para recuperar la contraseña.'); return }
    setError(''); setResetSent(false); setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setResetSent(true)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">ARTESANA</div>
        <h1 className="login-title">Panel de administración</h1>

        {/* Demo credentials table */}
        {!hasSupabase && (
          <div className="demo-creds">
            <div className="demo-creds-header"><Info size={14}/>Credenciales de demo</div>
            <div className="demo-creds-list">
              {DEMO_USERS.map(u => {
                const { bg, color, border } = ROLE_COLORS[u.role]
                return (
                  <button key={u.id} className="demo-cred-row"
                    onClick={() => { setEmail(u.email); setPassword(u.password) }}>
                    <span className="demo-role-badge" style={{ background: bg, color, border: `1px solid ${border}` }}>
                      {ROLE_LABELS[u.role]}
                    </span>
                    <span className="demo-email">{u.email}</span>
                    <span className="demo-pass">{u.password}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Google */}
        <button className="login-google-btn" onClick={handleGoogle} disabled={loadingG}>
          {loadingG ? <span className="dark-spinner"/> : <><GoogleIcon />Continuar con Google</>}
        </button>
        <div className="login-divider"><span>o accede con email</span></div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Email</label>
            <input type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"/>
          </div>
          <div className="form-row">
            <label>Contraseña</label>
            <input type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"/>
          </div>
          {error && <p className="login-error">{error}</p>}
          {resetSent && <p className="login-success">Revisa tu email para restablecer la contraseña.</p>}
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? <span className="spinner"/> : <><LogIn size={16}/>Entrar</>}
          </button>
          {hasSupabase && (
            <button type="button" className="login-forgot" onClick={handleResetPassword}>
              ¿Olvidaste la contraseña?
            </button>
          )}
        </form>

        <Link to="/" className="login-store-link">
          <Store size={16}/> Volver a la tienda
        </Link>
      </div>
    </div>
  )
}
