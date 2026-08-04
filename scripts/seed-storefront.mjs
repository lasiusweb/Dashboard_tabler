#!/usr/bin/env node
/**
 * Seed Supabase with storefront JSON data.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-storefront.mjs
 *
 * Requires: @supabase/supabase-js (install via `pnpm add -w @supabase/supabase-js`)
 * The service-role key bypasses RLS — never commit it.
 */

import { createClient } from '@supabase/supabase-js'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve, basename } from 'node:path'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.')
  process.exit(1)
}

const supabase = createClient(url, key)

// ── Table → local directory mapping ──────────────────────────────────────────

const COLLECTIONS = {
  storefront_categories: 'categories',
  storefront_products: 'products',
  storefront_offers: 'offers',
  storefront_reviews: 'reviews',
  storefront_faqs: 'faqs',
  storefront_crops: 'crops',
  storefront_pincodes: 'pincodes',
  storefront_orders: 'orders',
}

const SINGLETONS = ['home', 'checkout', 'support', 'cart', 'wishlist']

const DATA_ROOT = resolve('shared/data/storefront')

// ── Helpers ──────────────────────────────────────────────────────────────────

function readJsonFile(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function readDir(dirPath) {
  return readdirSync(dirPath)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({
      slug: basename(f, '.json'),
      data: readJsonFile(resolve(dirPath, f)),
    }))
}

async function upsertRows(table, entries) {
  const rows = entries.map((e) => ({
    slug: e.slug,
    data: e.data,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: 'slug' })

  if (error) throw new Error(`${table} upsert: ${error.message}`)
  return rows.length
}

async function deleteStale(table, keepSlugs) {
  const { data, error } = await supabase.from(table).select('slug')
  if (error) throw new Error(`${table} select: ${error.message}`)

  const stale = (data ?? []).map((r) => r.slug).filter((s) => !keepSlugs.has(s))
  if (stale.length === 0) return 0

  const { error: delErr } = await supabase.from(table).delete().in('slug', stale)
  if (delErr) throw new Error(`${table} delete: ${delErr.message}`)
  return stale.length
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding storefront data into Supabase…\n')

  // Collections
  for (const [table, dir] of Object.entries(COLLECTIONS)) {
    const entries = readDir(resolve(DATA_ROOT, dir))
    const inserted = await upsertRows(table, entries)
    const keep = new Set(entries.map((e) => e.slug))
    const deleted = await deleteStale(table, keep)
    console.log(`  ${table}: ${inserted} upserted, ${deleted} deleted`)
  }

  // Singletons
  for (const key of SINGLETONS) {
    const data = readJsonFile(resolve(DATA_ROOT, `${key}.json`))
    await upsertRows('storefront_config', [{ slug: key, data }])
    console.log(`  storefront_config[${key}]: upserted`)
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
