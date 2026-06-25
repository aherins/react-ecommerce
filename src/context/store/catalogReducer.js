export function catalogReducer(state, action) {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.products }
    case 'PRODUCT_ADD':
      return { ...state, products: [...state.products, action.product] }
    case 'PRODUCT_UPDATE':
      return {
        ...state,
        products: state.products.map(p => p.id === action.product.id ? action.product : p),
      }
    case 'PRODUCT_DELETE':
      return { ...state, products: state.products.filter(p => p.id !== action.id) }
    case 'PRODUCT_DECREASE_STOCK':
      return {
        ...state,
        products: state.products.map(p => {
          if (p.id !== action.productId) return p
          return { ...p, stock: Math.max(0, p.stock - action.qty) }
        }),
      }

    case 'SET_CATEGORIES':
      return { ...state, categories: action.categories }
    case 'CATEGORY_ADD':
      return { ...state, categories: [...state.categories, action.category] }
    case 'CATEGORY_UPDATE':
      return {
        ...state,
        categories: state.categories.map(c => c.id === action.category.id ? action.category : c),
      }
    case 'CATEGORY_DELETE':
      return { ...state, categories: state.categories.filter(c => c.id !== action.id) }

    case 'SET_COUPONS':
      return { ...state, coupons: action.coupons }
    case 'COUPON_ADD':
      return { ...state, coupons: [...state.coupons, action.coupon] }
    case 'COUPON_UPDATE':
      return {
        ...state,
        coupons: state.coupons.map(c => c.id === action.coupon.id ? action.coupon : c),
      }
    case 'COUPON_TOGGLE_ACTIVE':
      return {
        ...state,
        coupons: state.coupons.map(c => c.id === action.id ? { ...c, active: action.active } : c),
      }
    case 'COUPON_DELETE':
      return { ...state, coupons: state.coupons.filter(c => c.id !== action.id) }
    case 'COUPON_USE':
      return {
        ...state,
        coupons: state.coupons.map(c =>
          c.id === action.id ? { ...c, usedCount: (c.usedCount || 0) + 1 } : c
        ),
      }

    default:
      return state
  }
}
