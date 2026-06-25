import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import './LegalPage.css'

const PAGES = {
  privacidad: {
    title: 'Política de privacidad',
    body: 'Tratamos tus datos para gestionar pedidos, envíos y comunicaciones relacionadas con tu compra. No vendemos tus datos a terceros. Puedes ejercer tus derechos de acceso, rectificación y supresión escribiendo a hola@artesana.es.',
  },
  terminos: {
    title: 'Términos y condiciones',
    body: 'Al comprar en Artesana aceptas nuestros precios, plazos de envío y política de devoluciones. Los productos artesanales pueden presentar ligeras variaciones respecto a las fotografías.',
  },
  devoluciones: {
    title: 'Devoluciones',
    body: 'Dispones de 14 días desde la recepción para devolver un artículo en perfecto estado y embalaje original. Contacta con hola@artesana.es indicando tu número de pedido.',
  },
}

export default function LegalPage() {
  const { page } = useParams()
  const content = PAGES[page] || PAGES.privacidad
  return (
    <main className="legal-main">
      <PageMeta title={content.title}/>
      <div className="legal-inner">
        <Link to="/" className="legal-back">← Volver a la tienda</Link>
        <h1>{content.title}</h1>
        <p>{content.body}</p>
      </div>
    </main>
  )
}
