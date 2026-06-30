import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react'
import { activity } from '../lib/activity'
import { customerSync } from '../lib/customerSync'
import { hasSupabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useCatalog } from './CatalogContext'
import { cartReducer } from './store/cartReducer'
import { loadLocal, saveLocal } from './store/helpers'

const CartContext = createContext(null)

function nextWishlist(state, action) {
  switch (action.type) {
    case 'WISHLIST_TOGGLE': {
      const has = state.wishlist.includes(action.productId)
      return has
        ? state.wishlist.filter(id => id !== action.productId)
        : [...state.wishlist, action.productId]
    }
    case 'WISHLIST_ADD':
      return state.wishlist.includes(action.productId)
        ? state.wishlist
        : [...state.wishlist, action.productId]
    case 'WISHLIST_ADD_ALL_FROM_CART': {
      const ids = state.cart.map(i => i.productId)
      return [...new Set([...state.wishlist, ...ids])]
    }
    case 'SET_WISHLIST':
      return action.wishlist || []
    default:
      return null
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const { products } = useCatalog()
  const [state, dispatch] = useReducer(
    (s, action) => cartReducer(s, action, products),
    undefined,
    () => ({
      cart: loadLocal('cart'),
      wishlist: loadLocal('wishlist'),
    })
  )

  const wishlistHydrated = useRef(false)

  useEffect(() => { saveLocal('cart', state.cart) }, [state.cart])
  useEffect(() => { saveLocal('wishlist', state.wishlist) }, [state.wishlist])

  useEffect(() => {
    if (!user?.id || !hasSupabase) {
      wishlistHydrated.current = false
      return
    }
    customerSync.fetchWishlist(user.id).then(ids => {
      const merged = [...new Set([...loadLocal('wishlist'), ...ids])]
      dispatch({ type: 'SET_WISHLIST', wishlist: merged })
      wishlistHydrated.current = true
      customerSync.syncWishlist(user.id, merged)
    })
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || !wishlistHydrated.current) return
    customerSync.syncWishlist(user.id, state.wishlist)
  }, [state.wishlist, user?.id])

  const smartDispatch = useCallback((action) => {
    const wishlistAction = ['WISHLIST_TOGGLE', 'WISHLIST_ADD', 'WISHLIST_ADD_ALL_FROM_CART'].includes(action.type)
    const next = wishlistAction ? nextWishlist(state, action) : null

    if (action.type === 'WISHLIST_TOGGLE' && user?.id) {
      const has = state.wishlist.includes(action.productId)
      activity.trackWishlist(action.productId, !has, user.id)
    }
    if (action.type === 'WISHLIST_ADD' && user?.id) {
      if (!state.wishlist.includes(action.productId)) {
        activity.trackWishlist(action.productId, true, user.id)
      }
    }
    if (action.type === 'WISHLIST_ADD_ALL_FROM_CART' && user?.id) {
      state.cart
        .map(i => i.productId)
        .filter(id => !state.wishlist.includes(id))
        .forEach(id => activity.trackWishlist(id, true, user.id))
    }

    dispatch(action)

    if (user?.id && hasSupabase && next) {
      customerSync.syncWishlist(user.id, next)
    }
    if (action.type === 'CART_ADD') activity.trackCartAdd(action.productId, user?.id)
  }, [user?.id, state.wishlist, state.cart])

  const cartCount = useMemo(
    () => state.cart.reduce((s, i) => s + i.qty, 0),
    [state.cart]
  )

  const cartTotal = useMemo(
    () => state.cart.reduce((s, i) => {
      const p = products.find(p => p.id === i.productId)
      return s + (p ? p.price * i.qty : 0)
    }, 0),
    [state.cart, products]
  )

  return (
    <CartContext.Provider value={{
      cart: state.cart,
      wishlist: state.wishlist,
      dispatch: smartDispatch,
      cartCount,
      cartTotal,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
