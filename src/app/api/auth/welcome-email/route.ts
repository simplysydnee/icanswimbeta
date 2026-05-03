import { NextResponse } from 'next/server'
import { emailService } from '@/lib/email-service'

export async function POST(request: Request) {
  try {
    const { parentEmail, parentName } = await request.json()

    if (!parentEmail) {
      return NextResponse.json({ error: 'parentEmail is required' }, { status: 400 })
    }

    await emailService.sendAccountCreated({
      parentEmail,
      parentName: parentName || 'there'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Welcome email error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
