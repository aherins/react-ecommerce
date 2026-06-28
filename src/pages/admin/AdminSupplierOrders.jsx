import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Pencil, Trash2, X, Check, ArrowLeft, FileText, Upload, ExternalLink, ShoppingCart, Package, Lock,
} from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import Portal from '../../components/Portal'
import { notifyStockRestored } from '../../lib/emailApi'
import {
  SUPPLIER_ORDER_STATUS,
  SUPPLIER_ORDER_STATUS_OPTIONS,
  productSuppliesFrom,
  calcSupplierOrderTotal,
  readFileAsDataUrl,
  isSupplierOrderLocked,
  canApplyStockToLine,
  applyStockToSupplierOrderLine,
} from '../../lib/suppliers'
import './AdminTable.css'
import './AdminSuppliers.css'

const EMPTY_ORDER = {
  supplierId: '',
  reference: '',
  status: 'draft',
  notes: '',
  expectedAt: '',
  items: [{ productId: '', qty: '1', unitCost: '' }],
  invoices: [],
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminSupplierOrders() {
  const { supplierOrders, suppliers, products, dispatch } = useStore()
  const { userCan } = useAuth()
  const [form, setForm] = useState(null)
  const [detail, setDetail] = useState(null)
  const [del, setDel] = useState(null)
  const [filterSupplier, setFilterSupplier] = useState('all')
  const [uploadError, setUploadError] = useState('')

  const canManage = userCan('proveedores.pedidos.gestionar')

  const sorted = useMemo(
    () => [...supplierOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [supplierOrders]
  )

  const filtered = sorted.filter(o => filterSupplier === 'all' || o.supplierId === filterSupplier)

  const supplierName = id => suppliers.find(s => s.id === id)?.name ?? '—'
  const productName = id => products.find(p => p.id === id)?.name ?? '—'

  function openNew() {
    setForm({ ...EMPTY_ORDER, items: [{ productId: '', qty: '1', unitCost: '' }] })
  }

  function openEdit(order) {
    if (isSupplierOrderLocked(order)) return
    setForm({
      ...order,
      expectedAt: order.expectedAt ? order.expectedAt.slice(0, 10) : '',
      items: (order.items || []).map(i => ({
        productId: i.productId,
        qty: String(i.qty),
        unitCost: String(i.unitCost),
      })),
    })
    setDetail(null)
  }

  function closeForm() { setForm(null) }

  function supplierProducts(supplierId) {
    return productSuppliesFrom(supplierId, products)
  }

  function buildOrderFromForm() {
    const items = (form.items || [])
      .filter(i => i.productId && Number(i.qty) > 0)
      .map(i => ({
        productId: i.productId,
        qty: parseInt(i.qty, 10) || 0,
        unitCost: parseFloat(i.unitCost) || 0,
      }))
    const total = calcSupplierOrderTotal(items)
    return {
      ...form,
      items,
      total,
      expectedAt: form.expectedAt ? new Date(`${form.expectedAt}T12:00:00`).toISOString() : null,
      id: form.id || `spo-${Date.now()}`,
      createdAt: form.createdAt || new Date().toISOString(),
      receivedAt: form.status === 'received' && !form.receivedAt
        ? new Date().toISOString()
        : form.receivedAt || null,
    }
  }

  function handleSave() {
    if (!form.supplierId || !form.items?.some(i => i.productId)) return
    const order = buildOrderFromForm()
    dispatch({ type: form.id ? 'SUPPLIER_ORDER_UPDATE' : 'SUPPLIER_ORDER_ADD', order })
    closeForm()
  }

  function handleDelete(id) {
    const order = supplierOrders.find(o => o.id === id)
    if (isSupplierOrderLocked(order)) return
    dispatch({ type: 'SUPPLIER_ORDER_DELETE', id })
    setDel(null)
    if (detail?.id === id) setDetail(null)
  }

  function updateItem(idx, patch) {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    }))
  }

  function addLine() {
    setForm(f => ({ ...f, items: [...f.items, { productId: '', qty: '1', unitCost: '' }] }))
  }

  function removeLine(idx) {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }

  async function handleInvoiceUpload(e, orderId) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const order = supplierOrders.find(o => o.id === orderId)
    if (isSupplierOrderLocked(order)) return
    setUploadError('')
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('La factura no puede superar 2 MB.')
      return
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setUploadError('Formato no válido. Usa PDF o imagen (JPG, PNG).')
      return
    }
    try {
      const fileUrl = await readFileAsDataUrl(file)
      const invoice = {
        id: `inv-${Date.now()}`,
        fileName: file.name,
        mimeType: file.type,
        fileUrl,
        uploadedAt: new Date().toISOString(),
      }
      dispatch({ type: 'SUPPLIER_ORDER_ADD_INVOICE', id: orderId, invoice })
      setDetail(d => d?.id === orderId
        ? { ...d, invoices: [...(d.invoices || []), invoice] }
        : d)
    } catch {
      setUploadError('No se pudo leer el archivo.')
    }
  }

  function removeInvoice(orderId, invoiceId) {
    const order = supplierOrders.find(o => o.id === orderId)
    if (isSupplierOrderLocked(order)) return
    dispatch({ type: 'SUPPLIER_ORDER_REMOVE_INVOICE', id: orderId, invoiceId })
    setDetail(d => d?.id === orderId
      ? { ...d, invoices: (d.invoices || []).filter(inv => inv.id !== invoiceId) }
      : d)
  }

  async function handleApplyStock(orderId, lineIndex) {
    const order = supplierOrders.find(o => o.id === orderId)
    const result = applyStockToSupplierOrderLine(order, lineIndex, products)
    if (!result) return

    await dispatch({ type: 'SUPPLIER_ORDER_APPLY_STOCK', orderId, lineIndex })
    setDetail(result.order)

    if (result.prevStock === 0 && result.product.stock > 0) {
      notifyStockRestored({
        productId: result.product.id,
        productName: result.product.name,
        productPrice: result.product.price,
        image: result.product.image,
      })
    }
  }

  const formTotal = form ? calcSupplierOrderTotal(
    (form.items || []).map(i => ({
      qty: parseInt(i.qty, 10) || 0,
      unitCost: parseFloat(i.unitCost) || 0,
    }))
  ) : 0

  return (
    <div className="admin-table-page">
      <Link to="/admin/proveedores" className="cart-back" style={{ marginBottom: 16 }}>
        <ArrowLeft size={16}/> Volver a proveedores
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos a proveedores</h1>
          <p className="page-sub">{supplierOrders.length} pedidos registrados</p>
        </div>
        {canManage && (
          <button className="btn-add" onClick={openNew}><Plus size={16}/>Nuevo pedido</button>
        )}
      </div>

      <div className="supplier-orders-filters">
        <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}>
          <option value="all">Todos los proveedores</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty-state">
          <ShoppingCart size={40} color="var(--border)"/>
          <h3>Sin pedidos a proveedores</h3>
          <p>Registra compras a tus proveedores y adjunta las facturas.</p>
          {canManage && (
            <button className="btn-add" onClick={openNew}><Plus size={16}/>Nuevo pedido</button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Facturas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td><strong>{o.reference || o.id.slice(-8).toUpperCase()}</strong></td>
                  <td>{supplierName(o.supplierId)}</td>
                  <td>{fmtDate(o.createdAt)}</td>
                  <td>
                    <span className={`spo-status spo-status--${o.status}`}>{SUPPLIER_ORDER_STATUS[o.status]}</span>
                    {isSupplierOrderLocked(o) && (
                      <span className="spo-locked-tag" title="Stock aplicado · pedido cerrado">
                        <Lock size={11}/> Cerrado
                      </span>
                    )}
                  </td>
                  <td>{o.total?.toFixed(2)} €</td>
                  <td>{(o.invoices || []).length || '—'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="action-btn edit" onClick={() => setDetail(o)} title="Ver detalle">
                        <FileText size={14}/>
                      </button>
                      {canManage && !isSupplierOrderLocked(o) && (
                        <>
                          <button className="action-btn edit" onClick={() => openEdit(o)} title="Editar">
                            <Pencil size={14}/>
                          </button>
                          <button className="action-btn del" onClick={() => setDel(o.id)} title="Eliminar">
                            <Trash2 size={14}/>
                          </button>
                        </>
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
            <div className="modal modal-lg">
              <div className="modal-header">
                <h2>{form.id ? 'Editar pedido' : 'Nuevo pedido a proveedor'}</h2>
                <button onClick={closeForm}><X size={20}/></button>
              </div>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-row">
                    <label>Proveedor *</label>
                    <select
                      value={form.supplierId}
                      onChange={e => setForm(f => ({
                        ...f,
                        supplierId: e.target.value,
                        items: [{ productId: '', qty: '1', unitCost: '' }],
                      }))}
                    >
                      <option value="">Seleccionar…</option>
                      {suppliers.filter(s => s.active !== false).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Referencia</label>
                    <input
                      value={form.reference}
                      onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                      placeholder="PO-2026-001"
                    />
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-row">
                    <label>Estado</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {SUPPLIER_ORDER_STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{SUPPLIER_ORDER_STATUS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Fecha prevista recepción</label>
                    <input
                      type="date"
                      value={form.expectedAt}
                      onChange={e => setForm(f => ({ ...f, expectedAt: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label>Notas</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="Condiciones, plazo de pago…"
                  />
                </div>

                <h3 className="spo-lines-title">Líneas del pedido</h3>
                {!form.supplierId && (
                  <p className="form-hint">Selecciona un proveedor para ver sus productos.</p>
                )}
                {(form.items || []).map((line, idx) => {
                  const available = supplierProducts(form.supplierId)
                  return (
                    <div key={idx} className="spo-line-row">
                      <select
                        value={line.productId}
                        onChange={e => updateItem(idx, { productId: e.target.value })}
                        disabled={!form.supplierId}
                      >
                        <option value="">Producto…</option>
                        {available.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="number" min="1" placeholder="Ud."
                        value={line.qty}
                        onChange={e => updateItem(idx, { qty: e.target.value })}
                      />
                      <input
                        type="number" min="0" step="0.01" placeholder="Coste ud. €"
                        value={line.unitCost}
                        onChange={e => updateItem(idx, { unitCost: e.target.value })}
                      />
                      {(form.items.length > 1) && (
                        <button type="button" className="spo-line-remove" onClick={() => removeLine(idx)}>
                          <X size={14}/>
                        </button>
                      )}
                    </div>
                  )
                })}
                {form.supplierId && (
                  <button type="button" className="spo-add-line" onClick={addLine}>
                    <Plus size={14}/> Añadir línea
                  </button>
                )}
                <div className="spo-form-total">
                  <span>Total pedido</span>
                  <strong>{formTotal.toFixed(2)} €</strong>
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

      {detail && (
        <Portal>
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetail(null)}>
            <div className="modal modal-lg">
              <div className="modal-header">
                <h2>Pedido {detail.reference || `#${detail.id.slice(-8).toUpperCase()}`}</h2>
                <button onClick={() => setDetail(null)}><X size={20}/></button>
              </div>
              <div className="modal-body">
                <div className="spo-detail-meta">
                  <div><span>Proveedor</span><strong>{supplierName(detail.supplierId)}</strong></div>
                  <div><span>Estado</span><strong>{SUPPLIER_ORDER_STATUS[detail.status]}</strong></div>
                  <div><span>Fecha</span><strong>{fmtDate(detail.createdAt)}</strong></div>
                  <div><span>Total</span><strong>{detail.total?.toFixed(2)} €</strong></div>
                </div>
                {detail.notes && <p className="spo-detail-notes">{detail.notes}</p>}

                <h3 className="spo-lines-title">Artículos</h3>
                {(detail.items || []).map((line, i) => (
                  <div key={i} className="spo-detail-line">
                    <span>{productName(line.productId)}</span>
                    <span>× {line.qty}</span>
                    <span>{line.unitCost?.toFixed(2)} €/ud</span>
                    <strong>{(line.qty * line.unitCost).toFixed(2)} €</strong>
                    {detail.status === 'received' && (
                      line.stockAppliedAt ? (
                        <span className="spo-stock-applied">
                          <Check size={13}/> Stock +{line.qty}
                        </span>
                      ) : canManage && !isSupplierOrderLocked(detail) ? (
                        <button
                          type="button"
                          className="spo-stock-btn"
                          onClick={() => handleApplyStock(detail.id, i)}
                        >
                          <Package size={13}/> Actualizar stock
                        </button>
                      ) : null
                    )}
                  </div>
                ))}

                {isSupplierOrderLocked(detail) && (
                  <p className="spo-locked-note">
                    <Lock size={14}/> Pedido cerrado: el stock ya se aplicó y no se puede editar.
                  </p>
                )}

                <h3 className="spo-lines-title">Facturas</h3>
                {(detail.invoices || []).length === 0 && (
                  <p className="form-hint">Sin facturas adjuntas.</p>
                )}
                <ul className="spo-invoice-list">
                  {(detail.invoices || []).map(inv => (
                    <li key={inv.id} className="spo-invoice-item">
                      <FileText size={16}/>
                      <span>{inv.fileName}</span>
                      <span className="cell-sub">{fmtDate(inv.uploadedAt)}</span>
                      <a href={inv.fileUrl} target="_blank" rel="noreferrer" className="tracking-preview-link">
                        <ExternalLink size={14}/> Ver
                      </a>
                      {canManage && !isSupplierOrderLocked(detail) && (
                        <button
                          type="button"
                          className="spo-invoice-remove"
                          onClick={() => removeInvoice(detail.id, inv.id)}
                        >
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {canManage && !isSupplierOrderLocked(detail) && (
                  <div className="spo-upload-row">
                    <label className="spo-upload-btn">
                      <Upload size={15}/> Adjuntar factura
                      <input
                        type="file"
                        accept=".pdf,image/jpeg,image/png,image/webp"
                        hidden
                        onChange={e => handleInvoiceUpload(e, detail.id)}
                      />
                    </label>
                    <span className="form-hint">PDF o imagen, máx. 2 MB</span>
                  </div>
                )}
                {uploadError && <p className="spo-upload-error">{uploadError}</p>}
              </div>
              <div className="modal-footer">
                {canManage && !isSupplierOrderLocked(detail) && (
                  <button className="btn-save" onClick={() => { openEdit(detail); setDetail(null) }}>
                    <Pencil size={15}/> Editar pedido
                  </button>
                )}
                <button className="btn-cancel" onClick={() => setDetail(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {del && (
        <Portal>
          <div className="modal-overlay">
            <div className="modal modal-sm">
              <div className="modal-header"><h2>Eliminar pedido</h2></div>
              <div className="modal-body">
                <p>¿Eliminar este pedido a proveedor? Se perderán también las facturas adjuntas.</p>
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
