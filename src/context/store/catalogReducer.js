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

    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.suppliers }
    case 'SUPPLIER_ADD':
      return { ...state, suppliers: [...state.suppliers, action.supplier] }
    case 'SUPPLIER_UPDATE':
      return {
        ...state,
        suppliers: state.suppliers.map(s => s.id === action.supplier.id ? action.supplier : s),
      }
    case 'SUPPLIER_DELETE':
      return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.id) }

    case 'SET_SHIPPING_CARRIERS':
      return { ...state, shippingCarriers: action.shippingCarriers }
    case 'SHIPPING_CARRIER_ADD':
      return { ...state, shippingCarriers: [...state.shippingCarriers, action.carrier] }
    case 'SHIPPING_CARRIER_UPDATE':
      return {
        ...state,
        shippingCarriers: state.shippingCarriers.map(c => c.id === action.carrier.id ? action.carrier : c),
      }
    case 'SHIPPING_CARRIER_DELETE':
      return { ...state, shippingCarriers: state.shippingCarriers.filter(c => c.id !== action.id) }

    case 'SET_SUPPLIER_ORDERS':
      return { ...state, supplierOrders: action.supplierOrders }
    case 'SUPPLIER_ORDER_ADD':
      return { ...state, supplierOrders: [...state.supplierOrders, action.order] }
    case 'SUPPLIER_ORDER_UPDATE':
      return {
        ...state,
        supplierOrders: state.supplierOrders.map(o => o.id === action.order.id ? action.order : o),
      }
    case 'SUPPLIER_ORDER_DELETE':
      return { ...state, supplierOrders: state.supplierOrders.filter(o => o.id !== action.id) }
    case 'SUPPLIER_ORDER_ADD_INVOICE':
      return {
        ...state,
        supplierOrders: state.supplierOrders.map(o => {
          if (o.id !== action.id) return o
          return { ...o, invoices: [...(o.invoices || []), action.invoice] }
        }),
      }
    case 'SUPPLIER_ORDER_REMOVE_INVOICE':
      return {
        ...state,
        supplierOrders: state.supplierOrders.map(o => {
          if (o.id !== action.id) return o
          return { ...o, invoices: (o.invoices || []).filter(inv => inv.id !== action.invoiceId) }
        }),
      }

    default:
      return state
  }
}
