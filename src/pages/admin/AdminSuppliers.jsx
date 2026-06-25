import React, { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Check, Factory, Mail, Phone } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import Portal from '../../components/Portal'
import './AdminTable.css'

const EMPTY = {
  name: '', contactName: '', email: '', phone: '', website: '', address: '', notes: '', active: true,
}

export default function AdminSuppliers() {
  const { suppliers, products, dispatch } = useStore()
  const { userCan } = useAuth()
  const [form, setForm] = useState(null)
  const [del, setDel] = useState(null)
  const [search, setSearch] = useState('')

  const canCreate = userCan('proveedores.crear')
  const canEdit   = userCan('proveedores.editar')
  const canDelete = userCan('proveedores.borrar')
  const canToggle = userCan('proveedores.editar')

  const filtered = suppliers.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q)
      || (s.contactName || '').toLowerCase().includes(q)
      || (s.email || '').toLowerCase().includes(q)
  })

  function openNew() { setForm({ ...EMPTY }) }
  function openEdit(s) { setForm({ ...s }) }
  function closeForm() { setForm(null) }

  function handleSave() {
    if (!form.name?.trim()) return
    const supplier = {
      ...form,
      name: form.name.trim(),
      id: form.id || `sup-${Date.now()}`,
      createdAt: form.createdAt || new Date().toISOString(),
    }
    dispatch({ type: form.id ? 'SUPPLIER_UPDATE' : 'SUPPLIER_ADD', supplier })
    closeForm()
  }

  function handleDelete(id) {
    dispatch({ type: 'SUPPLIER_DELETE', id })
    setDel(null)
  }

  function toggleActive(s) {
    dispatch({ type: 'SUPPLIER_UPDATE', supplier: { ...s, active: !s.active } })
  }

  const countProducts = id => products.filter(p => p.supplierId === id).length

  return (
    <div className="admin-table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-sub">
            {suppliers.length} proveedores · {suppliers.filter(s => s.active).length} activos
          </p>
        </div>
        {canCreate && (
          <button className="btn-add" onClick={openNew}><Plus size={16} />Nuevo proveedor</button>
        )}
      </div>

      {suppliers.length > 0 && (
        <div className="orders-search" style={{ marginBottom: 20, borderRadius: 'var(--radius)' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, contacto o email…"
            style={{ minWidth: 260 }}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="admin-empty-state">
          <Factory size={40} color="var(--border)"/>
          <h3>{suppliers.length ? 'Sin resultados' : 'Sin proveedores'}</h3>
          <p>
            {suppliers.length
              ? 'Prueba con otro término de búsqueda.'
              : 'Gestiona los talleres y proveedores de tus productos artesanales.'}
          </p>
          {canCreate && !suppliers.length && (
            <button className="btn-add" onClick={openNew}><Plus size={16}/>Nuevo proveedor</button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Contacto</th>
                <th>Productos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className={!s.active ? 'row-inactive' : ''}>
                  <td>
                    <strong>{s.name}</strong>
                    {s.address && <p className="cell-sub">{s.address}</p>}
                  </td>
                  <td>
                    {s.contactName && <p>{s.contactName}</p>}
                    {s.email && (
                      <p className="cell-sub cell-with-icon"><Mail size={12}/>{s.email}</p>
                    )}
                    {s.phone && (
                      <p className="cell-sub cell-with-icon"><Phone size={12}/>{s.phone}</p>
                    )}
                    {!s.contactName && !s.email && !s.phone && '—'}
                  </td>
                  <td>{countProducts(s.id)}</td>
                  <td>
                    <button
                      className={`status-badge ${s.active ? 'active' : 'inactive'}`}
                      onClick={() => canToggle && toggleActive(s)}
                      disabled={!canToggle}
                    >
                      {s.active ? <><Eye size={12}/>Activo</> : <><EyeOff size={12}/>Inactivo</>}
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      {canEdit && (
                        <button className="action-btn edit" onClick={() => openEdit(s)} title="Editar">
                          <Pencil size={14}/>
                        </button>
                      )}
                      {canDelete && (
                        <button className="action-btn del" onClick={() => setDel(s.id)} title="Eliminar">
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
      )}

      {form && (
        <Portal>
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeForm()}>
            <div className="modal">
              <div className="modal-header">
                <h2>{form.id ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
                <button onClick={closeForm}><X size={20}/></button>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <label>Nombre *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Taller Cerámico Luna"/>
                </div>
                <div className="form-grid-2">
                  <div className="form-row">
                    <label>Persona de contacto</label>
                    <input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Nombre"/>
                  </div>
                  <div className="form-row">
                    <label>Teléfono</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+34 600 000 000"/>
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-row">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contacto@proveedor.es"/>
                  </div>
                  <div className="form-row">
                    <label>Web</label>
                    <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://…"/>
                  </div>
                </div>
                <div className="form-row">
                  <label>Dirección</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Ciudad, provincia"/>
                </div>
                <div className="form-row">
                  <label>Notas internas</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Condiciones, plazos de entrega…"/>
                </div>
                <div className="form-row form-check">
                  <label>
                    <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}/>
                    Activo (disponible para asignar a productos)
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={closeForm}>Cancelar</button>
                <button className="btn-save" onClick={handleSave}><Check size={16}/>Guardar</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {del && (
        <Portal>
          <div className="modal-overlay">
            <div className="modal modal-sm">
              <div className="modal-header"><h2>Eliminar proveedor</h2></div>
              <div className="modal-body">
                <p>
                  ¿Eliminar este proveedor?
                  {countProducts(del) > 0 && ` Tiene ${countProducts(del)} producto(s) asociado(s); quedarán sin proveedor.`}
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setDel(null)}>Cancelar</button>
                <button className="btn-danger" onClick={() => handleDelete(del)}><Trash2 size={14}/>Eliminar</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
