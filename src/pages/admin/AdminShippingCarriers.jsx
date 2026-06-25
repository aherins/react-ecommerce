import React, { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Check, Truck, ExternalLink } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import Portal from '../../components/Portal'
import { buildTrackingUrl } from '../../lib/shipping'
import './AdminTable.css'

const EMPTY = {
  name: '', code: '', trackingUrlTemplate: '', phone: '', website: '', notes: '', active: true,
}

export default function AdminShippingCarriers() {
  const { shippingCarriers, orders, dispatch } = useStore()
  const { userCan } = useAuth()
  const [form, setForm] = useState(null)
  const [del, setDel] = useState(null)
  const [previewTracking, setPreviewTracking] = useState('1234567890')

  const canCreate = userCan('envios.crear')
  const canEdit   = userCan('envios.editar')
  const canDelete = userCan('envios.borrar')
  const canToggle = userCan('envios.editar')

  function openNew() { setForm({ ...EMPTY }) }
  function openEdit(c) { setForm({ ...c }) }
  function closeForm() { setForm(null) }

  function handleSave() {
    if (!form.name?.trim()) return
    const carrier = {
      ...form,
      name: form.name.trim(),
      code: (form.code || form.name).trim().toUpperCase().replace(/\s+/g, '_'),
      id: form.id || `carrier-${Date.now()}`,
      createdAt: form.createdAt || new Date().toISOString(),
    }
    dispatch({ type: form.id ? 'SHIPPING_CARRIER_UPDATE' : 'SHIPPING_CARRIER_ADD', carrier })
    closeForm()
  }

  function handleDelete(id) {
    dispatch({ type: 'SHIPPING_CARRIER_DELETE', id })
    setDel(null)
  }

  function toggleActive(c) {
    dispatch({ type: 'SHIPPING_CARRIER_UPDATE', carrier: { ...c, active: !c.active } })
  }

  const countOrders = id => orders.filter(o => o.carrierId === id).length
  const previewUrl = form?.trackingUrlTemplate
    ? buildTrackingUrl(form, previewTracking)
    : null

  return (
    <div className="admin-table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Empresas de envío</h1>
          <p className="page-sub">
            {shippingCarriers.length} transportistas · {shippingCarriers.filter(c => c.active).length} activos
          </p>
        </div>
        {canCreate && (
          <button className="btn-add" onClick={openNew}><Plus size={16}/>Nueva empresa</button>
        )}
      </div>

      {shippingCarriers.length === 0 ? (
        <div className="admin-empty-state">
          <Truck size={40} color="var(--border)"/>
          <h3>Sin empresas de envío</h3>
          <p>Configura los transportistas para asignarlos al enviar pedidos.</p>
          {canCreate && (
            <button className="btn-add" onClick={openNew}><Plus size={16}/>Nueva empresa</button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Código</th>
                <th>Seguimiento</th>
                <th>Pedidos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {shippingCarriers.map(c => (
                <tr key={c.id} className={!c.active ? 'row-inactive' : ''}>
                  <td>
                    <strong>{c.name}</strong>
                    {c.phone && <p className="cell-sub">{c.phone}</p>}
                  </td>
                  <td><code className="slug-pill">{c.code || '—'}</code></td>
                  <td>
                    {c.trackingUrlTemplate ? (
                      <span className="cell-sub" title={c.trackingUrlTemplate}>URL configurada</span>
                    ) : (
                      <span className="cell-sub">Sin URL</span>
                    )}
                  </td>
                  <td>{countOrders(c.id)}</td>
                  <td>
                    <button
                      className={`status-badge ${c.active ? 'active' : 'inactive'}`}
                      onClick={() => canToggle && toggleActive(c)}
                      disabled={!canToggle}
                    >
                      {c.active ? <><Eye size={12}/>Activo</> : <><EyeOff size={12}/>Inactivo</>}
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      {canEdit && (
                        <button className="action-btn edit" onClick={() => openEdit(c)} title="Editar">
                          <Pencil size={14}/>
                        </button>
                      )}
                      {canDelete && (
                        <button className="action-btn del" onClick={() => setDel(c.id)} title="Eliminar">
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
                <h2>{form.id ? 'Editar empresa' : 'Nueva empresa de envío'}</h2>
                <button onClick={closeForm}><X size={20}/></button>
              </div>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-row">
                    <label>Nombre *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: SEUR"/>
                  </div>
                  <div className="form-row">
                    <label>Código</label>
                    <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="SEUR"/>
                  </div>
                </div>
                <div className="form-row">
                  <label>Plantilla URL de seguimiento</label>
                  <input
                    value={form.trackingUrlTemplate}
                    onChange={e => setForm(f => ({ ...f, trackingUrlTemplate: e.target.value }))}
                    placeholder="https://transportista.com/track?n={tracking}"
                  />
                  <p className="form-hint">Usa <code>{'{tracking}'}</code> donde va el número de seguimiento.</p>
                </div>
                {form.trackingUrlTemplate && (
                  <div className="form-row tracking-preview-row">
                    <label>Vista previa</label>
                    <div className="tracking-preview">
                      <input
                        value={previewTracking}
                        onChange={e => setPreviewTracking(e.target.value)}
                        placeholder="Nº de ejemplo"
                      />
                      {previewUrl ? (
                        <a href={previewUrl} target="_blank" rel="noreferrer" className="tracking-preview-link">
                          <ExternalLink size={14}/> Probar enlace
                        </a>
                      ) : (
                        <span className="form-hint">Introduce un número de ejemplo</span>
                      )}
                    </div>
                  </div>
                )}
                <div className="form-grid-2">
                  <div className="form-row">
                    <label>Teléfono</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="902 000 000"/>
                  </div>
                  <div className="form-row">
                    <label>Web</label>
                    <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://…"/>
                  </div>
                </div>
                <div className="form-row">
                  <label>Notas internas</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Tiempos de entrega, tarifas…"/>
                </div>
                <div className="form-row form-check">
                  <label>
                    <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}/>
                    Activa (disponible al enviar pedidos)
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
              <div className="modal-header"><h2>Eliminar empresa</h2></div>
              <div className="modal-body">
                <p>
                  ¿Eliminar esta empresa de envío?
                  {countOrders(del) > 0 && ` Tiene ${countOrders(del)} pedido(s) asociado(s).`}
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
