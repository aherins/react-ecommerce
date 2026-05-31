import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'
import { can, DEMO_USERS } from '../lib/roles'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [role,    setRole]    = useState(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  // ── Resolver rol desde Supabase ─────────────────────────────────
  async function resolveRole(authUser) {
    if (!authUser) { setRole(null); return }
    if (!hasSupabase) { setRole(authUser._demoRole || null); return }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle()

      // Si no tiene fila en user_roles → rol null (sin acceso admin)
      // Si hay error de RLS u otro → también null, no bloqueamos loading
      setRole((!error && data?.role) || null)
    } catch {
      setRole(null)
    }
  }

  // ── Sesión inicial ──────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabase) {
      const raw = sessionStorage.getItem('demo_session')
      if (raw) {
        try {
          const { user: u, role: r } = JSON.parse(raw)
          setUser(u); setRole(r)
        } catch {}
      }
      setLoading(false)
      return
    }

    // onAuthStateChange dispara SIEMPRE al montar (incluso con sesión existente)
    // Es más fiable que getSession para el primer load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null
        setUser(u)
        await resolveRole(u)

        // Solo desactivar loading la primera vez
        if (!initialized.current) {
          initialized.current = true
          setLoading(false)
        }
      }
    )

    // Timeout de seguridad: si en 5s no responde, quitar el spinner
    const timeout = setTimeout(() => {
      if (!initialized.current) {
        initialized.current = true
        setLoading(false)
      }
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  // ── Email + contraseña ──────────────────────────────────────────
  async function signIn(email, password) {
    if (!hasSupabase) {
      const found = DEMO_USERS.find(u => u.email === email && u.password === password)
      if (!found) return { error: { message: 'Credenciales incorrectas.' } }
      const u = {
        id: found.id, email: found.email, _demoRole: found.role,
        user_metadata: { full_name: found.name },
        app_metadata: { provider: 'demo' },
      }
      sessionStorage.setItem('demo_session', JSON.stringify({ user: u, role: found.role }))
      setUser(u); setRole(found.role)
      return { error: null }
    }
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (!result.error) await resolveRole(result.data.user)
    return result
  }

  // ── Registro ────────────────────────────────────────────────────
  async function signUp(email, password, metadata = {}) {
    if (!hasSupabase) return { error: { message: 'Registro no disponible en modo demo' } }
    return supabase.auth.signUp({ email, password, options: { data: metadata } })
  }

  // ── Google OAuth ────────────────────────────────────────────────
  async function signInWithGoogle() {
    if (!hasSupabase) {
      const u = {
        id: 'demo-google', email: 'google@demo.es', _demoRole: 'viewer',
        user_metadata: { full_name: 'Demo Google', avatar_url: '' },
        app_metadata: { provider: 'google' },
      }
      sessionStorage.setItem('demo_session', JSON.stringify({ user: u, role: 'viewer' }))
      setUser(u); setRole('viewer')
      return { error: null }
    }
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin` },
    })
  }

  // ── Cerrar sesión ───────────────────────────────────────────────
  async function signOut() {
    if (!hasSupabase) {
      sessionStorage.removeItem('demo_session')
      setUser(null); setRole(null)
      return
    }
    await supabase.auth.signOut()
  }

  function userCan(permission) { return can(role, permission) }

  // hasAdminAccess: tiene sesión (el panel mostrará Login si no hay rol)
  const hasAdminAccess = Boolean(user)

  return (
    <AuthContext.Provider value={{
      user, role, loading,
      signIn, signUp, signInWithGoogle, signOut,
      userCan, hasAdminAccess, hasSupabase,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
