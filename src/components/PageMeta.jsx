import { useEffect } from 'react'

const DEFAULT = {
  title: 'Artesana — Artesanía contemporánea',
  description: 'Tienda online de artesanía hecha a mano en Sevilla. Cerámica, textil y madera.',
}

export default function PageMeta({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} · Artesana` : DEFAULT.title
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = description || DEFAULT.description
  }, [title, description])

  return null
}
