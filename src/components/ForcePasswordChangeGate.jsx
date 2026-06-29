import React, { useMemo, useState } from 'react'
import { LockKeyhole, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, hasSupabase } from '../lib/supabase'
import { getPasswordValidation } from '../lib/password'
import PasswordField from './PasswordField'
import './ForcePasswordChangeGate.css'

export default function ForcePasswordChangeGate() {
  const { user, signOut, mustChangePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const validation = useMemo(() => getPasswordValidation(password), [password])

  if (!user || !mustChangePassword) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!hasSupabase || !supabase) {
      setError('No disponible en modo demo.')
      return
    }
    if (!validation.valid) {
      setError(validation.message)
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)
    const nextMetadata = {
      ...(user.user_metadata || {}),
      must_change_password: false,
      password_changed_at: new Date().toISOString(),
    }
    const { error: upErr } = await supabase.auth.updateUser({
      password,
      data: nextMetadata,
    })
    setSaving(false)
    if (upErr) {
      setError(upErr.message || 'No se pudo actualizar la contraseña.')
      return
    }
    setDone(true)
    setPassword('')
    setConfirm('')
  }

  return (
    <div className="password-gate-overlay">
      <div className="password-gate-card">
        <div className="password-gate-header">
          <LockKeyhole size={20} />
          <h2>Cambia tu contraseña temporal</h2>
        </div>
        <p className="password-gate-sub">
          Por seguridad, debes crear una nueva contraseña antes de continuar.
        </p>
        {done ? (
          <p className="password-gate-ok">Contraseña actualizada. Ya puedes seguir usando la aplicación.</p>
        ) : (
          <form className="password-gate-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Nueva contraseña</label>
              <PasswordField
                value={password}
                onChange={setPassword}
                placeholder="Nueva contraseña segura"
                autoComplete="new-password"
                showGenerate={false}
              />
            </div>
            <div className="field">
              <label>Confirmar contraseña</label>
              <PasswordField
                value={confirm}
                onChange={setConfirm}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                showRules={false}
                showGenerate={false}
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}
        <button type="button" className="password-gate-signout" onClick={signOut}>
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}
