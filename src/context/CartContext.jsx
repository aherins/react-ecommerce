import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react'
import { activity } from '../lib/activity'
import { customerSync } from '../lib/customerSync'
import { hasSupabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useCatalog } from './CatalogContext'
import { cartReducer } from './store/cartReducer'
import { loadLocal, saveLocal } from './store/helpers'

const CartContext = createContext(null)

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
    })
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || !wishlistHydrated.current) return
    customerSync.syncWishlist(user.id, state.wishlist)
  }, [state.wishlist, user?.id])

  const smartDispatch = useCallback((action) => {
    if (action.type === 'WISHLIST_TOGGLE' && user?.id) {
      const has = state.wishlist.includes(action.productId)
      activity.trackWishlist(action.productId, !has, user.id)
    }
    if (action.type === 'CART_MOVE_TO_WISHLIST' && user?.id) {
      if (!state.wishlist.includes(action.productId)) {
        activity.trackWishlist(action.productId, true, user.id)
      }
    }
    if (action.type === 'CART_MOVE_ALL_TO_WISHLIST' && user?.id) {
      state.cart
        .map(i => i.productId)
        .filter(id => !state.wishlist.includes(id))
        .forEach(id => activity.trackWishlist(id, true, user.id))
    }
    dispatch(action)
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
