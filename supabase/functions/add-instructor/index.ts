import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AddInstructorRequest {
  email: string
  full_name: string
  title?: string
  bio?: string
  phone?: string
  avatar_url?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Parse request body
    const requestData: AddInstructorRequest = await req.json()
    const { email, full_name, title, bio, phone, avatar_url } = requestData

    // Validate required fields
    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Email and full name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseClient.auth.admin.getUserByEmail(email)
    if (checkError && checkError.status !== 404) {
      console.error('Error checking existing user:', checkError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (existingUser?.user) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create auth user (this will send a password reset email)
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm email since admin is creating the account
      user_metadata: { full_name, role: 'instructor' }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = authData.user.id

    // Create profile record
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name,
        title: title || null,
        bio: bio || null,
        phone: phone || null,
        avatar_url: avatar_url || null,
        is_active: true
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Try to clean up the auth user if profile creation fails
      await supabaseClient.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ error: 'Failed to create instructor profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assign instructor role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'instructor'
      })

    if (roleError) {
      console.error('Error assigning role:', roleError)
      // Profile was created, but role assignment failed - still return success but log error
      console.warn('Instructor created but role assignment failed:', roleError.message)
    }

    // Send password reset email
    const { error: resetError } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${Deno.env.get('APP_URL') || 'https://icanswim209.com'}/reset-password`
      }
    })

    if (resetError) {
      console.error('Error sending password reset email:', resetError)
      // User was created successfully, just email failed
      console.warn('Instructor created but password reset email failed to send')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Instructor created successfully',
        user_id: userId,
        email_sent: !resetError
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})