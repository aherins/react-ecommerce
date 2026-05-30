import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─── Seed data (solo se usa si Supabase devuelve tablas vacías) ───────────────
const SEED_CATEGORIES = [
  { id: 'cat-1', name: 'Cerámica', slug: 'ceramica' },
  { id: 'cat-2', name: 'Textil',   slug: 'textil'   },
  { id: 'cat-3', name: 'Madera',   slug: 'madera'   },
]
const SEED_PRODUCTS = [
  { id:'p-1', name:'Tazón de arcilla blanca',  price:28, categoryId:'cat-1', image:'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80', description:'Tazón torneado a mano con esmalte blanco mate. Capacidad 350ml.', stock:12, active:true },
  { id:'p-2', name:'Jarra terracota',           price:45, categoryId:'cat-1', image:'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&q=80', description:'Jarra artesanal en barro cocido, acabado natural sin esmaltar.',    stock:6,  active:true },
  { id:'p-3', name:'Cesta de esparto trenzado', price:36, categoryId:'cat-2', image:'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80', description:'Cesta tejida a mano con esparto natural. Ø 30cm.',                stock:8,  active:true },
  { id:'p-4', name:'Mantel de lino lavado',     price:62, categoryId:'cat-2', image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', description:'Mantel 180×140cm en lino 100%, lavado enzimático.',               stock:15, active:true },
  { id:'p-5', name:'Tabla de cortar olivo',     price:54, categoryId:'cat-3', image:'https://images.unsplash.com/photo-1631125915902-d8abe9225ff2?w=600&q=80', description:'Tabla maciza de madera de olivo, tratada con aceite alimentario.',stock:10, active:true },
  { id:'p-6', name:'Cuenco de nogal torneado',  price:78, categoryId:'cat-3', image:'https://images.unsplash.com/photo-1604153219586-f8c468f9c88a?w=600&q=80', description:'Cuenco Ø 25cm torneado en nogal, acabado con cera de abejas.',   stock:4,  active:true },
]

// ─── Reducer (solo estado local / optimistic) ─────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    // Cart
    case 'CART_ADD': {
      const exists = state.cart.find(i => i.productId === action.productId)
      return {
        ...state,
        cart: exists
          ? state.cart.map(i => i.productId === action.productId ? { ...i, qty: i.qty + 1 } : i)
          : [...state.cart, { productId: action.productId, qty: 1 }],
      }
    }
    case 'CART_REMOVE':
      return { ...state, cart: state.cart.filter(i => i.productId !== action.productId) }
    case 'CART_SET_QTY': {
      const qty = Math.max(0, action.qty)
      return {
        ...state,
        cart: qty === 0
          ? state.cart.filter(i => i.productId !== action.productId)
          : state.cart.map(i => i.productId === action.productId ? { ...i, qty } : i),
      }
    }
    case 'CART_CLEAR':
      return { ...state, cart: [] }
    case 'SET_CART':
      return { ...state, cart: action.cart }

    // Productos y categorías (los establece Supabase)
    case 'SET_PRODUCTS':
      return { ...state, products: action.products }
    case 'SET_CATEGORIES':
      return { ...state, categories: action.categories }

    // Optimistic local updates (se revertirán si Supabase falla via realtime)
    case 'PRODUCT_ADD':
      return { ...state, products: [...state.products, action.product] }
    case 'PRODUCT_UPDATE':
      return { ...state, products: state.products.map(p => p.id === action.product.id ? action.product : p) }
    case 'PRODUCT_DELETE':
      return { ...state, products: state.products.filter(p => p.id !== action.id) }
    case 'CATEGORY_ADD':
      return { ...state, categories: [...state.categories, action.category] }
    case 'CATEGORY_UPDATE':
      return { ...state, categories: state.categories.map(c => c.id === action.category.id ? action.category : c) }
    case 'CATEGORY_DELETE':
      return { ...state, categories: state.categories.filter(c => c.id !== action.id) }

    default: return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    products:   [],
    categories: [],
    cart:       [],
  })
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(null)

  // ── 1. Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function bootstrap() {
      setLoading(true)
      setDbError(null)
      try {
        const [
          { data: products,   error: errP },
          { data: categories, error: errC },
        ] = await Promise.all([
          supabase.from('products').select('*').order('created_at'),
          supabase.from('categories').select('*').order('created_at'),
        ])

        if (errP) throw errP
        if (errC) throw errC

        // Si las tablas están vacías en el primer arranque, sembramos los datos
        if (products.length === 0) {
          const { error: seedErr } = await supabase.from('products').insert(SEED_PRODUCTS)
          if (seedErr) throw seedErr
          dispatch({ type: 'SET_PRODUCTS', products: SEED_PRODUCTS })
        } else {
          dispatch({ type: 'SET_PRODUCTS', products })
        }

        if (categories.length === 0) {
          const { error: seedErr } = await supabase.from('categories').insert(SEED_CATEGORIES)
          if (seedErr) throw seedErr
          dispatch({ type: 'SET_CATEGORIES', categories: SEED_CATEGORIES })
        } else {
          dispatch({ type: 'SET_CATEGORIES', categories })
        }

      } catch (err) {
        console.error('[StoreContext] bootstrap error:', err)
        setDbError(err.message || 'Error conectando con Supabase')
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  // ── 2. Carrito: vinculado al usuario autenticado ──────────────────────────────
  useEffect(() => {
    // Carga el carrito de Supabase cuando hay sesión, si no usa sessionStorage
    async function loadCart() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // usuario anónimo: sessionStorage (no persiste entre pestañas cerradas)
        try {
          const raw = sessionStorage.getItem('cart')
          if (raw) dispatch({ type: 'SET_CART', cart: JSON.parse(raw) })
        } catch {}
        return
      }

      const { data, error } = await supabase
        .from('carts')
        .select('items')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!error && data?.items) {
        dispatch({ type: 'SET_CART', cart: data.items })
      }
    }

    loadCart()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadCart())
    return () => subscription.unsubscribe()
  }, [])

  // ── 3. Persiste el carrito en Supabase o sessionStorage ───────────────────────
  useEffect(() => {
    async function persistCart() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // anónimo → sessionStorage
        sessionStorage.setItem('cart', JSON.stringify(state.cart))
        return
      }

      // autenticado → upsert en tabla carts
      await supabase.from('carts').upsert(
        { user_id: session.user.id, items: state.cart, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }
    persistCart()
  }, [state.cart])

  // ── 4. Realtime: productos y categorías ──────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('shop-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        supabase.from('products').select('*').order('created_at')
          .then(({ data }) => data && dispatch({ type: 'SET_PRODUCTS', products: data }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        supabase.from('categories').select('*').order('created_at')
          .then(({ data }) => data && dispatch({ type: 'SET_CATEGORIES', categories: data }))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // ── 5. smartDispatch: optimistic update + escritura en Supabase ───────────────
  const smartDispatch = useCallback(async (action) => {
    // Actualización optimista inmediata en UI
    dispatch(action)

    switch (action.type) {
      case 'PRODUCT_ADD': {
        const { error } = await supabase.from('products').insert(action.product)
        if (error) {
          console.error('PRODUCT_ADD error:', error)
          // Revertir: recargar desde Supabase
          supabase.from('products').select('*').order('created_at')
            .then(({ data }) => data && dispatch({ type: 'SET_PRODUCTS', products: data }))
        }
        break
      }
      case 'PRODUCT_UPDATE': {
        const { id, ...fields } = action.product
        const { error } = await supabase.from('products').update(fields).eq('id', id)
        if (error) {
          console.error('PRODUCT_UPDATE error:', error)
          supabase.from('products').select('*').order('created_at')
            .then(({ data }) => data && dispatch({ type: 'SET_PRODUCTS', products: data }))
        }
        break
      }
      case 'PRODUCT_DELETE': {
        const { error } = await supabase.from('products').delete().eq('id', action.id)
        if (error) {
          console.error('PRODUCT_DELETE error:', error)
          supabase.from('products').select('*').order('created_at')
            .then(({ data }) => data && dispatch({ type: 'SET_PRODUCTS', products: data }))
        }
        break
      }
      case 'CATEGORY_ADD': {
        const { error } = await supabase.from('categories').insert(action.category)
        if (error) {
          console.error('CATEGORY_ADD error:', error)
          supabase.from('categories').select('*').order('created_at')
            .then(({ data }) => data && dispatch({ type: 'SET_CATEGORIES', categories: data }))
        }
        break
      }
      case 'CATEGORY_UPDATE': {
        const { id, ...fields } = action.category
        const { error } = await supabase.from('categories').update(fields).eq('id', id)
        if (error) {
          console.error('CATEGORY_UPDATE error:', error)
          supabase.from('categories').select('*').order('created_at')
            .then(({ data }) => data && dispatch({ type: 'SET_CATEGORIES', categories: data }))
        }
        break
      }
      case 'CATEGORY_DELETE': {
        const { error } = await supabase.from('categories').delete().eq('id', action.id)
        if (error) {
          console.error('CATEGORY_DELETE error:', error)
          supabase.from('categories').select('*').order('created_at')
            .then(({ data }) => data && dispatch({ type: 'SET_CATEGORIES', categories: data }))
        }
        break
      }
      // Las acciones de carrito no necesitan lógica extra aquí — el useEffect
      // de persistCart ya las maneja después de cada cambio de state.cart
    }
  }, [])

  const cartCount = state.cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = state.cart.reduce((s, i) => {
    const p = state.products.find(p => p.id === i.productId)
    return s + (p ? p.price * i.qty : 0)
  }, 0)

  return (
    <StoreContext.Provider value={{
      ...state,
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
