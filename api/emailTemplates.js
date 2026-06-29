function layout({ storeName, body }) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #d4cfc9">
    <div style="background:#0f0e0d;padding:28px 32px">
      <p style="margin:0;font-size:20px;font-weight:800;letter-spacing:0.12em;color:#f5f2ee">${storeName.toUpperCase()}</p>
    </div>
    <div style="padding:32px">${body}</div>
    <div style="background:#f5f2ee;padding:16px 32px;font-size:12px;color:#8a8680;border-top:1px solid #d4cfc9">
      <p style="margin:0">© ${new Date().getFullYear()} ${storeName}</p>
    </div>
  </div>
</body>
</html>`
}

export function orderConfirmationHtml({ orderId, items, total, simulated, storeName }) {
  const itemsHtml = items.map((i) =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center">× ${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right">${(i.price * i.qty).toFixed(2)} €</td>
    </tr>`,
  ).join('')

  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#0f0e0d">¡Pedido confirmado!</h1>
    <p style="color:#8a8680;margin:0 0 24px">Gracias por tu compra. Aquí tienes el resumen.</p>
    ${simulated ? '<p style="background:#fef9c3;border:1px solid #fde68a;padding:8px 12px;border-radius:4px;font-size:13px;color:#92400e">Pago simulado — no se ha cargado ningún importe real.</p>' : ''}
    <p style="font-size:13px;color:#8a8680;margin:0 0 16px">Ref: <code style="background:#f5f2ee;padding:2px 6px;border-radius:4px">${orderId}</code></p>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#8a8680;padding-bottom:8px;border-bottom:2px solid #d4cfc9">Producto</th>
          <th style="text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#8a8680;padding-bottom:8px;border-bottom:2px solid #d4cfc9">Cant.</th>
          <th style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#8a8680;padding-bottom:8px;border-bottom:2px solid #d4cfc9">Precio</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div style="text-align:right;margin-top:16px">
      <p style="font-size:18px;font-weight:700;margin:0">Total: ${total.toFixed(2)} €</p>
      <p style="font-size:13px;color:#8a8680;margin:4px 0 0">Envío gratuito</p>
    </div>`

  return layout({ storeName, body })
}

export function stockAlertHtml({ productName, productPrice, image, productUrl, storeName }) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f0e0d">¡Ya hay stock!</h1>
    <p style="color:#8a8680;margin:0 0 20px">El producto que esperabas vuelve a estar disponible.</p>
    ${image ? `<img src="${image}" alt="${productName}" style="width:100%;max-width:280px;border-radius:8px;display:block;margin:0 0 20px;border:1px solid #e5e7eb"/>` : ''}
    <p style="font-size:16px;font-weight:700;margin:0 0 4px;color:#0f0e0d">${productName}</p>
    <p style="font-size:15px;color:#8a8680;margin:0 0 24px">${Number(productPrice).toFixed(2)} €</p>
    <a href="${productUrl}" style="display:inline-block;background:#0f0e0d;color:#f5f2ee;text-decoration:none;padding:12px 24px;border-radius:99px;font-size:14px;font-weight:600">Ver producto</a>`

  return layout({ storeName, body })
}

export function welcomeStaffHtml({ name, email, password, role, loginUrl, storeName }) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f0e0d">Acceso al panel</h1>
    <p style="color:#8a8680;margin:0 0 20px">Hola${name ? ` ${name}` : ''}, se ha creado tu cuenta de equipo en ${storeName}.</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#8a8680">Email</td><td style="padding:8px 0;font-weight:600">${email}</td></tr>
      <tr><td style="padding:8px 0;color:#8a8680">Contraseña</td><td style="padding:8px 0;font-family:monospace;font-weight:600">${password}</td></tr>
      <tr><td style="padding:8px 0;color:#8a8680">Rol</td><td style="padding:8px 0;font-weight:600">${role}</td></tr>
    </table>
    <p style="font-size:13px;color:#8a8680;margin:20px 0">Te recomendamos cambiar la contraseña tras el primer acceso.</p>
    <a href="${loginUrl}" style="display:inline-block;background:#0f0e0d;color:#f5f2ee;text-decoration:none;padding:12px 24px;border-radius:99px;font-size:14px;font-weight:600">Ir al panel</a>`

  return layout({ storeName, body })
}

export function temporaryPasswordHtml({
  name,
  email,
  password,
  loginUrl,
  storeName,
  accountLabel = 'tu cuenta',
}) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f0e0d">Nueva contraseña temporal</h1>
    <p style="color:#8a8680;margin:0 0 20px">Hola${name ? ` ${name}` : ''}, hemos generado una contraseña temporal para ${accountLabel} en ${storeName}.</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#8a8680">Email</td><td style="padding:8px 0;font-weight:600">${email}</td></tr>
      <tr><td style="padding:8px 0;color:#8a8680">Contraseña temporal</td><td style="padding:8px 0;font-family:monospace;font-weight:700">${password}</td></tr>
    </table>
    <p style="font-size:13px;color:#8a8680;margin:18px 0">Al iniciar sesión te pediremos cambiarla por una nueva contraseña segura.</p>
    <a href="${loginUrl}" style="display:inline-block;background:#0f0e0d;color:#f5f2ee;text-decoration:none;padding:12px 24px;border-radius:99px;font-size:14px;font-weight:600">Iniciar sesión</a>`

  return layout({ storeName, body })
}
