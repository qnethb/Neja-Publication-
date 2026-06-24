import { formatLKR } from './format.js'

// Business WhatsApp number in international format, digits only (no +).
// Replace with the real Neja Publication number before going live.
export const WHATSAPP_NUMBER = '94770000000'

// Build a wa.me deep link with a pre-filled, readable order message.
export function buildOrderWhatsAppLink({
  items,
  subtotal,
  delivery,
  total,
  customer,
  district,
  payment,
  orderRef,
}) {
  const lines = []
  lines.push(`*New Order — Neja Publication*`)
  if (orderRef) lines.push(`Ref: ${orderRef}`)
  lines.push('')
  lines.push('*Items:*')
  items.forEach((i) => {
    lines.push(`• ${i.title} × ${i.qty} — ${formatLKR(i.price * i.qty)}`)
  })
  lines.push('')
  lines.push(`Subtotal: ${formatLKR(subtotal)}`)
  lines.push(`Delivery: ${delivery === 0 ? 'FREE' : formatLKR(delivery)}`)
  lines.push(`*Total: ${formatLKR(total)}*`)
  lines.push('')
  lines.push('*Deliver to:*')
  if (customer?.name) lines.push(`Name: ${customer.name}`)
  if (customer?.phone) lines.push(`Phone: ${customer.phone}`)
  if (customer?.address) lines.push(`Address: ${customer.address}`)
  if (customer?.city) lines.push(`City: ${customer.city}`)
  if (district) lines.push(`District: ${district}`)
  if (payment) lines.push(`Payment: ${payment}`)
  if (customer?.notes) lines.push(`Notes: ${customer.notes}`)

  const text = encodeURIComponent(lines.join('\n'))
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
}

// Simple contact / enquiry link.
export function buildContactWhatsAppLink(message) {
  const text = encodeURIComponent(message || 'Hello Neja Publication, I have a question.')
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
}
