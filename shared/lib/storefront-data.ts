// Storefront types + build-time loaders. Single source of truth for the domain
// types shared by local JSON (`shared/data/storefront/**`), the Supabase CMS
// tables, and the pages. Load strategy: fetch each table from Supabase at build
// time (when env vars are set) and fall back to the checked-in per-entry JSON.

import { fetchStorefrontTable, getSupabase } from './supabase'

// --- Types ------------------------------------------------------------------

export type PackSize = {
  label: string
  mrp: number
  price: number
  unit: string
  /** government subsidy (₹) applied to the price, e.g. DAP/Urea */
  subsidy?: number
}

export type PricePoint = { date: string; price: number }

export type Product = {
  slug: string
  id: string
  name: string
  categoryId: string
  brand: string
  /** null until real photography lands — placeholders render in its place */
  image: string | null
  rating: number
  ratingCount: number
  reviewIds: string[]
  shortDescription: string
  longDescription: string
  highlights: string[]
  specifications: Record<string, string>
  packSizes: PackSize[]
  /** null = stock not tracked */
  stock: number | null
  tags: string[]
  badge?: string
  season: string[]
  cultivationGuide?: string[]
  priceTrend: PricePoint[]
}

export type Category = {
  slug: string
  name: string
  icon: string
  description: string
  productIds: string[]
  season?: string
  faqIds: string[]
}

export type Offer = {
  slug: string
  title: string
  description: string
  code: string
  type: 'percent' | 'fixed' | 'freeShipping'
  value: number
  minBasket: number
  validUntil: string
  products: string[]
  color: string
  icon: string
  featured: boolean
}

export type Review = {
  id: string
  productId: string
  author: string
  rating: number
  date: string
  title: string
  body: string
  verified: boolean
  helpfulCount: number
}

export type FaqCategory = 'ordering' | 'delivery' | 'payment' | 'returns' | 'product'

export type Faq = {
  id: string
  category: FaqCategory
  question: string
  answer: string
}

export type Crop = {
  slug: string
  name: string
  season: 'kharif' | 'rabi' | 'zaid'
  sowStart: string
  sowEnd: string
  harvestStart: string
  harvestEnd: string
  states: string[]
  productIds: string[]
  tip: string
}

export type Zone = 'metro' | 'urban' | 'semi-urban' | 'rural'

export type PinCode = { pincode: string; zone: Zone; deliveryDays: number; cod: boolean }

export type OrderItem = { productId: string; name: string; packSize: string; qty: number; price: number }

export type OrderEvent = { label: string; date: string; done: boolean }

export type Order = {
  slug: string
  id: string
  date: string
  status: 'Placed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'RTO'
  items: OrderItem[]
  payment: string
  payColor: string
  statusColor: string
  total: number
  zone: string
  timeline: OrderEvent[]
}

// Singletons — shared/data/storefront/*.json

export type HomeHero = { title: string; subtitle: string; ctas: { label: string; href: string; primary?: boolean }[] }

export type HomePage = {
  hero: HomeHero
  trustBadges: { icon: string; title: string; text: string }[]
  categoryTiles: { categoryId: string; caption: string }[]
  featuredProductIds: string[]
  bundleIds: string[]
  seasonCallout: { title: string; text: string; cta: { label: string; href: string }; icon: string }
  testimonials: { author: string; role: string; quote: string }[]
  stats: { value: string; label: string }[]
}

export type CheckoutPayMethod = { id: string; name: string; icon: string; disabled?: boolean }

export type CheckoutConfig = {
  deliveryFees: Record<Zone, number>
  freeShipThreshold: number
  codFee: number
  payMethods: CheckoutPayMethod[]
  validation: {
    nameMin: number
    phone: string
    pincode: string
    addressMin: number
  }
  supportNote: string
}

export type SupportChannel = { id: string; name: string; detail: string; hours: string; icon: string }

export type SupportPolicy = { icon: string; title: string; text: string; bullets: string[] }

export type SupportConfig = {
  channels: SupportChannel[]
  policies: SupportPolicy[]
  escalationSteps: { title: string; text: string }[]
  footerNote: string
}

export type CartConfig = {
  emptyState: { title: string; message: string }
  recommendedIds: string[]
}

