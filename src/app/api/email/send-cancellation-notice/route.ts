import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!roleData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { parentEmails, instructorName, date, reason, swimmerNames } = await request.json()

    if (!parentEmails || !Array.isArray(parentEmails) || parentEmails.length === 0) {
      return NextResponse.json({ error: 'No parent emails provided' }, { status: 400 })
    }

    if (!instructorName || !date || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Send emails to each parent
    const results = []
    for (const parentEmail of parentEmails) {
      try {
        const { error } = await supabase.functions.invoke('send-enrollment-email', {
          body: {
            to: parentEmail,
            templateType: 'session_cancellation',
            customData: {
              instructorName,
              date,
              reason,
              swimmerNames: swimmerNames || [],
              contactPhone: '(209) 643-7969'
            }
          }
        })

        if (error) {
          console.error(`Failed to send email to ${parentEmail}:`, error)
          results.push({ email: parentEmail, success: false, error: error.message })
        } else {
          results.push({ email: parentEmail, success: true })
        }
      } catch (err) {
        console.error(`Error sending email to ${parentEmail}:`, err)
        results.push({ email: parentEmail, success: false, error: 'Internal error' })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      summary: {
        total: parentEmails.length,
        successful,
        failed
      },
      details: results
    })

  } catch (error) {
    console.error('Cancellation notice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}