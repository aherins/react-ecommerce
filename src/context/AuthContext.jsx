import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'
import { can, DEMO_USERS } from '../lib/roles'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [role,    setRole]    = useState(null)   // rol resuelto
  const [loading, setLoading] = useState(true)

  // ── Resolver rol desde Supabase ─────────────────────────────────────────────
  async function resolveRole(authUser) {
    if (!authUser) { setRole(null); return }

    if (!hasSupabase) {
      // En demo: el rol viene en user._demoRole
      setRole(authUser._demoRole || null)
      return
    }

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id)
      .maybeSingle()

    setRole(data?.role ?? null)
  }

  // ── Sesión inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabase) {
      const raw = sessionStorage.getItem('demo_session')
      if (raw) {
        try {
          const { user: u, role: r } = JSON.parse(raw)
          setUser(u)
          setRole(r)
        } catch {}
      }
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      await resolveRole(u)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const u = session?.user ?? null
      setUser(u)
      await resolveRole(u)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Email + contraseña ──────────────────────────────────────────────────────
  async function signIn(email, password) {
    if (!hasSupabase) {
      const found = DEMO_USERS.find(u => u.email === email && u.password === password)
      if (!found) return { error: { message: 'Credenciales incorrectas.' } }

      const u = {
        id: found.id,
        email: found.email,
        _demoRole: found.role,
        user_metadata: { full_name: found.name },
        app_metadata: { provider: 'demo' },
      }

      sessionStorage.setItem('demo_session', JSON.stringify({ user: u, role: found.role }))
      setUser(u)
      setRole(found.role)
      return { error: null }
    }

    const result = await supabase.auth.signInWithPassword({ email, password })
    if (!result.error) await resolveRole(result.data.user)
    return result
  }

  // ── Registro ────────────────────────────────────────────────────────────────
  async function signUp(email, password, metadata = {}) {
    if (!hasSupabase) return { error: { message: 'Registro no disponible en modo demo' } }
    return supabase.auth.signUp({ email, password, options: { data: metadata } })
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────
  async function signInWithGoogle() {
    if (!hasSupabase) {
      const u = {
        id: 'demo-google',
        email: 'google@demo.es',
        _demoRole: 'viewer',
        user_metadata: { full_name: 'Demo Google', avatar_url: '' },
        app_metadata: { provider: 'google' },
      }

      sessionStorage.setItem('demo_session', JSON.stringify({ user: u, role: 'viewer' }))
      setUser(u)
      setRole('viewer')
      return { error: null }
    }
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin` },
    })
  }

  // ── Cerrar sesión ───────────────────────────────────────────────────────────
  async function signOut() {
    if (!hasSupabase) {
      sessionStorage.removeItem('demo_session')
      setUser(null)
      setRole(null)
      return
    }
    await supabase.auth.signOut()
  }

  // ── Helper de permisos ──────────────────────────────────────────────────────
  function userCan(permission) {
    return can(role, permission)
  }

  const hasAdminAccess = Boolean(role) // cualquier rol puede entrar al panel

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        userCan,
        hasAdminAccess,
        hasSupabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
