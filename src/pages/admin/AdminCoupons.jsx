import React, { useState } from 'react'
import {
  Plus, Pencil, Trash2, X, Check, Copy, RefreshCw,
  Tag, Users, User, Percent, Euro, Truck, Package
} from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import {
  COUPON_SCOPE, DISCOUNT_TYPE,
  SCOPE_LABEL, DTYPE_LABEL, generateCode,
} from '../../lib/coupons'
import Portal from '../../components/Portal'
import '../admin/AdminTable.css'
import './AdminCoupons.css'

// ─── Badges ───────────────────────────────────────────────────────────────────
const SCOPE_STYLE = {
  general:  { bg:'#ede9fe', color:'#5b21b6', border:'#ddd6fe' },
  per_user: { bg:'#dbeafe', color:'#1e40af', border:'#bfdbfe' },
  specific: { bg:'#fce7f3', color:'#9d174d', border:'#fbcfe8' },
}
const DTYPE_ICON = {
  percent:   <Percent size={13}/>,
  fixed:     <Euro size={13}/>,
  free_ship: <Truck size={13}/>,
  bogo:      <Package size={13}/>,
}

function ScopeBadge({ scope }) {
  const s = SCOPE_STYLE[scope] || {}
  return <span className="badge" style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{SCOPE_LABEL[scope]}</span>
}

// ─── Estado inicial del formulario ────────────────────────────────────────────
const EMPTY_FORM = {
  code: '', description: '',
  scope: COUPON_SCOPE.GENERAL, specificEmail: '',
  discountType: DISCOUNT_TYPE.PERCENT, discountValue: '',
  minAmount: '', minItems: '',
  maxUses: '', expiresAt: '',
  active: true,
}

