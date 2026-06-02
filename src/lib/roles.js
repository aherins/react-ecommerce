// ─── Roles disponibles ────────────────────────────────────────────────────────
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN:      'admin',
  EDITOR:     'editor',
  VIEWER:     'viewer',
}

export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin:      'Administrador',
  editor:     'Editor',
  viewer:     'Visualizador',
}

export const ROLE_COLORS = {
  superadmin: { bg: '#fce7f3', color: '#9d174d', border: '#fbcfe8' },
  admin:      { bg: '#ede9fe', color: '#5b21b6', border: '#ddd6fe' },
  editor:     { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  viewer:     { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
}

// ─── Permisos por sección ─────────────────────────────────────────────────────
// Cada permiso: qué roles pueden acceder
export const PERMISSIONS = {
  // Secciones del panel
  dashboard:    ['superadmin', 'admin', 'editor', 'viewer'],
  pedidos:      ['superadmin', 'admin', 'editor', 'viewer'],
  productos:    ['superadmin', 'admin', 'editor'],
  categorias:   ['superadmin', 'admin', 'editor'],
  estadisticas: ['superadmin', 'admin'],
  envios:       ['superadmin', 'admin', 'editor'],
  usuarios:     ['superadmin'],              // solo superadmin gestiona usuarios
  cupones:      ['superadmin', 'admin'],      // cupones: solo admin y superadmin

  // Acciones específicas
  'productos.crear':   ['superadmin', 'admin', 'editor'],
  'productos.editar':  ['superadmin', 'admin', 'editor'],
  'productos.borrar':  ['superadmin', 'admin'],
  'productos.toggle':  ['superadmin', 'admin', 'editor'],

  'categorias.crear':  ['superadmin', 'admin', 'editor'],
  'categorias.editar': ['superadmin', 'admin', 'editor'],
  'categorias.borrar': ['superadmin', 'admin'],

  'pedidos.ver':        ['superadmin', 'admin', 'editor', 'viewer'],
  'pedidos.estado':     ['superadmin', 'admin', 'editor'],
  'pedidos.tracking':   ['superadmin', 'admin', 'editor'],
  'pedidos.cancelar':   ['superadmin', 'admin'],

  'estadisticas.ver':   ['superadmin', 'admin'],
  'estadisticas.export':['superadmin'],

  'usuarios.ver':       ['superadmin'],
  'usuarios.crear':     ['superadmin'],
  'usuarios.editar':    ['superadmin'],
  'usuarios.borrar':    ['superadmin'],
  'usuarios.rol':       ['superadmin'],
}

// ─── Helper: ¿tiene permiso? ─────────────────────────────────────────────────
export function can(role, permission) {
  if (!role) return false
  return (PERMISSIONS[permission] ?? []).includes(role)
}

// ─── Helper: nav items filtrados por rol ─────────────────────────────────────
export function navForRole(role) {
  return NAV_ITEMS.filter(n => can(role, n.permission))
}

import { LayoutDashboard, ShoppingBag, Package, Tag, BarChart2, Truck, Users, Ticket } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/admin',              label: 'Dashboard',    icon: LayoutDashboard, permission: 'dashboard',    end: true },
  { to: '/admin/pedidos',      label: 'Pedidos',       icon: ShoppingBag,     permission: 'pedidos'              },
  { to: '/admin/productos',    label: 'Productos',     icon: Package,         permission: 'productos'            },
  { to: '/admin/categorias',   label: 'Categorías',    icon: Tag,             permission: 'categorias'           },
  { to: '/admin/estadisticas', label: 'Estadísticas',  icon: BarChart2,       permission: 'estadisticas'         },
  { to: '/admin/envios',       label: 'Envíos',        icon: Truck,           permission: 'envios'               },
  { to: '/admin/usuarios',     label: 'Usuarios',      icon: Users,           permission: 'usuarios'             },
  { to: '/admin/cupones',      label: 'Cupones',       icon: Ticket,          permission: 'cupones'              },
]

// ─── Usuarios demo para modo sin Supabase ────────────────────────────────────
export const DEMO_USERS = [
  { id: 'demo-1', email: 'superadmin@artesana.es', password: 'super1234',  role: 'superadmin', name: 'Super Admin' },
  { id: 'demo-2', email: 'admin@artesana.es',      password: 'admin1234',  role: 'admin',      name: 'Administrador' },
  { id: 'demo-3', email: 'editor@artesana.es',     password: 'editor1234', role: 'editor',     name: 'Editor' },
  { id: 'demo-4', email: 'viewer@artesana.es',     password: 'viewer1234', role: 'viewer',     name: 'Visualizador' },
]
