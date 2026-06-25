export function ordersReducer(state, action) {
  switch (action.type) {
    case 'SET_ORDERS':
      return { ...state, orders: action.orders }
    case 'ADD_ORDER':
      return { ...state, orders: [action.order, ...state.orders] }
    case 'ORDER_UPDATE':
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.id ? { ...o, ...action.patch } : o),
      }
    default:
      return state
  }
}