// ─── Modal de creación / edición ──────────────────────────────────────────────
function CouponModal({ form, setForm, onSave, onClose, isEdit }) {
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard?.writeText(form.code)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const showEmail    = form.scope === COUPON_SCOPE.SPECIFIC
  const showValue    = form.discountType !== DISCOUNT_TYPE.FREE_SHIP && form.discountType !== DISCOUNT_TYPE.BOGO
  const discountUnit = form.discountType === DISCOUNT_TYPE.PERCENT ? '%' : '€'

  return (
    <Portal>
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal coupon-modal">
        <div className="modal-header">
          <h2>{isEdit ? 'Editar cupón' : 'Nuevo cupón'}</h2>
          <button onClick={onClose}><X size={20}/></button>
        </div>

        <div className="modal-body">
          {/* Código */}
          <div className="form-row">
            <label>Código *</label>
            <div className="code-input-row">
              <input
                value={form.code}
                onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))}
                placeholder="DESCUENTO10"
                className="code-input"
              />
              <button className="icon-btn" title="Copiar" onClick={copyCode}>
                {copied ? <Check size={15} color="var(--success)"/> : <Copy size={15}/>}
              </button>
              <button className="icon-btn" title="Generar automáticamente"
                onClick={() => setForm(f => ({...f, code: generateCode()}))}>
                <RefreshCw size={15}/>
              </button>
            </div>
            <p className="field-hint">Haz clic en <RefreshCw size={11}/> para generar un código aleatorio.</p>
          </div>

          {/* Descripción */}
          <div className="form-row">
            <label>Descripción</label>
            <input value={form.description}
              onChange={e => setForm(f=>({...f, description:e.target.value}))}
              placeholder="Describe brevemente el descuento"/>
          </div>

          {/* Tipo de cupón (scope) */}
          <div className="form-row">
            <label>Tipo de cupón</label>
            <div className="scope-selector">
              {Object.entries(COUPON_SCOPE).map(([,scope]) => (
                <label key={scope}
                  className={`scope-option ${form.scope===scope ? 'selected' : ''}`}
                  style={form.scope===scope ? {background:SCOPE_STYLE[scope].bg, borderColor:SCOPE_STYLE[scope].border} : {}}>
                  <input type="radio" name="scope" value={scope}
                    checked={form.scope===scope} onChange={()=>setForm(f=>({...f, scope, specificEmail:''}))}/>
                  <div className="scope-option-content">
                    {scope==='general'  && <Users size={16}/>}
                    {scope==='per_user' && <User  size={16}/>}
                    {scope==='specific' && <User  size={16}/>}
                    <div>
                      <span className="scope-opt-name"
                        style={form.scope===scope?{color:SCOPE_STYLE[scope].color}:{}}>{SCOPE_LABEL[scope]}</span>
                      <span className="scope-opt-desc">{SCOPE_DESCRIPTIONS[scope]}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Email específico */}
          {showEmail && (
            <div className="form-row">
              <label>Email del usuario *</label>
              <input type="email" value={form.specificEmail}
                onChange={e=>setForm(f=>({...f, specificEmail:e.target.value}))}
                placeholder="cliente@ejemplo.es"/>
            </div>
          )}

          {/* Tipo de descuento */}
          <div className="form-row">
            <label>Tipo de descuento</label>
            <div className="dtype-selector">
              {Object.entries(DISCOUNT_TYPE).map(([,dt]) => (
                <label key={dt} className={`dtype-option ${form.discountType===dt?'selected':''}`}>
                  <input type="radio" name="dtype" value={dt}
                    checked={form.discountType===dt} onChange={()=>setForm(f=>({...f,discountType:dt,discountValue:''}))}/>
                  <span className="dtype-icon">{DTYPE_ICON[dt]}</span>
                  <span>{DTYPE_LABEL[dt]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Valor del descuento */}
          {showValue && (
            <div className="form-row">
              <label>Valor del descuento *</label>
              <div className="value-input-row">
                <input type="number" min="0" max={form.discountType===DISCOUNT_TYPE.PERCENT?100:undefined}
                  step={form.discountType===DISCOUNT_TYPE.PERCENT?1:0.01}
                  value={form.discountValue}
                  onChange={e=>setForm(f=>({...f,discountValue:e.target.value}))}
                  placeholder={form.discountType===DISCOUNT_TYPE.PERCENT ? '10' : '15.00'}/>
                <span className="value-unit">{discountUnit}</span>
              </div>
            </div>
          )}

          {/* Condiciones */}
          <div className="form-section-title">Condiciones (opcionales)</div>
          <div className="form-grid-2">
            <div className="form-row">
              <label>Importe mínimo (€)</label>
              <input type="number" min="0" step="0.01" value={form.minAmount}
                onChange={e=>setForm(f=>({...f,minAmount:e.target.value}))} placeholder="0"/>
            </div>
            <div className="form-row">
              <label>Unidades mínimas</label>
              <input type="number" min="0" value={form.minItems}
                onChange={e=>setForm(f=>({...f,minItems:e.target.value}))} placeholder="0"/>
            </div>
            <div className="form-row">
              <label>Límite de usos totales</label>
              <input type="number" min="1" value={form.maxUses}
                onChange={e=>setForm(f=>({...f,maxUses:e.target.value}))} placeholder="Ilimitado"/>
            </div>
            <div className="form-row">
              <label>Fecha de expiración</label>
              <input type="date" value={form.expiresAt}
                onChange={e=>setForm(f=>({...f,expiresAt:e.target.value}))}/>
            </div>
          </div>

          {/* Activo */}
          <div className="form-row form-check">
            <label>
              <input type="checkbox" checked={form.active}
                onChange={e=>setForm(f=>({...f,active:e.target.checked}))}/>
              Cupón activo y disponible para los clientes
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={onSave}><Check size={16}/>{isEdit ? 'Guardar cambios' : 'Crear cupón'}</button>
        </div>
      </div>
    </div>
    </Portal>
  )
}

const SCOPE_DESCRIPTIONS = {
  general:  'Cualquier usuario puede usarlo (N veces en total)',
  per_user: 'Cada usuario puede canjearlo una sola vez',
  specific: 'Solo válido para un email concreto',
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AdminCoupons() {
  const { coupons, dispatch } = useStore()
  const [modal,  setModal]  = useState(null)   // null | 'new' | 'edit'
  const [form,   setForm]   = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [delId,  setDelId]  = useState(null)
  const [filter, setFilter] = useState('all')  // all | active | inactive

  const filtered = (coupons||[]).filter(c => {
    if (filter === 'active')   return c.active
    if (filter === 'inactive') return !c.active
    return true
  })

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setModal('new') }

  function openEdit(c) {
    setForm({
      code: c.code, description: c.description || '',
      scope: c.scope, specificEmail: c.specificEmail || '',
      discountType: c.discountType, discountValue: String(c.discountValue),
      minAmount: c.minAmount ? String(c.minAmount) : '',
      minItems:  c.minItems  ? String(c.minItems)  : '',
      maxUses:   c.maxUses   !== null ? String(c.maxUses) : '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0,10) : '',
      active: c.active,
    })
    setEditId(c.id); setModal('edit')
  }

  function handleSave() {
    if (!form.code.trim()) return
    const showValue = form.discountType !== DISCOUNT_TYPE.FREE_SHIP && form.discountType !== DISCOUNT_TYPE.BOGO
    if (showValue && !form.discountValue) return

    const coupon = {
      id: editId || `cp-${Date.now()}`,
      code: form.code.trim().toUpperCase(),
      description: form.description,
      scope: form.scope,
      specificEmail: form.scope === COUPON_SCOPE.SPECIFIC ? form.specificEmail.trim() : null,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue) || 0,
      minAmount: parseFloat(form.minAmount) || 0,
      minItems:  parseInt(form.minItems)  || 0,
      maxUses:   form.maxUses ? parseInt(form.maxUses) : null,
      expiresAt: form.expiresAt || null,
      active: form.active,
      usedCount: editId ? (coupons.find(c=>c.id===editId)?.usedCount||0) : 0,
      usedBy:    editId ? (coupons.find(c=>c.id===editId)?.usedBy||[])   : [],
      createdAt: editId ? (coupons.find(c=>c.id===editId)?.createdAt)    : new Date().toISOString(),
    }

    dispatch({ type: editId ? 'COUPON_UPDATE' : 'COUPON_ADD', coupon })
    setModal(null)
  }

  function toggleActive(c) {
    dispatch({ type: 'COUPON_UPDATE', coupon: {...c, active: !c.active} })
  }

  function formatDiscount(c) {
    switch (c.discountType) {
      case DISCOUNT_TYPE.PERCENT:   return `${c.discountValue}%`
      case DISCOUNT_TYPE.FIXED:     return `${c.discountValue} €`
      case DISCOUNT_TYPE.FREE_SHIP: return 'Envío gratis'
      case DISCOUNT_TYPE.BOGO:      return '2×1'
      default: return '—'
    }
  }

  function isExpired(c) {
    return c.expiresAt && new Date(c.expiresAt) < new Date()
  }

  return (
    <div className="admin-table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cupones de descuento</h1>
          <p className="page-sub">{(coupons||[]).length} cupones · {(coupons||[]).filter(c=>c.active).length} activos</p>
        </div>
        <button className="btn-add" onClick={openNew}><Plus size={16}/>Nuevo cupón</button>
      </div>

      {/* Filtros */}
      <div className="coupon-filters">
        {['all','active','inactive'].map(f => (
          <button key={f} className={`filter-tab ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
            {f==='all'?'Todos':f==='active'?'Activos':'Inactivos'}
            <span className="filter-count">
              {f==='all'?coupons.length:f==='active'?coupons.filter(c=>c.active).length:coupons.filter(c=>!c.active).length}
            </span>
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>Código</th><th>Descuento</th><th>Tipo</th>
            <th>Condiciones</th><th>Usos</th><th>Expira</th><th>Estado</th><th>Acciones</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{textAlign:'center',padding:'40px',color:'var(--muted)'}}>Sin cupones</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} className={!c.active || isExpired(c) ? 'row-inactive' : ''}>
                <td>
                  <div className="coupon-code-cell">
                    <code className="coupon-code-badge">{c.code}</code>
                    <button className="copy-inline" title="Copiar código"
                      onClick={() => navigator.clipboard?.writeText(c.code)}>
                      <Copy size={12}/>
                    </button>
                  </div>
                  {c.description && <p className="coupon-desc-small">{c.description}</p>}
                </td>
                <td>
                  <span className="discount-badge">
                    {DTYPE_ICON[c.discountType]}{formatDiscount(c)}
                  </span>
                </td>
                <td><ScopeBadge scope={c.scope}/>
                  {c.scope===COUPON_SCOPE.SPECIFIC && c.specificEmail && (
                    <p className="specific-email">{c.specificEmail}</p>
                  )}
                </td>
                <td>
                  <div className="conditions-cell">
                    {c.minAmount > 0 && <span>Mín. {c.minAmount} €</span>}
                    {c.minItems  > 0 && <span>Mín. {c.minItems} ud.</span>}
                    {!c.minAmount && !c.minItems && <span style={{color:'var(--muted)'}}>Sin condiciones</span>}
                  </div>
                </td>
                <td>
                  <span className={`uses-badge ${c.maxUses && c.usedCount >= c.maxUses ? 'exhausted' : ''}`}>
                    {c.usedCount} / {c.maxUses ?? '∞'}
                  </span>
                </td>
                <td style={{fontSize:13,color: isExpired(c)?'var(--danger)':'var(--muted)'}}>
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('es-ES') : '—'}
                  {isExpired(c) && <span className="expired-tag">Caducado</span>}
                </td>
                <td>
                  <button className={`status-badge ${c.active && !isExpired(c) ? 'active' : 'inactive'}`}
                    onClick={() => toggleActive(c)}>
                    {c.active && !isExpired(c) ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="action-btn edit" onClick={() => openEdit(c)} title="Editar"><Pencil size={14}/></button>
                    <button className="action-btn del"  onClick={() => setDelId(c.id)} title="Eliminar"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <CouponModal
          form={form} setForm={setForm}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isEdit={modal === 'edit'}
        />
      )}

      {/* Confirmar borrado */}
      {delId && (
        <Portal>
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><h2>Eliminar cupón</h2></div>
            <div className="modal-body"><p>¿Eliminar este cupón? No se puede deshacer.</p></div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDelId(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => { dispatch({ type:'COUPON_DELETE', id:delId }); setDelId(null) }}>
                <Trash2 size={14}/>Eliminar
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  )
}
