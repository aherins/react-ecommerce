import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'
import { activity } from '../lib/activity'
import { useCatalog } from './CatalogContext'
import { cartReducer } from './store/cartReducer'
import { loadLocal, saveLocal } from './store/helpers'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { products } = useCatalog()
  const [state, dispatch] = useReducer(
    (s, action) => cartReducer(s, action, products),
    undefined,
    () => ({
      cart: loadLocal('cart'),
      wishlist: loadLocal('wishlist'),
    })
  )

  useEffect(() => { saveLocal('cart', state.cart) }, [state.cart])
  useEffect(() => { saveLocal('wishlist', state.wishlist) }, [state.wishlist])

  const smartDispatch = useCallback((action) => {
    dispatch(action)
    if (action.type === 'CART_ADD') activity.trackCartAdd(action.productId)
  }, [])

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
