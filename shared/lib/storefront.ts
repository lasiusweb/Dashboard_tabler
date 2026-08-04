// Pure storefront engines — no I/O, no Astro, no DOM. Safe to import from page
// front matter, bundled client scripts, and vitest tests.
// Currency: firstcrop.in prices are in INR (₹, en-IN grouping).

export const STATUS_STEPS = ['Placed', 'Packed', 'Shipped', 'Delivered'] as const

/** Formats a rupee value with en-IN grouping, e.g. 1115 → "₹1,115". */
export function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

/** Whole percentage saved off the MRP, 0 when there is no discount. */
export function discountPercent(mrp: number, price: number): number {
  if (!mrp || mrp <= price) return 0
  return Math.round(((mrp - price) / mrp) * 100)
}

/** null stock means "not tracked" → always purchasable. */
export function isInStock(stock: number | null): boolean {
  return stock === null || stock > 0
}

export type Zone = 'metro' | 'urban' | 'semi-urban' | 'rural'

export type PinLookup = { pincode: string; zone: Zone; deliveryDays: number; cod: boolean }

/** Validates a 6-digit PIN against the pincode list; null when invalid/unknown. */
export function checkPinCode(pincode: string, pincodes: PinLookup[]): PinLookup | null {
  const pin = pincode.trim().replace(/\D/g, '')
  if (!/^\d{6}$/.test(pin)) return null
  return pincodes.find((p) => p.pincode === pin) ?? null
}

/** Delivery date estimate from today plus `days`. */
export function deliveryEstimate(days: number, from: Date = new Date()): Date {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d
}

/** "Wed, 4 Aug" style short estimate. */
export function formatEstimate(date: Date): string {
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export type CouponShape = { type: 'percent' | 'fixed' | 'freeShipping'; value: number; minBasket: number }

/** Rupees saved by a coupon on a subtotal, capped at the subtotal. */
export function couponSavings(subtotal: number, coupon: CouponShape, delivery: number): number {
  switch (coupon.type) {
    case 'percent':
      return Math.round((subtotal * coupon.value) / 100)
    case 'fixed':
      return Math.min(coupon.value, subtotal)
    case 'freeShipping':
      return Math.min(delivery, subtotal)
    default:
      return 0
  }
}

export function couponEligible(subtotal: number, coupon: CouponShape): boolean {
  return subtotal >= coupon.minBasket
}

export type Totals = { subtotal: number; discount: number; delivery: number; codFee: number; total: number }

/** Order summary numbers; discount never exceeds the subtotal, total never negative. */
export function cartTotals(lines: Array<{ qty: number; price: number }>, opts: { delivery: number; codFee: number; discount: number }): Totals {
  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.price, 0)
  const discount = Math.min(opts.discount, subtotal)
  const total = Math.max(0, subtotal - discount + opts.delivery + opts.codFee)
  return { subtotal, discount, delivery: opts.delivery, codFee: opts.codFee, total }
}

export type Searchable = { name: string; brand?: string; tags?: string[]; categoryName?: string }

/** Token-wise substring match over name/brand/tags/category, case-insensitive. */
export function searchProducts<T extends Searchable>(products: T[], query: string): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return products
  const tokens = q.split(/\s+/).filter(Boolean)
  return products.filter((p) => {
    const haystack = [p.name, p.brand ?? '', ...(p.tags ?? []), p.categoryName ?? ''].join(' ').toLowerCase()
    return tokens.every((token) => haystack.includes(token))
  })
}

/** 1..4 for Placed/Packed/Shipped/Delivered; 0 for anything else (no step shown). */
export function orderStatusStep(status: string): number {
  const idx = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number])
  return idx === -1 ? 0 : idx + 1
}
