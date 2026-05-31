import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'

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

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}

function reducer(state, action) {
  switch (action.type) {
    case 'CART_ADD': {
      const exists = state.cart.find(i => i.productId === action.productId)
      return { ...state, cart: exists
        ? state.cart.map(i => i.productId === action.productId ? { ...i, qty: i.qty + 1 } : i)
        : [...state.cart, { productId: action.productId, qty: 1 }] }
    }
    case 'CART_REMOVE':  return { ...state, cart: state.cart.filter(i => i.productId !== action.productId) }
    case 'CART_SET_QTY': {
      const qty = Math.max(0, action.qty)
      return { ...state, cart: qty === 0
        ? state.cart.filter(i => i.productId !== action.productId)
        : state.cart.map(i => i.productId === action.productId ? { ...i, qty } : i) }
    }
    case 'CART_CLEAR': return { ...state, cart: [] }
    case 'SET_CART':   return { ...state, cart: action.cart }
    case 'SET_PRODUCTS':   return { ...state, products: action.products }
    case 'SET_CATEGORIES': return { ...state, categories: action.categories }
    case 'PRODUCT_ADD':    return { ...state, products: [...state.products, action.product] }
    case 'PRODUCT_UPDATE': return { ...state, products: state.products.map(p => p.id === action.product.id ? action.product : p) }
    case 'PRODUCT_DELETE': return { ...state, products: state.products.filter(p => p.id !== action.id) }
    case 'CATEGORY_ADD':    return { ...state, categories: [...state.categories, action.category] }
    case 'CATEGORY_UPDATE': return { ...state, categories: state.categories.map(c => c.id === action.category.id ? action.category : c) }
    case 'CATEGORY_DELETE': return { ...state, categories: state.categories.filter(c => c.id !== action.id) }
    // Wishlist
    case 'WISHLIST_TOGGLE': {
      const has = state.wishlist.includes(action.productId)
      return { ...state, wishlist: has
        ? state.wishlist.filter(id => id !== action.productId)
        : [...state.wishlist, action.productId] }
    }
    case 'SET_ORDERS': return { ...state, orders: action.orders }
    case 'ADD_ORDER':  return { ...state, orders: [action.order, ...state.orders] }
    default: return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    products:   load('products',   SEED_PRODUCTS),
    categories: load('categories', SEED_CATEGORIES),
    cart:       load('cart',       []),
    wishlist:   load('wishlist',   []),
    orders:     load('orders',     []),
  }))
  const [loading, setLoading] = useState(false)
  const [dbError, setDbError] = useState(null)

  // Bootstrap desde Supabase o localStorage
  useEffect(() => {
    if (!hasSupabase) {
      // localStorage ya cargado en el initializer — nada más que hacer
      return
    }
    setLoading(true)
    Promise.all([
      supabase.from('products').select('*').order('created_at'),
      supabase.from('categories').select('*').order('created_at'),
    ]).then(([{ data: products, error: ep }, { data: categories, error: ec }]) => {
      if (ep || ec) { setDbError((ep || ec).message); setLoading(false); return }
      if (products?.length)   dispatch({ type: 'SET_PRODUCTS', products })
      if (categories?.length) dispatch({ type: 'SET_CATEGORIES', categories })
      setLoading(false)
    }).catch(e => { setDbError(e.message); setLoading(false) })
  }, [])

  // localStorage sync cuando NO hay Supabase
  useEffect(() => { if (!hasSupabase) localStorage.setItem('products',   JSON.stringify(state.products))   }, [state.products])
  useEffect(() => { if (!hasSupabase) localStorage.setItem('categories', JSON.stringify(state.categories)) }, [state.categories])
  useEffect(() => { localStorage.setItem('cart',     JSON.stringify(state.cart))     }, [state.cart])
  useEffect(() => { localStorage.setItem('wishlist', JSON.stringify(state.wishlist)) }, [state.wishlist])
  useEffect(() => { localStorage.setItem('orders',   JSON.stringify(state.orders))   }, [state.orders])

  // Realtime (solo si Supabase disponible)
  useEffect(() => {
    if (!hasSupabase) return
    const ch = supabase.channel('shop-rt')
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

  const smartDispatch = useCallback(async (action) => {
    dispatch(action)
    if (!hasSupabase) return
    switch (action.type) {
      case 'PRODUCT_ADD': { const {id,...r}=action.product; await supabase.from('products').insert({...r,id}); break }
      case 'PRODUCT_UPDATE': { const {id,...r}=action.product; await supabase.from('products').update(r).eq('id',id); break }
      case 'PRODUCT_DELETE': await supabase.from('products').delete().eq('id',action.id); break
      case 'CATEGORY_ADD': { const {id,...r}=action.category; await supabase.from('categories').insert({...r,id}); break }
      case 'CATEGORY_UPDATE': { const {id,...r}=action.category; await supabase.from('categories').update(r).eq('id',id); break }
      case 'CATEGORY_DELETE': await supabase.from('categories').delete().eq('id',action.id); break
    }
  }, [])

  const cartCount = state.cart.reduce((s,i)=>s+i.qty,0)
  const cartTotal = state.cart.reduce((s,i)=>{
    const p=state.products.find(p=>p.id===i.productId); return s+(p?p.price*i.qty:0)},0)

  return (
    <StoreContext.Provider value={{ ...state, dispatch: smartDispatch, cartCount, cartTotal, loading, dbError, hasSupabase }}>
      {children}
    </StoreContext.Provider>
  )
}
export const useStore = () => useContext(StoreContext)