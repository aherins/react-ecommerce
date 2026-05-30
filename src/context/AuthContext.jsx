import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'

const AuthContext = createContext(null)

const DEMO_EMAIL    = 'admin@artesana.es'
const DEMO_PASSWORD = 'admin1234'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasSupabase) {
      const demo = sessionStorage.getItem('demo_admin')
      if (demo) setUser(JSON.parse(demo))
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Email + contraseña ──────────────────────────────────────────────────────
  async function signIn(email, password) {
    if (!hasSupabase) {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        const u = { id: 'demo', email, role: 'admin', app_metadata: { provider: 'demo' } }
        sessionStorage.setItem('demo_admin', JSON.stringify(u))
        setUser(u)
        return { error: null }
      }
      return { error: { message: 'Credenciales incorrectas. Demo: admin@artesana.es / admin1234' } }
    }
    return supabase.auth.signInWithPassword({ email, password })
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────
  async function signInWithGoogle() {
    if (!hasSupabase) {
      // En demo simulamos el callback inmediatamente
      const u = {
        id: 'demo-google',
        email: 'demo.google@artesana.es',
        user_metadata: { full_name: 'Usuario Demo', avatar_url: '' },
        app_metadata: { provider: 'google' },
      }
      sessionStorage.setItem('demo_admin', JSON.stringify(u))
      setUser(u)
      return { error: null }
    }

    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  async function signOut() {
    if (!hasSupabase) {
      sessionStorage.removeItem('demo_admin')
      setUser(null)
      return
    }
    await supabase.auth.signOut()
  }

  const provider = user?.app_metadata?.provider ?? user?.app_metadata?.providers?.[0] ?? 'email'

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signOut, isAdmin: Boolean(user), provider }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
