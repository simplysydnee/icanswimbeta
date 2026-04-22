import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function bearerTokenFromRequest(request: Request): string | null {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization')
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  const token = match?.[1]?.trim()
  return token || null
}

/**
 * Supabase client for Route Handlers: uses session cookies when present,
 * otherwise a JWT from `Authorization: Bearer <access_token>` (e.g. API clients).
 */
export async function createClientFromRequest(request: Request) {
  const cookieClient = await createClient()
  const { data: { user } } = await cookieClient.auth.getUser()
  if (user) return cookieClient

  const token = bearerTokenFromRequest(request)
  if (!token) return cookieClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return cookieClient

  return createSupabaseJsClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const createClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Log for debugging
    console.error('Supabase env vars missing in server:', {
      url: !!supabaseUrl,
      key: !!supabaseKey
    })

    // Throw error so we know something is wrong
    throw new Error('Supabase environment variables are not configured. Please check your .env.local file.')
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}