export type WishlistConfig = {
  emptyState: { title: string; message: string }
  giftPrompt: string
}

// --- Local data (JSON fallback) ---------------------------------------------

const local = {
  categories: import.meta.glob('../data/storefront/categories/*.json', { eager: true, import: 'default' }),
  products: import.meta.glob('../data/storefront/products/*.json', { eager: true, import: 'default' }),
  offers: import.meta.glob('../data/storefront/offers/*.json', { eager: true, import: 'default' }),
  reviews: import.meta.glob('../data/storefront/reviews/*.json', { eager: true, import: 'default' }),
  faqs: import.meta.glob('../data/storefront/faqs/*.json', { eager: true, import: 'default' }),
  crops: import.meta.glob('../data/storefront/crops/*.json', { eager: true, import: 'default' }),
  pincodes: import.meta.glob('../data/storefront/pincodes/*.json', { eager: true, import: 'default' }),
  orders: import.meta.glob('../data/storefront/orders/*.json', { eager: true, import: 'default' }),
} as const

export type StorefrontEntry = { slug?: string; id?: string }

export type LocalTable = keyof typeof local

const localSingletons = {
  home: import.meta.glob('../data/storefront/home.json', { eager: true, import: 'default' }),
  checkout: import.meta.glob('../data/storefront/checkout.json', { eager: true, import: 'default' }),
  support: import.meta.glob('../data/storefront/support.json', { eager: true, import: 'default' }),
  cart: import.meta.glob('../data/storefront/cart.json', { eager: true, import: 'default' }),
  wishlist: import.meta.glob('../data/storefront/wishlist.json', { eager: true, import: 'default' }),
}

const localSingletonMap = Object.fromEntries(Object.entries(localSingletons).map(([key, glob]) => [key, Object.values(glob)[0]])) as Record<keyof typeof localSingletons, unknown>

const isBuild = typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined' && Boolean(import.meta.env.SSR)

/** Singleton configs keyed by their JSON file name. */
export type ConfigMap = {
  home: HomePage
  checkout: CheckoutConfig
  support: SupportConfig
  cart: CartConfig
  wishlist: WishlistConfig
}

// --- Loaders ----------------------------------------------------------------

/** All entries of a collection: Supabase-first at build, JSON fallback. */
export async function getCollection<T extends object>(table: LocalTable): Promise<T[]> {
  if (isBuild) {
    const rows = await fetchStorefrontTable(table)
    if (rows) return rows.map((row) => row.data as T)
  }
  return (Object.values(local[table]) as T[]).sort((a, b) => ((a as StorefrontEntry).slug ?? (a as StorefrontEntry).id ?? '').localeCompare((b as StorefrontEntry).slug ?? (b as StorefrontEntry).id ?? ''))
}

/** Single entry by slug (or id for id-keyed collections). */
export async function getEntry<T extends object>(table: LocalTable, key: string): Promise<T | undefined> {
  const rows = await getCollection<T>(table)
  return rows.find((row) => (row as StorefrontEntry).slug === key || (row as StorefrontEntry).id === key)
}

/** Singleton config (`storefront_config` table / *.json singleton). */
export async function getConfig<K extends keyof ConfigMap>(key: K): Promise<ConfigMap[K]> {
  if (isBuild) {
    const client = await getSupabase()
    if (client) {
      const { data, error } = await client.from('storefront_config').select('slug, data').eq('slug', key).maybeSingle()
      if (!error && data?.data) return data.data as ConfigMap[K]
    }
  }
  return localSingletonMap[key] as ConfigMap[K]
}

export async function getProducts(): Promise<Product[]> {
  return getCollection<Product>('products')
}

export async function getCategories(): Promise<Category[]> {
  return getCollection<Category>('categories')
}

export async function getFaqs(): Promise<Faq[]> {
  return getCollection<Faq>('faqs')
}

/** Resolves ids to products, preserving the given id order (missing skipped). */
export function productsById(products: Product[], ids: string[]): Product[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p))
}

/** Categories keyed by slug, for cheap lookups in pages. */
export function categoryMap(categories: Category[]): Map<string, Category> {
  return new Map(categories.map((c) => [c.slug, c]))
}
