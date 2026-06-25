import React, { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import Portal from '../../components/Portal'
import './AdminTable.css'

const EMPTY = { name: '', slug: '' }

function toSlug(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function AdminCategories() {
  const { categories, products, dispatch } = useStore()
  const { userCan } = useAuth()
  const [form, setForm] = useState(null)
  const [del, setDel] = useState(null)

  const canCreate = userCan('categorias.crear')
  const canEdit   = userCan('categorias.editar')
  const canDelete = userCan('categorias.borrar')

  function openNew() { setForm({ ...EMPTY }) }
  function openEdit(c) { setForm({ ...c }) }
  function closeForm() { setForm(null) }

  function handleNameChange(name) {
    setForm(f => ({ ...f, name, slug: f.id ? f.slug : toSlug(name) }))
  }

  function handleSave() {
    if (!form.name) return
    const category = {
      ...form,
      slug: form.slug || toSlug(form.name),
      id: form.id || `cat-${Date.now()}`,
    }
    if (form.id) {
      dispatch({ type: 'CATEGORY_UPDATE', category })
    } else {
      dispatch({ type: 'CATEGORY_ADD', category })
    }
    closeForm()
  }

  function handleDelete(id) {
    dispatch({ type: 'CATEGORY_DELETE', id })
    setDel(null)
  }

  const countProducts = id => products.filter(p => p.categoryId === id).length

  return (
    <div className="admin-table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="page-sub">{categories.length} categorías</p>
        </div>
        {canCreate && (
          <button className="btn-add" onClick={openNew}><Plus size={16} />Nueva categoría</button>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="admin-empty-state">
          <Tag size={40} color="var(--border)"/>
          <h3>Sin categorías</h3>
          <p>Organiza tu catálogo creando la primera categoría.</p>
          {canCreate && (
            <button className="btn-add" onClick={openNew}><Plus size={16}/>Nueva categoría</button>
          )}
        </div>
      ) : (
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Productos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td><code className="slug-pill">{c.slug}</code></td>
                <td>{countProducts(c.id)}</td>
                <td>
                  <div className="row-actions">
                    {canEdit && <button className="action-btn edit" onClick={() => openEdit(c)} title="Editar"><Pencil size={14} /></button>}
                    {canDelete && <button className="action-btn del" onClick={() => setDel(c.id)} title="Eliminar"><Trash2 size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {form && (
        <Portal><div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeForm()}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2>{form.id ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button onClick={closeForm}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>Nombre *</label>
                <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Ej: Cerámica" />
              </div>
              <div className="form-row">
                <label>Slug (URL)</label>
                <input value={form.slug} onChange={e => setForm(f => ({...f, slug: e.target.value}))} placeholder="ceramica" />
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

      {del && (
        <Portal><div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><h2>Eliminar categoría</h2></div>
            <div className="modal-body">
              <p>¿Eliminar esta categoría? Los productos asociados quedarán sin categoría.</p>
            </div>
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
