import { FREE_DELIVERY_THRESHOLD, getDistrict } from '../data/districts.js'

// Format an LKR amount, e.g. 1250 -> "Rs. 1,250"
export function formatLKR(amount, currencyLabel = 'Rs.') {
  const n = Math.round(Number(amount) || 0)
  return `${currencyLabel} ${n.toLocaleString('en-LK')}`
}

// Delivery fee given the order subtotal and chosen district id.
// Returns 0 when the free-delivery threshold is met or no district picked yet.
export function calcDelivery(subtotal, districtId) {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0
  const district = getDistrict(districtId)
  return district ? district.fee : 0
}

export function isFreeDelivery(subtotal) {
  return subtotal >= FREE_DELIVERY_THRESHOLD
}

// LKR remaining before free delivery unlocks (0 if already unlocked).
export function amountToFreeDelivery(subtotal) {
  return Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)
}

// Short, human order reference, e.g. "NJ-7F3A9"
export function makeOrderRef() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `NJ-${rand}`
}
