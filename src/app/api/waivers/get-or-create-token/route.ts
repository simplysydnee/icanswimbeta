import { createClient } from '@/lib/supabase/server'
import { createWaiverUpdateToken } from '@/lib/db/waivers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', message: 'You must be signed in to access waiver forms.' },
        { status: 401 }
      )
    }

    // Get user's profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'PROFILE_NOT_FOUND', message: 'User profile not found.' },
        { status: 404 }
      )
    }

    // Create a waiver update token for the parent
    const tokenData = await createWaiverUpdateToken(
      user.id,
      profile.email || user.email!,
      72 // expires in 72 hours
    )

    if (!tokenData) {
      return NextResponse.json(
        { error: 'TOKEN_CREATION_FAILED', message: 'Failed to create waiver update token.' },
        { status: 500 }
      )
    }

    // Redirect to the waiver update page
    return NextResponse.redirect(
      new URL(`/update-waivers/${tokenData.token}`, request.url)
    )
  } catch (error) {
    console.error('Error in get-or-create-token:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}