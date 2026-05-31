import React, { useState } from 'react'
import { Mail, Phone, MapPin, Clock, CheckCircle, Send, MessageSquare, HelpCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import './ContactPage.css'

const FAQS = [
  { q: '¿Cuánto tarda en llegar mi pedido?', a: 'Los envíos en Península Ibérica tardan entre 3 y 5 días hábiles. Recibirás un email con el número de seguimiento una vez enviado.' },
  { q: '¿Puedo devolver un artículo?', a: 'Sí, aceptamos devoluciones en los 14 días siguientes a la recepción del pedido. El artículo debe estar en perfectas condiciones y en su embalaje original.' },
  { q: '¿Los productos son realmente artesanales?', a: 'Absolutamente. Todos nuestros productos son elaborados a mano por artesanos locales de Sevilla y Andalucía. Cada pieza es única y puede tener pequeñas variaciones.' },
  { q: '¿Hacéis pedidos personalizados?', a: 'Sí, podemos trabajar pedidos personalizados con un mínimo de 2-3 semanas de antelación. Contáctanos por email para más información.' },
  { q: '¿Enviáis a Europa?', a: 'Sí, enviamos a toda Europa. Los plazos y costes de envío varían según el destino. Puedes consultar los precios al hacer el pedido.' },
]

export default function ContactPage() {
  const [form, setForm]       = useState({ name: '', email: '', subject: 'pedido', message: '' })
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    // Simula envío — en producción conectar con Resend o similar
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSent(true)
  }

  return (
    <div>
      <Navbar />
      <main className="contact-main">

        {/* Hero */}
        <section className="contact-hero">
          <div className="contact-hero-inner">
            <span className="contact-tag">Soporte al cliente</span>
            <h1>¿En qué podemos ayudarte?</h1>
            <p>Nuestro equipo responde en menos de 24 horas en días laborables.</p>
          </div>
        </section>

        <div className="contact-body">

          {/* Info cards */}
          <div className="contact-info-grid">
            {[
              { icon: Mail,    label: 'Email',    value: 'hola@artesana.es',       sub: 'Respuesta en 24h' },
              { icon: Phone,   label: 'Teléfono', value: '+34 954 000 000',         sub: 'L-V 9:00–18:00' },
              { icon: MapPin,  label: 'Dirección',value: 'Calle Sierpes 12, Sevilla',sub: 'Solo con cita previa' },
              { icon: Clock,   label: 'Horario',  value: 'L–V 9:00 a 18:00',       sub: 'Sáb 10:00–14:00' },
            ].map(c => (
              <div key={c.label} className="contact-info-card">
                <div className="info-card-icon"><c.icon size={20}/></div>
                <p className="info-card-label">{c.label}</p>
                <p className="info-card-value">{c.value}</p>
                <p className="info-card-sub">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="contact-cols">
            {/* Form */}
            <div className="contact-form-wrap">
              <h2><MessageSquare size={20}/>Envíanos un mensaje</h2>

              {sent ? (
                <div className="contact-sent">
                  <CheckCircle size={44} color="var(--success)"/>
                  <h3>Mensaje enviado</h3>
                  <p>Te responderemos en menos de 24 horas laborables.</p>
                  <button className="btn-outline" onClick={() => { setSent(false); setForm({ name:'', email:'', subject:'pedido', message:'' }) }}>
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-row-2">
                    <div className="field">
                      <label>Nombre</label>
                      <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Tu nombre"/>
                    </div>
                    <div className="field">
                      <label>Email</label>
                      <input type="email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="tu@email.com"/>
                    </div>
                  </div>
                  <div className="field">
                    <label>Motivo de contacto</label>
                    <select value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}>
                      <option value="pedido">Consulta sobre un pedido</option>
                      <option value="devolucion">Devolución o cambio</option>
                      <option value="producto">Información de producto</option>
                      <option value="personalizado">Pedido personalizado</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Mensaje</label>
                    <textarea required rows={5} value={form.message}
                      onChange={e=>setForm(f=>({...f,message:e.target.value}))}
                      placeholder="Describe tu consulta con el mayor detalle posible…"/>
                  </div>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? <span className="spinner"/> : <><Send size={15}/>Enviar mensaje</>}
                  </button>
                </form>
              )}
            </div>

            {/* FAQ */}
            <div className="contact-faq">
              <h2><HelpCircle size={20}/>Preguntas frecuentes</h2>
              {FAQS.map((faq, i) => (
                <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                  <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{faq.q}</span>
                    <span className="faq-arrow">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && <p className="faq-a">{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
