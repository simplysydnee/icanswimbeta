import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function authAsAdmin(req: Request) {
  const { cookies } = await import('next/headers')
  const { createServerClient } = await import('@supabase/ssr')
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()
  return roleRow ? user : null
}

export async function POST(req: Request) {
  try {
    const admin = await authAsAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = (await req.json()) as { userId: string }
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const secretKey = process.env.SUPABASE_SECRET_KEY!

    const adminClient = createClient(supabaseUrl, secretKey)

    // Get target user's profile and roles
    const { data: profile, error: profileErr } = await adminClient
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    if (profileErr || !profile || !profile.email) {
      return NextResponse.json({ error: 'User not found or has no email' }, { status: 404 })
    }

    const { data: roleRows } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)

    const roles = (roleRows ?? []).map(r => r.role)
    const role = roles.includes('parent') ? 'parent'
      : roles.includes('coordinator') ? 'coordinator'
      : roles.includes('instructor') ? 'instructor'
      : 'parent'

    // Generate a magic link to get a one-time token
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
    })

    if (linkErr || !linkData?.properties?.otp) {
      return NextResponse.json({ error: linkErr?.message || 'Failed to generate link' }, { status: 500 })
    }

    // Exchange the OTP for a full session using an anon-key client
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    })

    const { data: otpData, error: otpErr } = await anonClient.auth.verifyOtp({
      email: profile.email,
      token: linkData.properties.otp,
      type: 'magiclink',
    })

    if (otpErr || !otpData?.session) {
      return NextResponse.json({ error: otpErr?.message || 'Failed to verify OTP' }, { status: 500 })
    }

    return NextResponse.json({
      access_token: otpData.session.access_token,
      refresh_token: otpData.session.refresh_token,
      expires_in: otpData.session.expires_in ?? 3600,
      user: { id: profile.id, email: profile.email, full_name: profile.full_name },
      role,
    })
  } catch (err) {
    console.error('View-as generate session error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
