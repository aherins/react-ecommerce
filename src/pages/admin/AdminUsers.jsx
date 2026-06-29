import React, { useState, useEffect } from 'react'
import { Plus, Trash2, X, Check, Shield, Mail, User, KeyRound, RotateCcw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase, hasSupabase } from '../../lib/supabase'
import { createAdminUser, fetchAdminUsers, resetAdminUserPassword } from '../../lib/adminUsersApi'
import { ROLES, ROLE_LABELS, ROLE_COLORS, DEMO_USERS } from '../../lib/roles'
import Portal from '../../components/Portal'
import PasswordField from '../../components/PasswordField'
import { getPasswordValidation } from '../../lib/password'
import '../admin/AdminTable.css'
import './AdminUsers.css'

function RoleBadge({ role }) {
  const { bg, color, border } = ROLE_COLORS[role] || {}
  return <span className="role-badge-sm" style={{ background: bg, color, border: `1px solid ${border}` }}>{ROLE_LABELS[role] || role}</span>
}

export default function AdminUsers() {
  const { user: currentUser, userCan } = useAuth()
  const canCreate = userCan('usuarios.crear')
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)   // null | { mode: 'invite'|'edit', user? }
  const [delId,   setDelId]   = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [resettingId, setResettingId] = useState('')
  const [error,   setError]   = useState('')
  const [info, setInfo] = useState('')
  const [loadError, setLoadError] = useState('')

  // Form state
  const [email,    setEmail]    = useState('')
  const [name,     setName]     = useState('')
  const [password, setPassword] = useState('')
  const [selRole,  setSelRole]  = useState('viewer')

  useEffect(() => { loadUsers() }, [])

  async function loadUsersFromClient() {
    const { data: roles, error: rolesErr } = await supabase
      .from('user_roles')
      .select('user_id, role, created_at')
      .order('created_at', { ascending: false })

    if (rolesErr) throw rolesErr
    if (!roles?.length) return []

    const ids = roles.map(r => r.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', ids)

    const profileById = Object.fromEntries((profiles || []).map(p => [p.id, p]))
    return roles.map(r => ({
      id: r.user_id,
      role: r.role,
      email: profileById[r.user_id]?.email || '—',
      name: profileById[r.user_id]?.full_name || '',
      created_at: r.created_at,
    }))
  }

  async function loadUsers() {
    setLoading(true)
    setLoadError('')
    setInfo('')
    if (!hasSupabase) {
      setUsers(DEMO_USERS.map(u => ({
        id: u.id, email: u.email, role: u.role,
        name: u.name, created_at: new Date().toISOString(),
      })))
      setLoading(false)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        try {
          const users = await fetchAdminUsers(session.access_token)
          setUsers(users)
          setLoading(false)
          return
        } catch (apiErr) {
          // Sin API en local o sin service role: intentar lectura directa
          console.warn('list-admin-users:', apiErr.message)
        }
      }
      setUsers(await loadUsersFromClient())
    } catch (err) {
      setUsers([])
      setLoadError(err.message || 'No se pudieron cargar los usuarios.')
    }
    setLoading(false)
  }

  function openInvite() {
    setEmail(''); setName(''); setPassword(''); setSelRole('viewer'); setError('')
    setModal({ mode: 'invite' })
  }

  function openEdit(u) {
    setSelRole(u.role); setError('')
    setModal({ mode: 'edit', user: u })
  }

  async function handleInvite() {
    if (!email.trim()) { setError('Introduce un email.'); return }
    const pw = getPasswordValidation(password)
    if (!pw.valid) { setError(pw.message); return }
    setSaving(true); setError(''); setInfo('')
    if (!hasSupabase) {
      setUsers(prev => [...prev, {
        id: `demo-${Date.now()}`, email, role: selRole,
        name: name.trim() || email.split('@')[0],
        created_at: new Date().toISOString(),
      }])
      setModal(null); setSaving(false); return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sesión expirada. Vuelve a iniciar sesión.')
      await createAdminUser({
        email: email.trim(),
        password,
        role: selRole,
        name: name.trim(),
        accessToken: session.access_token,
      })
      await loadUsers()
      setInfo('Usuario creado. Se ha enviado un correo con la contraseña temporal.')
      setModal(null)
    } catch (err) {
      setError(err.message || 'No se pudo crear el usuario.')
    }
    setSaving(false)
  }

  async function handleEditRole() {
    setSaving(true); setError(''); setInfo('')
    if (!hasSupabase) {
      setUsers(prev => prev.map(u => u.id === modal.user.id ? { ...u, role: selRole } : u))
      setModal(null); setSaving(false); return
    }
    const { error } = await supabase.from('user_roles')
      .upsert({ user_id: modal.user.id, role: selRole }, { onConflict: 'user_id' })
    if (error) { setError(error.message); setSaving(false); return }
    await loadUsers()
    setModal(null); setSaving(false)
  }

  async function handleDelete(userId) {
    if (!hasSupabase) {
      setUsers(prev => prev.filter(u => u.id !== userId))
      setDelId(null); return
    }
    await supabase.from('user_roles').delete().eq('user_id', userId)
    await loadUsers()
    setDelId(null)
  }

  async function handleResetPassword(userId) {
    if (!hasSupabase) {
      setError('No disponible en modo demo.')
      return
    }
    setResettingId(userId)
    setError('')
    setInfo('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sesión expirada. Vuelve a iniciar sesión.')
      const result = await resetAdminUserPassword({ userId, accessToken: session.access_token })
      if (result.emailSent) {
        setInfo('Contraseña temporal generada y enviada por email.')
      } else {
        setInfo(`Contraseña temporal generada (${result.tempPassword}). Email no enviado.`)
      }
    } catch (err) {
      setError(err.message || 'No se pudo resetear la contraseña.')
    }
    setResettingId('')
  }

  return (
    <div className="admin-table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios y roles</h1>
          <p className="page-sub">{users.length} usuarios con acceso al panel</p>
        </div>
        {canCreate && (
          <button className="btn-add" onClick={openInvite}><Plus size={16}/>Nuevo usuario</button>
        )}
      </div>

      {loadError && <p className="form-error users-load-error">{loadError}</p>}
      {info && <p className="users-info">{info}</p>}

      {/* Role legend */}
      <div className="roles-legend">
        {Object.entries(ROLES).map(([, role]) => (
          <div key={role} className="legend-item">
            <RoleBadge role={role}/>
            <span className="legend-perms">{ROLE_PERMISSIONS_SUMMARY[role]}</span>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>Usuario</th><th>Email</th><th>Rol</th><th>Desde</th><th>Acciones</th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="table-loading">Cargando…</td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan={5} className="table-empty">Sin usuarios</td></tr>}
            {users.map(u => (
              <tr key={u.id} className={u.id === currentUser?.id ? 'row-current' : ''}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar-sm">{(u.name || u.email)[0].toUpperCase()}</div>
                    <span>{u.name || '—'}</span>
                    {u.id === currentUser?.id && <span className="you-tag">Tú</span>}
                  </div>
                </td>
                <td style={{fontSize:13,color:'var(--muted)'}}>{u.email}</td>
                <td><RoleBadge role={u.role}/></td>
                <td style={{fontSize:13,color:'var(--muted)'}}>{new Date(u.created_at).toLocaleDateString('es-ES')}</td>
                <td>
                  <div className="row-actions">
                    {canCreate && (
                      <button
                        className="action-btn edit"
                        onClick={() => handleResetPassword(u.id)}
                        title="Resetear contraseña"
                        disabled={u.id === currentUser?.id || resettingId === u.id}
                      >
                        <RotateCcw size={14}/>
                      </button>
                    )}
                    {canCreate && (
                      <button className="action-btn edit" onClick={() => openEdit(u)} title="Cambiar rol"
                        disabled={u.id === currentUser?.id}>
                        <Shield size={14}/>
                      </button>
                    )}
                    {canCreate && (
                      <button className="action-btn del" onClick={() => setDelId(u.id)} title="Eliminar acceso"
                        disabled={u.id === currentUser?.id}>
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite / Edit modal */}
      {modal && (
        <Portal><div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2>{modal.mode === 'invite' ? 'Nuevo usuario' : 'Cambiar rol'}</h2>
              <button onClick={() => setModal(null)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              {modal.mode === 'invite' && (
                <>
                  <div className="form-row">
                    <label><Mail size={13}/> Email</label>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="viewer@artesana.es"/>
                  </div>
                  <div className="form-row">
                    <label><User size={13}/> Nombre</label>
                    <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Visualizador"/>
                  </div>
                  <div className="form-row">
                    <label><KeyRound size={13}/> Contraseña inicial</label>
                    <PasswordField value={password} onChange={setPassword} />
                  </div>
                  <p className="form-hint">Se crea la cuenta en Supabase con el rol elegido. Si Resend está configurado, se envía un email con las credenciales.</p>
                </>
              )}
              {modal.mode === 'edit' && (
                <div className="current-user-info">
                  <div className="user-avatar-sm lg">{(modal.user.name || modal.user.email)[0].toUpperCase()}</div>
                  <div>
                    <p className="cui-name">{modal.user.name || modal.user.email}</p>
                    <p className="cui-email">{modal.user.email}</p>
                  </div>
                </div>
              )}
              <div className="form-row" style={{marginTop: modal.mode==='invite'?0:16}}>
                <label><Shield size={13}/> Rol</label>
                <div className="role-selector">
                  {Object.entries(ROLES).map(([, r]) => {
                    const { bg, color, border } = ROLE_COLORS[r]
                    return (
                      <label key={r} className={`role-option ${selRole === r ? 'selected' : ''}`}
                        style={selRole === r ? { background: bg, borderColor: border } : {}}>
                        <input type="radio" name="role" value={r} checked={selRole===r} onChange={()=>setSelRole(r)}/>
                        <div>
                          <span className="role-opt-name" style={selRole===r?{color}:{}}>{ROLE_LABELS[r]}</span>
                          <span className="role-opt-desc">{ROLE_PERMISSIONS_SUMMARY[r]}</span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
              {error && <p className="form-error">{error}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-save" onClick={modal.mode==='invite' ? handleInvite : handleEditRole} disabled={saving}>
                {saving ? <span className="spinner"/> : <><Check size={15}/>{modal.mode==='invite' ? 'Crear usuario' : 'Guardar cambios'}</>}
              </button>
            </div>
          </div>
        </div>
      </Portal>
      )}

      {/* Delete confirm */}
      {delId && (
        <Portal><div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><h2>Eliminar acceso</h2></div>
            <div className="modal-body"><p>¿Eliminar el acceso al panel de este usuario? No se elimina su cuenta, solo sus permisos.</p></div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDelId(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => handleDelete(delId)}><Trash2 size={14}/>Eliminar</button>
            </div>
          </div>
        </div>
      </Portal>
      )}
    </div>
  )
}

const ROLE_PERMISSIONS_SUMMARY = {
  superadmin: 'Acceso total · gestiona usuarios y roles',
  admin:      'Panel completo · no puede gestionar usuarios',
  editor:     'Productos, pedidos y envíos · sin estadísticas',
  viewer:     'Solo lectura · puede ver pedidos',
}
