const CLOUD  = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME  || ''
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''

export const hasCloudinary = Boolean(CLOUD && PRESET)

/**
 * Sube un File al preset unsigned de Cloudinary.
 * Devuelve la URL segura de la imagen.
 */
export async function uploadImage(file) {
  if (!hasCloudinary) {
    // Modo sin credenciales: devuelve un object URL local (solo válido en esta sesión)
    return URL.createObjectURL(file)
  }

  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', PRESET)
  form.append('folder', 'shop-mvp')

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) throw new Error('Error al subir imagen a Cloudinary')
  const data = await res.json()
  return data.secure_url
}