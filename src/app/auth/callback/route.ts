import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (!code) {
    // Debug: log if magic link with token_hash arrived at the callback route
    if (requestUrl.searchParams.has('token_hash')) {
      console.warn('Auth callback: received token_hash instead of code — magic link should go to /auth/confirm')
    }
    return NextResponse.redirect(`${origin}/login`)
  }

  // Create response early so setAll can write cookies directly onto it
  const response = NextResponse.redirect(`${origin}/dashboard`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session?.user) {
    console.error('Error exchanging code for session:', error?.message || 'No session returned')
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
  }

  // Ensure profile exists for OAuth users
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: session.user.id,
      email: session.user.email,
      full_name: session.user.user_metadata?.full_name || '',
      avatar_url: session.user.user_metadata?.avatar_url || '',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })

  if (profileError) {
    console.error('Error ensuring profile exists:', profileError)
  }

  // Track login (non-fatal)
  try { await supabase.rpc('update_last_login') } catch {}

  // Ensure user has a role (default to 'parent')
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({
      user_id: session.user.id,
      role: 'parent',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,role'
    })

  if (roleError) {
    console.error('Error ensuring user role exists:', roleError)
  }

  return response
}