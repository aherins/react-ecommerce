export function buildTrackingUrl(carrier, trackingNumber) {
  if (!carrier?.trackingUrlTemplate || !trackingNumber?.trim()) return null
  return carrier.trackingUrlTemplate.replace(/\{tracking\}/g, encodeURIComponent(trackingNumber.trim()))
}
