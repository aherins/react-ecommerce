import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, hasSupabase } from './lib/supabase'

const AuthContext = createContext(null)

// ─── Demo credentials (cuando no hay Supabase) ────────────────────────────────
const DEMO_EMAIL    = 'admin@artesana.es'
const DEMO_PASSWORD = 'admin1234'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasSupabase) {
      // Recuperar sesión demo de sessionStorage
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

  async function signIn(email, password) {
    if (!hasSupabase) {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        const u = { id: 'demo', email, role: 'admin' }
        sessionStorage.setItem('demo_admin', JSON.stringify(u))
        setUser(u)
        return { error: null }
      }
      return { error: { message: 'Credenciales incorrectas. Demo: admin@artesana.es / admin1234' } }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signOut() {
    if (!hasSupabase) {
      sessionStorage.removeItem('demo_admin')
      setUser(null)
      return
    }
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export default App