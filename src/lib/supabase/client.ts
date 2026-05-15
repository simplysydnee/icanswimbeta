import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
  // Return cached client if exists
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // This should never happen in the browser — NEXT_PUBLIC_ vars are inlined at build time.
    // If this fires it means the env vars were not set at build/dev startup.
    console.error('[v0] Supabase env vars missing — check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    throw new Error('Supabase environment variables are not configured. Please check your environment settings.')
  }

  client = createBrowserClient(supabaseUrl, supabaseKey)
  return client
}
