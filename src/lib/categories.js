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
  return [...getCategoryPath(categories, cat.parentId), cat]
}

export function getCategoryLabel(categories, id) {
  const path = getCategoryPath(categories, id)
  return path.length ? path.map(c => c.name).join(' › ') : '—'
}

export function getPathToCategory(categories, id) {
  return getCategoryPath(categories, id).map(c => c.slug).join('/')
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

export function parseCategoryPath(categories, pathParam, legacyCat = '', legacySub = '') {
  let pathStr = (pathParam || '').trim()
  if (!pathStr && legacyCat) {
    pathStr = legacySub ? `${legacyCat}/${legacySub}` : legacyCat
  }
  if (!pathStr) return null

  const slugs = pathStr.split('/').filter(Boolean)
  const segments = []
  let expectedParentId = null

  for (const slug of slugs) {
    const cat = categories.find(c =>
      c.slug === slug && (c.parentId || null) === (expectedParentId || null)
    )
    if (!cat) {
      return { segments, active: segments[segments.length - 1] || null, ids: new Set(), invalid: true }
    }
    segments.push(cat)
    expectedParentId = cat.id
  }

  const active = segments[segments.length - 1] || null
  if (!active) return null

  const ids = new Set([active.id, ...getDescendantIds(categories, active.id)])
  return { segments, active, ids, invalid: false }
}

/** @deprecated use parseCategoryPath */
export function resolveCategoryFilter(categories, catSlug, subSlug) {
  return parseCategoryPath(categories, '', catSlug, subSlug)
}

export function productMatchesCategoryFilter(productCategoryId, filter) {
  if (!filter) return true
  if (!productCategoryId) return false
  return filter.ids.has(productCategoryId)
}

export function flattenCategoriesForSelect(categories, excludeId = null) {
  const exclude = new Set(
    excludeId ? [excludeId, ...getDescendantIds(categories, excludeId)] : [],
  )
  const rows = []

  function walk(parentId, depth) {
    const nodes = parentId
      ? getChildCategories(categories, parentId)
      : getRootCategories(categories)

    nodes.forEach(c => {
      if (!exclude.has(c.id)) {
        rows.push({ id: c.id, label: c.name, depth })
      }
      walk(c.id, depth + 1)
    })
  }

  walk(null, 0)
  return rows
}

export function getParentOptions(categories, excludeId = null) {
  return flattenCategoriesForSelect(categories, excludeId)
}

export function canAssignParent(categories, categoryId, parentId) {
  if (!parentId) return true
  if (categoryId && parentId === categoryId) return false
  if (categoryId && getDescendantIds(categories, categoryId).includes(parentId)) return false
  return true
}

export function countAllSubcategories(categories) {
  return (categories || []).filter(c => c.parentId).length
}
