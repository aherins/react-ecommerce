export const DEMO_CATEGORIES = [
  { id: 'cat-ceramica', name: 'Cerámica', slug: 'ceramica' },
  { id: 'cat-textil', name: 'Textil', slug: 'textil' },
  { id: 'cat-madera', name: 'Madera', slug: 'madera' },
]

export const DEMO_SUPPLIERS = [
  {
    id: 'sup-ceramica', name: 'Taller Cerámico Luna', contactName: 'María García',
    email: 'maria@tallerceramicoluna.es', phone: '+34 600 111 222',
    website: 'https://tallerceramicoluna.es', address: 'Calle Betis 12, Sevilla',
    notes: 'Proveedor principal de cerámica.', active: true,
  },
  {
    id: 'sup-textil', name: 'Textiles del Sur', contactName: 'Ana Ruiz',
    email: 'ana@textilessur.es', phone: '+34 600 333 444',
    website: '', address: 'Puerto Real, Cádiz',
    notes: 'Tejidos y bordados artesanales.', active: true,
  },
  {
    id: 'sup-madera', name: 'Maderas Recuperadas SL', contactName: 'Pedro López',
    email: 'pedro@maderasrec.es', phone: '+34 600 555 666',
    website: '', address: 'Polígono industrial, Huelva',
    notes: 'Madera de olivo recuperada.', active: true,
  },
]

export const DEMO_SHIPPING_CARRIERS = [
  {
    id: 'carrier-seur', name: 'SEUR', code: 'SEUR',
    trackingUrlTemplate: 'https://www.seur.com/livetracking/?segOnline={tracking}',
    phone: '902 101 010', website: 'https://www.seur.com',
    notes: 'Envíos peninsulares 24-48h.', active: true,
  },
  {
    id: 'carrier-correos', name: 'Correos', code: 'CORREOS',
    trackingUrlTemplate: 'https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number={tracking}',
    phone: '900 400 004', website: 'https://www.correos.es',
    notes: 'Paq Estándar y Paq Premium.', active: true,
  },
  {
    id: 'carrier-mrw', name: 'MRW', code: 'MRW',
    trackingUrlTemplate: 'https://www.mrw.es/seguimiento_envios/MRW{tracking}',
    phone: '902 300 400', website: 'https://www.mrw.es',
    notes: 'Urgente y económico.', active: true,
  },
]

export const DEMO_SUPPLIER_ORDERS = [
  {
    id: 'spo-1',
    supplierId: 'sup-ceramica',
    reference: 'PO-2026-001',
    status: 'received',
    items: [
      { productId: 'prod-1', qty: 20, unitCost: 12 },
      { productId: 'prod-2', qty: 15, unitCost: 9 },
    ],
    total: 375,
    notes: 'Reposición trimestral de cerámica.',
    invoices: [],
    createdAt: '2026-01-15T10:00:00.000Z',
    expectedAt: '2026-01-22T00:00:00.000Z',
    receivedAt: '2026-01-20T14:30:00.000Z',
  },
]

export const DEMO_PRODUCTS = [
  {
    id: 'prod-1', name: 'Cuenco de gres', price: 28, categoryId: 'cat-ceramica',
    supplierIds: ['sup-ceramica', 'sup-textil'],
    image: 'https://images.unsplash.com/photo-1610701596007-6a9e9a0c8f0a?w=400&h=400&fit=crop',
    description: 'Cuenco artesanal esmaltado a mano. Pieza única con pequeñas variaciones naturales.',
    stock: 12, active: true,
  },
  {
    id: 'prod-2', name: 'Taza mate', price: 22, categoryId: 'cat-ceramica', supplierIds: ['sup-ceramica'],
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    description: 'Taza de cerámica mate, ideal para el desayuno diario.',
    stock: 8, active: true,
  },
  {
    id: 'prod-3', name: 'Mantel lino', price: 65, categoryId: 'cat-textil', supplierIds: ['sup-textil'],
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
    description: 'Mantel de lino teñido con plantas. Hecho en taller sevillano.',
    stock: 5, active: true,
  },
  {
    id: 'prod-4', name: 'Cojín bordado', price: 38, categoryId: 'cat-textil', supplierIds: ['sup-textil'],
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2d2?w=400&h=400&fit=crop',
    description: 'Cojín de algodón con bordado tradicional andaluz.',
    stock: 15, active: true,
  },
  {
    id: 'prod-5', name: 'Bandeja de olivo', price: 45, categoryId: 'cat-madera', supplierIds: ['sup-madera'],
    image: 'https://images.unsplash.com/photo-1602874801006-c9e0b5c2b5a0?w=400&h=400&fit=crop',
    description: 'Bandeja tallada en madera de olivo recuperada.',
    stock: 6, active: true,
  },
  {
    id: 'prod-6', name: 'Salero dual', price: 18, categoryId: 'cat-madera', supplierIds: ['sup-madera', 'sup-ceramica'],
    image: 'https://images.unsplash.com/photo-1600481176431-47ad2abf2f50?w=400&h=400&fit=crop',
    description: 'Salero y pimentero de madera con acabado natural.',
    stock: 20, active: true,
  },
]
