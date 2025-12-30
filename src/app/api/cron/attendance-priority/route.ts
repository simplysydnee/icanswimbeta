import { NextResponse } from 'next/server'
import { attendancePriorityService } from '@/lib/attendance-priority'

// This can be called by Vercel Cron or manually
export async function POST(request: Request) {
  // Verify cron secret if needed
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Clear expired priorities first
    const cleared = await attendancePriorityService.clearExpiredPriorities()

    // Grant new priorities
    const result = await attendancePriorityService.grantAttendancePriority()

    return NextResponse.json({
      success: true,
      cleared,
      granted: result.granted.length,
      skipped: result.skipped.length,
      errors: result.errors.length,
      details: result
    })

  } catch (error: any) {
    console.error('Attendance priority cron error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process attendance priority' },
      { status: 500 }
    )
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: 'Attendance Priority Cron Endpoint',
    usage: 'POST to run attendance priority check',
    note: 'Set CRON_SECRET environment variable for production use'
  })
}