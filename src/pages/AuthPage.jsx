import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, UserPlus, Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

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

function LoginForm({ onSwitch }) {
  const { signIn, signInWithGoogle, hasSupabase } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [loadingG, setLoadingG] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/cuenta')
  }

  async function handleGoogle() {
    setError(''); setLoadingG(true)
    const { error } = await signInWithGoogle()
    if (error) { setError(error.message); setLoadingG(false); return }
    if (!hasSupabase) navigate('/cuenta')
  }

  return (
    <div className="auth-form">
      <h2>Iniciar sesión</h2>
      <p className="auth-sub">Accede a tu cuenta para gestionar pedidos y lista de deseos</p>

      <button className="google-btn" onClick={handleGoogle} disabled={loadingG}>
        {loadingG ? <span className="spinner dark-spin"/> : <><GoogleIcon />Continuar con Google</>}
      </button>
      <div className="auth-divider"><span>o con email</span></div>

      <form onSubmit={handleSubmit}>
        <div className="field"><label>Email</label>
          <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com"/></div>
        <div className="field"><label>Contraseña</label>
          <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></div>
        {error && <p className="auth-error">{error}</p>}
        <button className="submit-btn" type="submit" disabled={loading}>
          {loading ? <span className="spinner"/> : <><LogIn size={16}/>Entrar</>}
        </button>
      </form>
      <p className="auth-switch">¿No tienes cuenta? <button onClick={onSwitch}>Regístrate</button></p>
    </div>
  )
}

function RegisterForm({ onSwitch }) {
  const { signUp, signInWithGoogle, hasSupabase } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [loadingG, setLoadingG] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    const { error } = await signUp(email, password, { full_name: name })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
  }

  async function handleGoogle() {
    setError(''); setLoadingG(true)
    const { error } = await signInWithGoogle()
    if (error) { setError(error.message); setLoadingG(false); return }
    if (!hasSupabase) navigate('/cuenta')
  }

  if (success) return (
    <div className="auth-form auth-success-msg">
      <div className="success-icon">✓</div>
      <h2>¡Cuenta creada!</h2>
      <p>Revisa tu email para confirmar la cuenta y poder iniciar sesión.</p>
      <button className="submit-btn" onClick={onSwitch}><LogIn size={16}/>Ir a iniciar sesión</button>
    </div>
  )

  return (
    <div className="auth-form">
      <h2>Crear cuenta</h2>
      <p className="auth-sub">Únete para guardar tu lista de deseos y seguir tus pedidos</p>

      <button className="google-btn" onClick={handleGoogle} disabled={loadingG}>
        {loadingG ? <span className="spinner dark-spin"/> : <><GoogleIcon />Registrarse con Google</>}
      </button>
      <div className="auth-divider"><span>o con email</span></div>

      <form onSubmit={handleSubmit}>
        <div className="field"><label>Nombre</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre"/></div>
        <div className="field"><label>Email</label>
          <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com"/></div>
        <div className="field"><label>Contraseña</label>
          <input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/></div>
        {error && <p className="auth-error">{error}</p>}
        <button className="submit-btn" type="submit" disabled={loading}>
          {loading ? <span className="spinner"/> : <><UserPlus size={16}/>Crear cuenta</>}
        </button>
      </form>
      <p className="auth-switch">¿Ya tienes cuenta? <button onClick={onSwitch}>Inicia sesión</button></p>
    </div>
  )
}

export default function AuthForms() {
  const [mode, setMode] = useState('login')

  return (
    <main className="auth-main">
      <div className="auth-container">
        {mode === 'login'
          ? <LoginForm onSwitch={() => setMode('register')} />
          : <RegisterForm onSwitch={() => setMode('login')} />
        }
        <Link to="/" className="auth-store-link">
          <Store size={16}/> Seguir navegando sin iniciar sesión
        </Link>
      </div>
    </main>
  )
}
