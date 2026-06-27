import { clampQty, getCartQty } from './stock'

export function cartReducer(state, action, products = []) {
  switch (action.type) {
    case 'CART_ADD': {
      const product = products.find(p => p.id === action.productId)
      if (!product || product.stock <= 0) return state
      const currentQty = getCartQty(state.cart, action.productId)
      if (currentQty >= product.stock) return state
      const exists = state.cart.find(i => i.productId === action.productId)
      return {
        ...state,
        cart: exists
          ? state.cart.map(i =>
              i.productId === action.productId ? { ...i, qty: i.qty + 1 } : i
            )
          : [...state.cart, { productId: action.productId, qty: 1 }],
      }
    }
    case 'CART_REMOVE':
      return { ...state, cart: state.cart.filter(i => i.productId !== action.productId) }
    case 'CART_SET_QTY': {
      const product = products.find(p => p.id === action.productId)
      const qty = clampQty(product, action.qty)
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

    case 'WISHLIST_TOGGLE': {
      const has = state.wishlist.includes(action.productId)
      return {
        ...state,
        wishlist: has
          ? state.wishlist.filter(id => id !== action.productId)
          : [...state.wishlist, action.productId],
      }
    }
    case 'WISHLIST_ADD': {
      if (state.wishlist.includes(action.productId)) return state
      return { ...state, wishlist: [...state.wishlist, action.productId] }
    }
    case 'WISHLIST_ADD_ALL_FROM_CART': {
      const ids = state.cart.map(i => i.productId)
      return { ...state, wishlist: [...new Set([...state.wishlist, ...ids])] }
    }
    case 'SET_WISHLIST':
      return { ...state, wishlist: action.wishlist || [] }

    default:
      return state
  }
}
