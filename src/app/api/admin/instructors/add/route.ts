import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Admin client with service role key for privileged operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    // 1. Verify requesting user is admin (using server client with cookies)
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!roleData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 2. Get request body
    const body = await request.json()
    const { email, full_name, title, bio, phone, avatar_url } = body

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email and full name are required' }, { status: 400 })
    }

    // 3. Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.some((u: any) => u.email === email)

    if (userExists) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // 4. Create auth user (using admin client)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (createError || !newUser.user) {
      return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 })
    }

    // 5. Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email,
        full_name,
        title: title || null,
        bio: bio || null,
        phone: phone || null,
        avatar_url: avatar_url || null,
        is_active: true
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Cleanup: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({
        error: `Failed to create profile: ${profileError.message}`
      }, { status: 500 })
    }

    // 6. Assign instructor role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'instructor'
      })

    if (roleError) {
      // Cleanup
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 })
    }

    // 7. Send password reset email so instructor can set their password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://icanswim209.com'}/reset-password`
      }
    })

    if (resetError) {
      console.error('Error sending password reset email:', resetError)
      // User was created successfully, just email failed
      console.warn('Instructor created but password reset email failed to send')
    }

    return NextResponse.json({
      success: true,
      message: 'Instructor created successfully',
      userId: newUser.user.id,
      emailSent: !resetError
    })

  } catch (error) {
    console.error('Add instructor error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}