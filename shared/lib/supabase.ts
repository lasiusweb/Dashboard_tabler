// Lazy Supabase client. The anon key is public by design (RLS gates reads); the
// service-role key must NEVER appear in the bundle — the seed script runs
// outside Astro with its own node client. `@supabase/supabase-js` is imported
// dynamically so the JSON-fallback build works even without the dependency
// installed (it is only needed once env vars are configured).

type SupabaseClient = import('@supabase/supabase-js').SupabaseClient

let clientPromise: Promise<SupabaseClient | null> | null = null

/** Returns a client only when PUBLIC_SUPABASE_URL + ANON_KEY are set, else null. */
export function getSupabase(): Promise<SupabaseClient | null> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined
      const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined
      if (!url || !anonKey) return null
      const mod = await import('@supabase/supabase-js')
      return mod.createClient(url, anonKey)
    })()
  }
  return clientPromise
}

export type Row = { slug: string; data: Record<string, unknown> }

/**
 * Fetches all rows of a `storefront_*` table. Returns `null` on any error or
 * empty result so callers can fall back to local JSON. Throw is deliberately
 * avoided: a CMS outage must never fail the static build.
 */
export async function fetchStorefrontTable(table: string): Promise<Row[] | null> {
  const client = await getSupabase()
  if (!client) return null
  const { data, error } = await client.from(`storefront_${table}`).select('slug, data').order('slug')
  if (error) {
    console.warn(`[storefront] Supabase error on ${table}: ${error.message}`)
    return null
  }
  if (!data || data.length === 0) return null
  return data as Row[]
}
