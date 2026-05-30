import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    return supabase.auth.signInWithPassword({ email, password })
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────
  async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const provider = user?.app_metadata?.provider
    ?? user?.app_metadata?.providers?.[0]
    ?? 'email'

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signOut, isAdmin: Boolean(user), provider }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
