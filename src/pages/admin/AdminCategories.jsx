import React, { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import {
  getRootCategories,
  getChildCategories,
  getCategoryLabel,
  getDescendantIds,
  canAssignParent,
} from '../../lib/categories'
import Portal from '../../components/Portal'
import './AdminTable.css'
import './AdminCategories.css'

const EMPTY = { name: '', slug: '', parentId: '' }

function toSlug(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function AdminCategories() {
  const { categories, products, dispatch } = useStore()
  const { userCan } = useAuth()
  const [form, setForm] = useState(null)
  const [del, setDel] = useState(null)
  const [formError, setFormError] = useState('')

  const canCreate = userCan('categorias.crear')
  const canEdit   = userCan('categorias.editar')
  const canDelete = userCan('categorias.borrar')

  const roots = getRootCategories(categories)
  const rootCount = roots.length
  const subCount = categories.length - rootCount

  function openNew(parentId = '') {
    setFormError('')
    setForm({ ...EMPTY, parentId: parentId || '' })
  }

  function openEdit(c) {
    setFormError('')
    setForm({ ...c, parentId: c.parentId || '' })
  }

  function closeForm() {
    setForm(null)
    setFormError('')
  }

  function handleNameChange(name) {
    setForm(f => ({ ...f, name, slug: f.id ? f.slug : toSlug(name) }))
  }

  function handleSave() {
    if (!form.name) return
    const parentId = form.parentId || null
    if (!canAssignParent(categories, form.id, parentId)) {
      setFormError('Solo se permite un nivel: la categoría padre debe ser principal y no puede tener subcategorías propias.')
      return
    }
    if (categories.some(c => c.slug === (form.slug || toSlug(form.name)) && c.id !== form.id)) {
      setFormError('Ya existe otra categoría con ese slug.')
      return
    }

    const category = {
      ...form,
      slug: form.slug || toSlug(form.name),
      parentId,
      id: form.id || `cat-${Date.now()}`,
    }
    delete category.parentName

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

  const parentOptions = getRootCategories(categories).filter(c => c.id !== form?.id)

  function renderRow(c, depth = 0) {
    const children = getChildCategories(categories, c.id)

    return (
      <React.Fragment key={c.id}>
        <tr className={depth > 0 ? 'category-row--sub' : ''}>
          <td>
            <div className="category-name-cell" style={{ paddingLeft: depth * 20 }}>
              {depth > 0 && <span className="category-tree-mark">↳</span>}
              <span>{c.name}</span>
              {depth === 0 && children.length > 0 && (
                <span className="category-subcount">{children.length} sub</span>
              )}
            </div>
          </td>
          <td>
            {depth > 0 ? (
              <span className="category-parent-label">{getCategoryLabel(categories, c.id).split(' › ')[0]}</span>
            ) : (
              <span className="category-parent-label muted">—</span>
            )}
          </td>
          <td><code className="slug-pill">{c.slug}</code></td>
          <td>{countProducts(c.id)}</td>
          <td>
            <div className="row-actions">
              {canCreate && depth === 0 && (
                <button
                  className="action-btn edit"
                  onClick={() => openNew(c.id)}
                  title="Añadir subcategoría"
                >
                  <Plus size={14}/>
                </button>
              )}
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
        {children.map(child => renderRow(child, depth + 1))}
      </React.Fragment>
    )
  }

  const deleteTarget = del ? categories.find(c => c.id === del) : null
  const deleteDescendants = del ? getDescendantIds(categories, del).length : 0

  return (
    <div className="admin-table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="page-sub">
            {rootCount} principales · {subCount} subcategorías
          </p>
        </div>
        {canCreate && (
          <button className="btn-add" onClick={() => openNew()}><Plus size={16}/>Nueva categoría</button>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="admin-empty-state">
          <Tag size={40} color="var(--border)"/>
          <h3>Sin categorías</h3>
          <p>Organiza tu catálogo creando la primera categoría.</p>
          {canCreate && (
            <button className="btn-add" onClick={() => openNew()}><Plus size={16}/>Nueva categoría</button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Padre</th>
                <th>Slug</th>
                <th>Productos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roots.map(c => renderRow(c))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Portal><div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeForm()}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2>
                {form.id
                  ? 'Editar categoría'
                  : form.parentId
                    ? 'Nueva subcategoría'
                    : 'Nueva categoría'}
              </h2>
              <button onClick={closeForm}><X size={20}/></button>
            </div>
            <div className="modal-body">
              {formError && <p className="categories-form-error">{formError}</p>}
              <div className="form-row">
                <label>Categoría padre</label>
                <select
                  value={form.parentId || ''}
                  onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                  disabled={Boolean(form.id && getChildCategories(categories, form.id).length)}
                >
                  <option value="">Ninguna (categoría principal)</option>
                  {parentOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {form.id && getChildCategories(categories, form.id).length > 0 && (
                  <p className="form-hint">No puedes convertir en subcategoría una que ya tiene hijas.</p>
                )}
              </div>
              <div className="form-row">
                <label>Nombre *</label>
                <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Ej: Cuencos"/>
              </div>
              <div className="form-row">
                <label>Slug (URL)</label>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="cuencos"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeForm}>Cancelar</button>
              <button className="btn-save" onClick={handleSave}><Check size={16}/>Guardar</button>
            </div>
          </div>
        </div></Portal>
      )}

      {del && (
        <Portal><div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><h2>Eliminar categoría</h2></div>
            <div className="modal-body">
              <p>
                ¿Eliminar «{deleteTarget?.name}»?
                {deleteDescendants > 0 && ` Se eliminarán también ${deleteDescendants} subcategoría(s).`}
                {' '}Los productos asociados quedarán sin categoría.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDel(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => handleDelete(del)}><Trash2 size={14}/>Eliminar</button>
            </div>
          </div>
        </div></Portal>
      )}
    </div>
  )
}
