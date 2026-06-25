export const DEMO_CATEGORIES = [
  { id: 'cat-ceramica', name: 'Cerámica', slug: 'ceramica' },
  { id: 'cat-textil', name: 'Textil', slug: 'textil' },
  { id: 'cat-madera', name: 'Madera', slug: 'madera' },
]

export const DEMO_PRODUCTS = [
  {
    id: 'prod-1', name: 'Cuenco de gres', price: 28, categoryId: 'cat-ceramica',
    image: 'https://images.unsplash.com/photo-1610701596007-6a9e9a0c8f0a?w=400&h=400&fit=crop',
    description: 'Cuenco artesanal esmaltado a mano. Pieza única con pequeñas variaciones naturales.',
    stock: 12, active: true,
  },
  {
    id: 'prod-2', name: 'Taza mate', price: 22, categoryId: 'cat-ceramica',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    description: 'Taza de cerámica mate, ideal para el desayuno diario.',
    stock: 8, active: true,
  },
  {
    id: 'prod-3', name: 'Mantel lino', price: 65, categoryId: 'cat-textil',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
    description: 'Mantel de lino teñido con plantas. Hecho en taller sevillano.',
    stock: 5, active: true,
  },
  {
    id: 'prod-4', name: 'Cojín bordado', price: 38, categoryId: 'cat-textil',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2d2?w=400&h=400&fit=crop',
    description: 'Cojín de algodón con bordado tradicional andaluz.',
    stock: 15, active: true,
  },
  {
    id: 'prod-5', name: 'Bandeja de olivo', price: 45, categoryId: 'cat-madera',
    image: 'https://images.unsplash.com/photo-1602874801006-c9e0b5c2b5a0?w=400&h=400&fit=crop',
    description: 'Bandeja tallada en madera de olivo recuperada.',
    stock: 6, active: true,
  },
  {
    id: 'prod-6', name: 'Salero dual', price: 18, categoryId: 'cat-madera',
    image: 'https://images.unsplash.com/photo-1600481176431-47ad2abf2f50?w=400&h=400&fit=crop',
    description: 'Salero y pimentero de madera con acabado natural.',
    stock: 20, active: true,
  },
]
