import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const cookieStore = await cookies()

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
    
    try {
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
      }

      // Ensure profile exists for OAuth users
      if (session?.user) {
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
          // Continue anyway - profile will be created on next login
        }

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
          // Continue anyway - role will be assigned on next login
        }
      }
    } catch (error) {
      console.error('Error in OAuth callback:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    }
  }

  // Redirect to dashboard on success, or login if no code
  const redirectTo = code ? '/dashboard' : '/login'
  return NextResponse.redirect(`${origin}${redirectTo}`)
}