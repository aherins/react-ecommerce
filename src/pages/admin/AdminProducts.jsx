import React, { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Check } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import Portal from '../../components/Portal'
import './AdminTable.css'

const EMPTY = { name: '', price: '', categoryId: '', image: '', description: '', stock: '', active: true }

export default function AdminProducts() {
  const { products, categories, dispatch } = useStore()
  const [form, setForm] = useState(null) // null=closed, {}=new/edit
  const [del, setDel] = useState(null)

  function openNew() { setForm({ ...EMPTY }) }
  function openEdit(p) { setForm({ ...p, price: String(p.price), stock: String(p.stock) }) }
  function closeForm() { setForm(null) }

  function handleSave() {
    if (!form.name || !form.price) return
    const product = {
      ...form,
      price: parseFloat(form.price) || 0,
      stock: parseInt(form.stock) || 0,
      id: form.id || `p-${Date.now()}`,
    }
    if (form.id) {
      dispatch({ type: 'PRODUCT_UPDATE', product })
    } else {
      dispatch({ type: 'PRODUCT_ADD', product })
    }
    closeForm()
  }

  function handleDelete(id) {
    dispatch({ type: 'PRODUCT_DELETE', id })
    setDel(null)
  }

  function toggleActive(p) {
    dispatch({ type: 'PRODUCT_UPDATE', product: { ...p, active: !p.active } })
  }

  const catName = id => categories.find(c => c.id === id)?.name ?? '—'

  return (
    <div className="admin-table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-sub">{products.length} productos en total</p>
        </div>
        <button className="btn-add" onClick={openNew}><Plus size={16} />Nuevo producto</button>
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className={!p.active ? 'row-inactive' : ''}>
                <td>
                  <div className="product-cell">
                    {p.image && <img src={p.image} alt={p.name} />}
                    <span>{p.name}</span>
                  </div>
                </td>
                <td>{catName(p.categoryId)}</td>
                <td>{parseFloat(p.price).toFixed(2)} €</td>
                <td>
                  <span className={`stock-badge ${p.stock <= 3 ? 'low' : ''}`}>{p.stock}</span>
                </td>
                <td>
                  <button className={`status-badge ${p.active ? 'active' : 'inactive'}`} onClick={() => toggleActive(p)}>
                    {p.active ? <><Eye size={12} />Activo</> : <><EyeOff size={12} />Inactivo</>}
                  </button>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="action-btn edit" onClick={() => openEdit(p)} title="Editar"><Pencil size={14} /></button>
                    <button className="action-btn del" onClick={() => setDel(p.id)} title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {form && (
        <Portal><div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeForm()}>
          <div className="modal">
            <div className="modal-header">
              <h2>{form.id ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={closeForm}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Nombre del producto" />
              </div>
              <div className="form-grid-2">
                <div className="form-row">
                  <label>Precio (€) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} placeholder="0.00" min="0" step="0.01" />
                </div>
                <div className="form-row">
                  <label>Stock</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({...f, stock: e.target.value}))} placeholder="0" min="0" />
                </div>
              </div>
              <div className="form-row">
                <label>Categoría</label>
                <select value={form.categoryId} onChange={e => setForm(f => ({...f, categoryId: e.target.value}))}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>URL de imagen</label>
                <input value={form.image} onChange={e => setForm(f => ({...f, image: e.target.value}))} placeholder="https://..." />
              </div>
              <div className="form-row">
                <label>Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} placeholder="Describe el producto…" />
              </div>
              <div className="form-row form-check">
                <label>
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({...f, active: e.target.checked}))} />
                  Visible en la tienda
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeForm}>Cancelar</button>
              <button className="btn-save" onClick={handleSave}><Check size={16} />Guardar</button>
            </div>
          </div>
        </div>
      </Portal>
      )}

      {/* Delete confirm */}
      {del && (
        <Portal><div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><h2>Eliminar producto</h2></div>
            <div className="modal-body"><p>¿Seguro que quieres eliminar este producto? Esta acción no se puede deshacer.</p></div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDel(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => handleDelete(del)}><Trash2 size={14} />Eliminar</button>
            </div>
          </div>
        </div>
      </Portal>
      )}
    </div>
  )
}
