import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
  // Return cached client if exists
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Log for debugging but DON'T return a mock
    // NEXT_PUBLIC vars should always be available in browser
    console.error('Supabase env vars missing:', {
      url: !!supabaseUrl,
      key: !!supabaseKey,
      isServer: typeof window === 'undefined'
    })

    // Throw error so we know something is wrong
    throw new Error('Supabase environment variables are not configured. Please check your .env.local file.')
  }

  client = createBrowserClient(supabaseUrl, supabaseKey)
  return client
}