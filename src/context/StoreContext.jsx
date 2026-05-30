import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_CATEGORIES = [
  { id: 'cat-1', name: 'Cerámica', slug: 'ceramica' },
  { id: 'cat-2', name: 'Textil',   slug: 'textil'   },
  { id: 'cat-3', name: 'Madera',   slug: 'madera'   },
]
const SEED_PRODUCTS = [
  { id:'p-1', name:'Tazón de arcilla blanca', price:28, categoryId:'cat-1', image:'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80', description:'Tazón torneado a mano con esmalte blanco mate. Capacidad 350ml.', stock:12, active:true },
  { id:'p-2', name:'Jarra terracota',          price:45, categoryId:'cat-1', image:'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&q=80', description:'Jarra artesanal en barro cocido, acabado natural sin esmaltar.',    stock:6,  active:true },
  { id:'p-3', name:'Cesta de esparto trenzado',price:36, categoryId:'cat-2', image:'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80', description:'Cesta tejida a mano con esparto natural. Ø 30cm.',               stock:8,  active:true },
  { id:'p-4', name:'Mantel de lino lavado',    price:62, categoryId:'cat-2', image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', description:'Mantel 180×140cm en lino 100%, lavado enzimático.',              stock:15, active:true },
  { id:'p-5', name:'Tabla de cortar olivo',    price:54, categoryId:'cat-3', image:'https://images.unsplash.com/photo-1631125915902-d8abe9225ff2?w=600&q=80', description:'Tabla maciza de madera de olivo, tratada con aceite alimentario.',stock:10, active:true },
  { id:'p-6', name:'Cuenco de nogal torneado', price:78, categoryId:'cat-3', image:'https://images.unsplash.com/photo-1604153219586-f8c468f9c88a?w=600&q=80', description:'Cuenco Ø 25cm torneado en nogal, acabado con cera de abejas.',    stock:4,  active:true },
]

// ─── localStorage helpers ─────────────────────────────────────────────────────
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'CART_ADD': {
      const exists = state.cart.find(i => i.productId === action.productId)
      const cart = exists
        ? state.cart.map(i => i.productId === action.productId ? { ...i, qty: i.qty + 1 } : i)
        : [...state.cart, { productId: action.productId, qty: 1 }]
      return { ...state, cart }
    }
    case 'CART_REMOVE':  return { ...state, cart: state.cart.filter(i => i.productId !== action.productId) }
    case 'CART_SET_QTY': {
      const qty = Math.max(0, action.qty)
      const cart = qty === 0
        ? state.cart.filter(i => i.productId !== action.productId)
        : state.cart.map(i => i.productId === action.productId ? { ...i, qty } : i)
      return { ...state, cart }
    }
    case 'CART_CLEAR': return { ...state, cart: [] }

    case 'SET_PRODUCTS':   return { ...state, products: action.products }
    case 'SET_CATEGORIES': return { ...state, categories: action.categories }

    case 'PRODUCT_ADD':    return { ...state, products: [...state.products, action.product] }
    case 'PRODUCT_UPDATE': return { ...state, products: state.products.map(p => p.id === action.product.id ? action.product : p) }
    case 'PRODUCT_DELETE': return { ...state, products: state.products.filter(p => p.id !== action.id) }

    case 'CATEGORY_ADD':    return { ...state, categories: [...state.categories, action.category] }
    case 'CATEGORY_UPDATE': return { ...state, categories: state.categories.map(c => c.id === action.category.id ? action.category : c) }
    case 'CATEGORY_DELETE': return { ...state, categories: state.categories.filter(c => c.id !== action.id) }

    default: return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    products:   load('products',   SEED_PRODUCTS),
    categories: load('categories', SEED_CATEGORIES),
    cart:       load('cart', []),
  }))
  const [dbReady, setDbReady] = useState(!hasSupabase)

  // ── Supabase: carga inicial ─────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabase) return
    Promise.all([
      supabase.from('products').select('*').order('created_at'),
      supabase.from('categories').select('*').order('created_at'),
    ]).then(([{ data: products }, { data: categories }]) => {
      if (products)   dispatch({ type: 'SET_PRODUCTS',   products })
      if (categories) dispatch({ type: 'SET_CATEGORIES', categories })
      setDbReady(true)
    })
  }, [])

  // ── Supabase: realtime sync ─────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabase) return
    const ch = supabase.channel('shop-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        supabase.from('products').select('*').order('created_at')
          .then(({ data }) => data && dispatch({ type: 'SET_PRODUCTS', products: data }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        supabase.from('categories').select('*').order('created_at')
          .then(({ data }) => data && dispatch({ type: 'SET_CATEGORIES', categories: data }))
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  // ── localStorage sync (fallback) ────────────────────────────────────────────
  useEffect(() => { if (!hasSupabase) localStorage.setItem('products',   JSON.stringify(state.products))   }, [state.products])
  useEffect(() => { if (!hasSupabase) localStorage.setItem('categories', JSON.stringify(state.categories)) }, [state.categories])
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(state.cart)) }, [state.cart])

  // ── Wrapped dispatch: sincroniza con Supabase si disponible ─────────────────
  async function smartDispatch(action) {
    // Optimistic update local siempre
    dispatch(action)

    if (!hasSupabase) return

    switch (action.type) {
      case 'PRODUCT_ADD': {
        const { id, ...rest } = action.product
        await supabase.from('products').insert({ ...rest, id })
        break
      }
      case 'PRODUCT_UPDATE': {
        const { id, ...rest } = action.product
        await supabase.from('products').update(rest).eq('id', id)
        break
      }
      case 'PRODUCT_DELETE':
        await supabase.from('products').delete().eq('id', action.id)
        break
      case 'CATEGORY_ADD': {
        const { id, ...rest } = action.category
        await supabase.from('categories').insert({ ...rest, id })
        break
      }
      case 'CATEGORY_UPDATE': {
        const { id, ...rest } = action.category
        await supabase.from('categories').update(rest).eq('id', id)
        break
      }
      case 'CATEGORY_DELETE':
        await supabase.from('categories').delete().eq('id', action.id)
        break
    }
  }

  const cartCount = state.cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = state.cart.reduce((s, i) => {
    const p = state.products.find(p => p.id === i.productId)
    return s + (p ? p.price * i.qty : 0)
  }, 0)

  return (
    <StoreContext.Provider value={{ ...state, dispatch: smartDispatch, cartCount, cartTotal, dbReady, hasSupabase }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
