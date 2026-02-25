import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/reset-password'

  console.log('Auth confirm route called:', {
    token_hash: token_hash ? 'present' : 'missing',
    type,
    next,
    url: request.url
  })

  if (token_hash && type) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    console.log('Verifying OTP for password reset...')
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      console.log('OTP verification successful, redirecting to:', next)
      return NextResponse.redirect(new URL(next, request.url))
    } else {
      console.error('OTP verification failed:', error)
      console.error('Error details:', error.message)
    }
  } else {
    console.log('Missing token_hash or type parameters')
  }

  console.log('Redirecting to reset-password with invalid_token error')
  return NextResponse.redirect(
    new URL('/reset-password?error=invalid_token', request.url)
  )
}