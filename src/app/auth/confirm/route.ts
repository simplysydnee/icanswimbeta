import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  // Determine redirect destination based on OTP type
  const defaultNext = type === 'magiclink' ? '/dashboard' : '/reset-password'
  const next = searchParams.get('next') ?? defaultNext

  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL('/login?error=invalid_token', request.url)
    )
  }

  // Create response early so setAll can write cookies directly onto it
  const response = NextResponse.redirect(new URL(next, request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({ type, token_hash })

  if (error) {
    console.error('OTP verification failed:', error.message)
    // Use an absolute URL for the redirect so it works regardless of the origin
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', request.url)
    )
  }

  return response
}