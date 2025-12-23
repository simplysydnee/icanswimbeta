import { createClient } from '@/lib/supabase/client'

type EmailTemplate =
  | 'enrollment_invite'
  | 'approval_notification'
  | 'booking_confirmation'  // Keep for backwards compatibility
  | 'assessment_booking'    // NEW
  | 'recurring_lesson_booking'  // NEW
  | 'single_lesson_booking'  // NEW
  | 'session_cancellation'  // NEW
  | 'assessment_completion'  // NEW

interface SendEmailParams {
  to: string
  templateType: EmailTemplate
  parentName?: string
  childName?: string
  coordinatorName?: string
  customData?: Record<string, any>
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data: _data, error } = await supabase.functions.invoke('send-enrollment-email', {
      body: params,
    })

    if (error) {
      console.error('Email function error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Failed to send email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

// Convenience functions for specific email types
export const emailService = {
  async sendEnrollmentInvite(params: {
    parentEmail: string
    parentName: string
    childName: string
    coordinatorName: string
  }) {
    return sendEmail({
      to: params.parentEmail,
      templateType: 'enrollment_invite',
      parentName: params.parentName,
      childName: params.childName,
      coordinatorName: params.coordinatorName,
    })
  },

  async sendApprovalNotification(params: {
    parentEmail: string
    parentName: string
    childName: string
  }) {
    return sendEmail({
      to: params.parentEmail,
      templateType: 'approval_notification',
      parentName: params.parentName,
      childName: params.childName,
    })
  },

  async sendBookingConfirmation(params: {
    parentEmail: string
    parentName: string
    childName: string
    date: string
    time: string
    location: string
    instructor: string
  }) {
    return sendEmail({
      to: params.parentEmail,
      templateType: 'booking_confirmation',
      parentName: params.parentName,
      childName: params.childName,
      customData: {
        date: params.date,
        time: params.time,
        location: params.location,
        instructor: params.instructor,
      },
    })
  },

  async sendAssessmentBooking(params: {
    parentEmail: string
    parentName: string
    childName: string
    date: string
    time: string
    location: string
    instructor: string
  }) {
    return sendEmail({
      to: params.parentEmail,
      templateType: 'assessment_booking',
      parentName: params.parentName,
      childName: params.childName,
      customData: {
        date: params.date,
        time: params.time,
        location: params.location,
        instructor: params.instructor,
      },
    })
  },

  async sendRecurringLessonBooking(params: {
    parentEmail: string
    parentName: string
    childName: string
    instructor: string
    location: string
    sessions: Array<{ date: string; time: string }>
  }) {
    return sendEmail({
      to: params.parentEmail,
      templateType: 'recurring_lesson_booking',
      parentName: params.parentName,
      childName: params.childName,
      customData: {
        instructor: params.instructor,
        location: params.location,
        sessions: params.sessions,
      },
    })
  },

  async sendSingleLessonBooking(params: {
    parentEmail: string
    parentName: string
    childName: string
    date: string
    time: string
    location: string
    instructor: string
  }) {
    return sendEmail({
      to: params.parentEmail,
      templateType: 'single_lesson_booking',
      parentName: params.parentName,
      childName: params.childName,
      customData: {
        date: params.date,
        time: params.time,
        location: params.location,
        instructor: params.instructor,
      },
    })
  },

  async sendSessionCancellation(params: {
    parentEmail: string
    instructorName: string
    date: string
    reason: string
    swimmerNames: string[]
  }) {
    return sendEmail({
      to: params.parentEmail,
      templateType: 'session_cancellation',
      customData: {
        instructorName: params.instructorName,
        date: params.date,
        reason: params.reason,
        swimmerNames: params.swimmerNames,
        contactPhone: '(209) 643-7969'
      },
    })
  },

  async sendAssessmentCompletion(params: {
    parentEmail: string
    parentName: string
    childName: string
    subject: string
    html: string
  }) {
    return sendEmail({
      to: params.parentEmail,
      templateType: 'assessment_completion',
      parentName: params.parentName,
      childName: params.childName,
      customData: {
        subject: params.subject,
        html: params.html
      },
    })
  },
}