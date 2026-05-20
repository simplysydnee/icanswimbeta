import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { userIds } = (await req.json()) as { userIds: string[] }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array is required' }, { status: 400 })
    }

    // Authenticate as admin first
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()
    if (!roleRow) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseSecret = process.env.SUPABASE_SECRET_KEY!
    if (!supabaseUrl || !supabaseSecret) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    // Fetch emails for the given user IDs
    const { data: profiles, error: profileError } = await adminClient
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const results: { id: string; email: string; success: boolean; error?: string }[] = []

    for (const profile of profiles ?? []) {
      if (!profile.email) {
        results.push({ id: profile.id, email: '', success: false, error: 'No email on profile' })
        continue
      }

      try {
        const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(profile.email, {
          data: { full_name: profile.full_name },
        })

        results.push({
          id: profile.id,
          email: profile.email,
          success: !inviteError,
          error: inviteError?.message ?? undefined,
        })
      } catch (err) {
        results.push({
          id: profile.id,
          email: profile.email,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function createServerClient() {
  const { createServerClient: createSsr } = await import('@supabase/ssr')
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  return createSsr(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
}
