import { LayoutDashboard, ShoppingBag, Package, Tag, BarChart2, Users, UserCircle, Ticket } from 'lucide-react'

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
}

export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador',
}

export const ROLE_COLORS = {
  superadmin: { bg: '#fce7f3', color: '#9d174d', border: '#fbcfe8' },
  admin:      { bg: '#ede9fe', color: '#5b21b6', border: '#ddd6fe' },
  editor:     { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  viewer:     { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
}

export const PERMISSIONS = {
  dashboard:    ['superadmin', 'admin', 'editor', 'viewer'],

  'pedidos.ver':      ['superadmin', 'admin', 'editor', 'viewer'],
  'pedidos.estado':   ['superadmin', 'admin', 'editor'],
  'pedidos.tracking': ['superadmin', 'admin', 'editor'],
  'pedidos.cancelar': ['superadmin', 'admin'],

  'productos.ver':    ['superadmin', 'admin', 'editor', 'viewer'],
  'productos.crear':  ['superadmin', 'admin', 'editor'],
  'productos.editar': ['superadmin', 'admin', 'editor'],
  'productos.borrar': ['superadmin', 'admin'],
  'productos.toggle': ['superadmin', 'admin', 'editor'],

  'categorias.ver':   ['superadmin', 'admin', 'editor', 'viewer'],
  'categorias.crear': ['superadmin', 'admin', 'editor'],
  'categorias.editar':['superadmin', 'admin', 'editor'],
  'categorias.borrar':['superadmin', 'admin'],

  'estadisticas.ver':    ['superadmin', 'admin'],
  'estadisticas.export': ['superadmin', 'admin'],

  'usuarios.ver':    ['superadmin'],
  'usuarios.crear':  ['superadmin'],
  'usuarios.editar': ['superadmin'],
  'usuarios.borrar': ['superadmin'],
  'usuarios.rol':    ['superadmin'],

  'cupones.ver':    ['superadmin', 'admin', 'editor', 'viewer'],
  'cupones.crear':  ['superadmin', 'admin'],
  'cupones.editar': ['superadmin', 'admin'],
  'cupones.borrar': ['superadmin', 'admin'],

  'clientes.ver':   ['superadmin', 'admin', 'editor', 'viewer'],
  'clientes.notas': ['superadmin', 'admin', 'editor'],
}

export function can(role, permission) {
  if (!role) return false
  return (PERMISSIONS[permission] ?? []).includes(role)
}

export const NAV_ITEMS = [
  { to: '/admin',              label: 'Dashboard',    icon: LayoutDashboard, permission: 'dashboard',        end: true },
  { to: '/admin/pedidos',      label: 'Pedidos',       icon: ShoppingBag,     permission: 'pedidos.ver'              },
  { to: '/admin/productos',    label: 'Productos',     icon: Package,         permission: 'productos.ver'            },
  { to: '/admin/categorias',   label: 'Categorías',    icon: Tag,             permission: 'categorias.ver'           },
  { to: '/admin/estadisticas', label: 'Estadísticas',  icon: BarChart2,       permission: 'estadisticas.ver'         },
  { to: '/admin/clientes',     label: 'Clientes',      icon: UserCircle,      permission: 'clientes.ver'             },
  { to: '/admin/usuarios',     label: 'Equipo',        icon: Users,           permission: 'usuarios.ver'             },
  { to: '/admin/cupones',      label: 'Cupones',       icon: Ticket,          permission: 'cupones.ver'              },
]

export function navForRole(role) {
  return NAV_ITEMS.filter(n => can(role, n.permission))
}

export const DEMO_USERS = [
  { id: 'demo-1', email: 'superadmin@artesana.es', password: 'super1234',  role: 'superadmin', name: 'Super Admin' },
  { id: 'demo-2', email: 'admin@artesana.es',      password: 'admin1234',  role: 'admin',      name: 'Administrador' },
  { id: 'demo-3', email: 'editor@artesana.es',     password: 'editor1234', role: 'editor',     name: 'Editor' },
  { id: 'demo-4', email: 'viewer@artesana.es',     password: 'viewer1234', role: 'viewer',     name: 'Visualizador' },
]
