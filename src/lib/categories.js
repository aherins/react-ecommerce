export function getRootCategories(categories) {
  return (categories || []).filter(c => !c.parentId)
}

export function getChildCategories(categories, parentId) {
  return (categories || []).filter(c => c.parentId === parentId)
}

export function getCategoryBySlug(categories, slug) {
  return (categories || []).find(c => c.slug === slug)
}

export function getCategoryById(categories, id) {
  return (categories || []).find(c => c.id === id)
}

export function getCategoryPath(categories, id) {
  const cat = getCategoryById(categories, id)
  if (!cat) return []
  if (!cat.parentId) return [cat]
  const parent = getCategoryById(categories, cat.parentId)
  return parent ? [parent, cat] : [cat]
}

export function getCategoryLabel(categories, id) {
  const path = getCategoryPath(categories, id)
  return path.length ? path.map(c => c.name).join(' › ') : '—'
}

export function getDescendantIds(categories, rootId) {
  const ids = []
  function walk(parentId) {
    getChildCategories(categories, parentId).forEach(c => {
      ids.push(c.id)
      walk(c.id)
    })
  }
  walk(rootId)
  return ids
}

export function resolveCategoryFilter(categories, catSlug, subSlug) {
  if (!catSlug) return null

  const root = getCategoryBySlug(categories, catSlug)
  if (!root) return { ids: new Set(), root: null, sub: null }

  if (subSlug) {
    const sub = categories.find(c => c.slug === subSlug && c.parentId === root.id)
    return {
      ids: sub ? new Set([sub.id]) : new Set(),
      root,
      sub: sub || null,
    }
  }

  const childIds = getChildCategories(categories, root.id).map(c => c.id)
  return {
    ids: new Set([root.id, ...childIds]),
    root,
    sub: null,
  }
}

export function productMatchesCategoryFilter(productCategoryId, filter) {
  if (!filter) return true
  if (!productCategoryId) return false
  return filter.ids.has(productCategoryId)
}

export function flattenCategoriesForSelect(categories) {
  const rows = []
  getRootCategories(categories).forEach(root => {
    rows.push({ id: root.id, label: root.name, depth: 0 })
    getChildCategories(categories, root.id).forEach(sub => {
      rows.push({ id: sub.id, label: sub.name, depth: 1, parentName: root.name })
    })
  })
  return rows
}

export function canAssignParent(categories, categoryId, parentId) {
  if (!parentId) return true
  if (categoryId && parentId === categoryId) return false
  const parent = getCategoryById(categories, parentId)
  if (!parent || parent.parentId) return false
  if (categoryId && getChildCategories(categories, categoryId).length > 0) return false
  return true
}
