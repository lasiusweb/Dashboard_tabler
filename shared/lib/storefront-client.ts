// Client-side cart + wishlist store (localStorage), shared by the storefront
// components' bundled scripts. Vite dedupes the module across <script> tags, so
// the header badge, PDP button, cart rows and wishlist toggle all observe the
// same state via `subscribe`.
// Guest-only by design: auth is deferred, so nothing here is user-scoped.

export type CartLine = { productId: string; packSize: string; qty: number }

const CART_KEY = 'firstcrop-cart'
const WISHLIST_KEY = 'firstcrop-wishlist'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  window.localStorage.setItem(key, JSON.stringify(value))
}

let cart: CartLine[] = read(CART_KEY, [])
let wishlist: string[] = read(WISHLIST_KEY, [])
const listeners = new Set<() => void>()

function emit(): void {
  listeners.forEach((fn) => fn())
}

/** Returns an unsubscribe function. Call once in each script that reads state. */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  fn()
  return () => listeners.delete(fn)
}

export function getCart(): CartLine[] {
  return [...cart]
}

export function cartCount(): number {
  return cart.reduce((n, l) => n + l.qty, 0)
}

export function addToCart(productId: string, packSize: string, qty = 1): void {
  const line = cart.find((l) => l.productId === productId && l.packSize === packSize)
  if (line) line.qty += qty
  else cart.push({ productId, packSize, qty })
  write(CART_KEY, cart)
  emit()
}

export function setQty(productId: string, packSize: string, qty: number): void {
  const line = cart.find((l) => l.productId === productId && l.packSize === packSize)
  if (!line) return
  if (qty <= 0) cart = cart.filter((l) => l !== line)
  else line.qty = qty
  write(CART_KEY, cart)
  emit()
}

export function removeFromCart(productId: string, packSize: string): void {
  cart = cart.filter((l) => !(l.productId === productId && l.packSize === packSize))
  write(CART_KEY, cart)
  emit()
}

export function clearCart(): void {
  cart = []
  write(CART_KEY, cart)
  emit()
}

export function getWishlist(): string[] {
  return [...wishlist]
}

export function isWishlisted(productId: string): boolean {
  return wishlist.includes(productId)
}

/** Returns the new wishlisted state. */
export function toggleWishlist(productId: string): boolean {
  wishlist = wishlist.includes(productId) ? wishlist.filter((id) => id !== productId) : [...wishlist, productId]
  write(WISHLIST_KEY, wishlist)
  emit()
  return wishlist.includes(productId)
}

export function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

/** Renders the shared toasts (see StoreLayout). */
export function showToast(message: string): void {
  document.dispatchEvent(new CustomEvent('firstcrop:toast', { detail: message }))
}

/** Reads a data attribute holding a JSON string; null on missing/broken input. */
export function readJsonData<T>(element: Element, attribute: string): T | null {
  try {
    const raw = element.getAttribute(attribute)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
