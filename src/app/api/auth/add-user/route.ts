import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { email, password, name, phone, role } = (await req.json()) as {
      email: string
      password: string
      name?: string
      phone?: string
      role: 'parent' | 'instructor' | 'admin' | 'coordinator'
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )
    console.log('Creating user with email:', email) 
    // Create user with password (no invite email)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, phone },
      })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // Create / update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: name || null,
        phone: phone || null,
      })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // Create / update role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        { user_id: userId, role },
        { onConflict: 'user_id,role' }
      )

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}