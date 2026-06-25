import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase, hasSupabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

export default function AccountProfilePage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    if (!hasSupabase) { setError('No disponible en modo demo'); return }
    setSaving(true); setError(''); setMsg('')
    const { error: err } = await supabase.auth.updateUser({ data: { full_name: name } })
    if (err) setError(err.message)
    else {
      await supabase.from('profiles').upsert({
        id: user.id, email: user.email, full_name: name, account_type: 'customer',
      }, { onConflict: 'id' })
      setMsg('Perfil actualizado.')
    }
    setSaving(false)
  }

  return (
    <>
      <PageMeta title="Mi perfil"/>
      <div className="account-content-header"><h2>Mi perfil</h2></div>
      <form className="profile-form" onSubmit={handleSave}>
        <div className="field"><label>Email</label><input value={user?.email || ''} disabled/></div>
        <div className="field"><label>Nombre</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"/></div>
        {error && <p className="auth-error">{error}</p>}
        {msg && <p className="profile-ok">{msg}</p>}
        <button type="submit" className="submit-btn" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </>
  )
}
