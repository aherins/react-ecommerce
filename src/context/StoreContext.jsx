import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { activity } from '../lib/activity'

// ─── Helpers localStorage — SOLO para carrito y wishlist ─────────────────────
function loadLocal(key) {
  try {
    const v = localStorage.getItem(key)
    if (!v || v === 'null' || v === 'undefined') return []
    const parsed = JSON.parse(v)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

// ─── Mapeo camelCase ↔ snake_case (frontend ↔ Supabase) ──────────────────────
function clientToDb(c) {
  return {
    id:             c.id,
    code:           c.code,
    description:    c.description   || null,
    scope:          c.scope,
    specific_email: c.specificEmail || null,
    discount_type:  c.discountType,
    discount_value: c.discountValue,
    min_amount:     c.minAmount     || 0,
    min_items:      c.minItems      || 0,
    max_uses:       c.maxUses       ?? null,
    used_count:     c.usedCount     || 0,
    active:         c.active,
    expires_at:     c.expiresAt     || null,
    created_at:     c.createdAt     || new Date().toISOString(),
  }
}

function dbToClient(r) {
  return {
    id:            r.id,
    code:          r.code,
    description:   r.description    || '',
    scope:         r.scope,
    specificEmail: r.specific_email || null,
    discountType:  r.discount_type,
    discountValue: r.discount_value,
    minAmount:     r.min_amount     || 0,
    minItems:      r.min_items      || 0,
    maxUses:       r.max_uses       ?? null,
    usedCount:     r.used_count     || 0,
    usedBy:        [],
    active:        r.active,
    expiresAt:     r.expires_at     || null,
    createdAt:     r.created_at,
  }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    // Productos
    case 'SET_PRODUCTS':   return { ...state, products: action.products }
    case 'PRODUCT_ADD':    return { ...state, products: [...state.products, action.product] }
    case 'PRODUCT_UPDATE': return { ...state, products: state.products.map(p => p.id === action.product.id ? action.product : p) }
    case 'PRODUCT_DELETE': return { ...state, products: state.products.filter(p => p.id !== action.id) }

    // Categorías
    case 'SET_CATEGORIES':  return { ...state, categories: action.categories }
    case 'CATEGORY_ADD':    return { ...state, categories: [...state.categories, action.category] }
    case 'CATEGORY_UPDATE': return { ...state, categories: state.categories.map(c => c.id === action.category.id ? action.category : c) }
    case 'CATEGORY_DELETE': return { ...state, categories: state.categories.filter(c => c.id !== action.id) }

    // Cupones
    case 'SET_COUPONS':          return { ...state, coupons: action.coupons }
    case 'COUPON_ADD':           return { ...state, coupons: [...state.coupons, action.coupon] }
    case 'COUPON_UPDATE':        return { ...state, coupons: state.coupons.map(c => c.id === action.coupon.id ? action.coupon : c) }
    case 'COUPON_TOGGLE_ACTIVE': return { ...state, coupons: state.coupons.map(c => c.id === action.id ? { ...c, active: action.active } : c) }
    case 'COUPON_DELETE':        return { ...state, coupons: state.coupons.filter(c => c.id !== action.id) }
    case 'COUPON_USE':           return { ...state, coupons: state.coupons.map(c => c.id === action.id ? { ...c, usedCount: (c.usedCount || 0) + 1 } : c) }

    // Pedidos
    case 'SET_ORDERS': return { ...state, orders: action.orders }
    case 'ADD_ORDER':  return { ...state, orders: [action.order, ...state.orders] }

    // Carrito — persiste en localStorage (funciona sin login)
    case 'CART_ADD': {
      const exists = state.cart.find(i => i.productId === action.productId)
      return {
        ...state,
        cart: exists
          ? state.cart.map(i => i.productId === action.productId ? { ...i, qty: i.qty + 1 } : i)
          : [...state.cart, { productId: action.productId, qty: 1 }],
      }
    }
    case 'CART_REMOVE':  return { ...state, cart: state.cart.filter(i => i.productId !== action.productId) }
    case 'CART_SET_QTY': {
      const qty = Math.max(0, action.qty)
      return {
        ...state,
        cart: qty === 0
          ? state.cart.filter(i => i.productId !== action.productId)
          : state.cart.map(i => i.productId === action.productId ? { ...i, qty } : i),
      }
    }
    case 'CART_CLEAR': return { ...state, cart: [] }
    case 'SET_CART':   return { ...state, cart: action.cart }

    // Wishlist — persiste en localStorage (funciona sin login)
    case 'WISHLIST_TOGGLE': {
      const has = state.wishlist.includes(action.productId)
      return {
        ...state,
        wishlist: has
          ? state.wishlist.filter(id => id !== action.productId)
          : [...state.wishlist, action.productId],
      }
    }

    default: return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    // Entidades de BD — vacías hasta que Supabase responda
    products:   [],
    categories: [],
    coupons:    [],
    orders:     [],
    // UX local — se leen de localStorage, no son entidades de BD
    cart:     loadLocal('cart'),
    wishlist: loadLocal('wishlist'),
  })

  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(null)

  // ── Carga inicial desde Supabase ──────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*').order('created_at'),
      supabase.from('categories').select('*').order('created_at'),
      supabase.from('coupons').select('*').order('created_at'),
    ])
      .then(([{ data: products, error: ep }, { data: categories, error: ec }, { data: couponsRaw, error: ecp }]) => {
        if (ep) throw ep
        if (ec) throw ec
        if (ecp) console.warn('Coupons load error:', ecp.message)
        if (products?.length)   dispatch({ type: 'SET_PRODUCTS',   products })
        if (categories?.length) dispatch({ type: 'SET_CATEGORIES', categories })
        if (couponsRaw?.length) dispatch({ type: 'SET_COUPONS',    coupons: couponsRaw.map(dbToClient) })
      })
      .catch(e => setDbError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // ── Realtime — escucha cambios en BD y sincroniza estado ─────────────────
  useEffect(() => {
    const ch = supabase.channel('shop-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        supabase.from('products').select('*').order('created_at')
          .then(({ data }) => data && dispatch({ type: 'SET_PRODUCTS', products: data }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        supabase.from('categories').select('*').order('created_at')
          .then(({ data }) => data && dispatch({ type: 'SET_CATEGORIES', categories: data }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, () => {
        supabase.from('coupons').select('*').order('created_at')
          .then(({ data }) => data && dispatch({ type: 'SET_COUPONS', coupons: data.map(dbToClient) }))
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  // ── Persistencia local — SOLO carrito y wishlist ──────────────────────────
  useEffect(() => { localStorage.setItem('cart',     JSON.stringify(state.cart))     }, [state.cart])
  useEffect(() => { localStorage.setItem('wishlist', JSON.stringify(state.wishlist)) }, [state.wishlist])

  // ── Escritura en Supabase con optimistic update en estado ─────────────────
  const smartDispatch = useCallback(async (action) => {
    // Optimistic update inmediato en UI
    dispatch(action)

    // Tracking de actividad del usuario (solo cliente, no BD)
    if (action.type === 'CART_ADD') activity.trackCartAdd(action.productId)

    // Sincronizar con Supabase
    switch (action.type) {
      // Productos
      case 'PRODUCT_ADD': {
        const { id, ...rest } = action.product
        const { error } = await supabase.from('products').insert({ id, ...rest })
        if (error) console.error('PRODUCT_ADD:', error.message)
        break
      }
      case 'PRODUCT_UPDATE': {
        const { id, ...rest } = action.product
        const { error } = await supabase.from('products').update(rest).eq('id', id)
        if (error) console.error('PRODUCT_UPDATE:', error.message)
        break
      }
      case 'PRODUCT_DELETE': {
        const { error } = await supabase.from('products').delete().eq('id', action.id)
        if (error) console.error('PRODUCT_DELETE:', error.message)
        break
      }

      // Categorías
      case 'CATEGORY_ADD': {
        const { id, ...rest } = action.category
        const { error } = await supabase.from('categories').insert({ id, ...rest })
        if (error) console.error('CATEGORY_ADD:', error.message)
        break
      }
      case 'CATEGORY_UPDATE': {
        const { id, ...rest } = action.category
        const { error } = await supabase.from('categories').update(rest).eq('id', id)
        if (error) console.error('CATEGORY_UPDATE:', error.message)
        break
      }
      case 'CATEGORY_DELETE': {
        const { error } = await supabase.from('categories').delete().eq('id', action.id)
        if (error) console.error('CATEGORY_DELETE:', error.message)
        break
      }

      // Cupones
      case 'COUPON_ADD': {
        const { error } = await supabase.from('coupons').insert(clientToDb(action.coupon))
        if (error) console.error('COUPON_ADD:', error.message)
        break
      }
      case 'COUPON_UPDATE': {
        const { id, ...rest } = clientToDb(action.coupon)
        const { error } = await supabase.from('coupons').update(rest).eq('id', id)
        if (error) console.error('COUPON_UPDATE:', error.message)
        break
      }
      case 'COUPON_TOGGLE_ACTIVE': {
        const { error } = await supabase.from('coupons')
          .update({ active: action.active })
          .eq('id', action.id)
        if (error) console.error('COUPON_TOGGLE_ACTIVE:', error.message)
        break
      }
      case 'COUPON_DELETE': {
        const { error } = await supabase.from('coupons').delete().eq('id', action.id)
        if (error) console.error('COUPON_DELETE:', error.message)
        break
      }
      case 'COUPON_USE': {
        // Incremento atómico via RPC
        const { error } = await supabase.rpc('increment_coupon_use', { p_id: action.id })
        if (error) console.error('COUPON_USE:', error.message)
        break
      }
    }
  }, [])

  const cart     = state.cart     || []
  const products = state.products || []

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => {
    const p = products.find(p => p.id === i.productId)
    return s + (p ? p.price * i.qty : 0)
  }, 0)

  return (
    <StoreContext.Provider value={{
      products:   state.products   || [],
      categories: state.categories || [],
      coupons:    state.coupons    || [],
      orders:     state.orders     || [],
      cart:       state.cart       || [],
      wishlist:   state.wishlist   || [],
      dispatch: smartDispatch,
      cartCount,
      cartTotal,
      loading,
      dbError,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
