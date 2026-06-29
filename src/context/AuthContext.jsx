import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'
import { getPasswordValidation } from '../lib/password'
import { can, DEMO_USERS } from '../lib/roles'
import { customerSync } from '../lib/customerSync'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [role,    setRole]    = useState(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  // ── Resolver rol — FUERA del callback de auth para evitar deadlock ──
  async function resolveRole(authUser) {
    if (!authUser) { setRole(null); return }
    if (!hasSupabase) { setRole(authUser._demoRole || null); return }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle()

      setRole((!error && data?.role) || null)
    } catch {
      setRole(null)
    }
  }

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const u = session?.user ?? null
        setUser(u)

        // ← clave: setTimeout(0) libera el hilo de auth antes de hacer
        //   otra query a Supabase, evitando el deadlock del cliente
        setTimeout(async () => {
          await resolveRole(u)
          if (u && !u._demoRole) {
            await customerSync.ensureProfile(u)
            await customerSync.touchLastSeen(u.id)
          }
          if (!initialized.current) {
            initialized.current = true
            setLoading(false)
          }
        }, 0)
      }
    )

    // Red de seguridad: si en 8s no hubo ningún evento, salir del spinner
    const timeout = setTimeout(() => {
      if (!initialized.current) {
        initialized.current = true
        setLoading(false)
      }
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

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

  async function signUp(email, password, metadata = {}) {
    if (!hasSupabase) return { error: { message: 'Registro no disponible en modo demo' } }
    const pw = getPasswordValidation(password)
    if (!pw.valid) return { error: { message: pw.message } }
    const result = await supabase.auth.signUp({ email, password, options: { data: metadata } })
    if (!result.error && result.data.user) {
      await supabase.from('profiles').upsert({
        id: result.data.user.id,
        email,
        full_name: metadata.full_name || '',
        account_type: 'customer',
      }, { onConflict: 'id' })
    }
    return result
  }

  async function signInWithGoogle(redirectTo = '/cuenta') {
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
      options: { redirectTo: `${window.location.origin}${redirectTo}` },
    })
  }

  async function resetPassword(email) {
    if (!hasSupabase) return { error: { message: 'No disponible en modo demo' } }
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/cuenta`,
    })
  }

  async function signOut() {
    if (!hasSupabase) {
      sessionStorage.removeItem('demo_session')
      setUser(null); setRole(null)
      return
    }
    await supabase.auth.signOut()
  }

  const mustChangePassword = Boolean(user?.user_metadata?.must_change_password)
  function userCan(permission) { return can(role, permission) }

  return (
    <AuthContext.Provider value={{
      user, role, loading,
      signIn, signUp, signInWithGoogle, signOut, resetPassword,
      mustChangePassword,
      userCan,
      hasAdminAccess: Boolean(role),
      hasSupabase,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  // Seguro para usar fuera del AuthProvider (rutas públicas)
  if (!ctx) return {
    user: null, role: null, loading: false,
    signIn: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signInWithGoogle: async () => ({ error: null }),
    signOut: async () => {},
    resetPassword: async () => ({ error: null }),
    mustChangePassword: false,
    userCan: () => false,
    hasAdminAccess: false,
    hasSupabase: false,
  }
  return ctx
}
