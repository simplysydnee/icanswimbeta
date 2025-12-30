import { createClient } from '@/lib/supabase/client'
import { generateReferralRequestEmail, generateReferralConfirmationEmail, generateAssessmentBookingEmail, generateLessonBookingEmail, generateRecurringBookingEmail, generateCancellationEmail } from '@/lib/emails'

type EmailTemplate =
  | 'enrollment_invite'
  | 'approval_notification'
  | 'booking_confirmation'  // Keep for backwards compatibility
  | 'assessment_booking'    // NEW
  | 'recurring_lesson_booking'  // NEW
  | 'single_lesson_booking'  // NEW
  | 'session_cancellation'  // NEW
  | 'assessment_completion'  // NEW
  | 'welcome_enrollment'  // NEW
  | 'account_created'  // NEW - for users with no swimmers enrolled yet
  | 'instructor_change'  // NEW - for instructor replacement notifications
  | 'referral_request'  // NEW - for coordinator referral notifications
  | 'custom'  // For custom HTML emails

interface EmailCustomData {
  subject?: string
  html?: string
  date?: string
  time?: string
  location?: string
  instructor?: string
  sessions?: Array<{ date: string; time: string }>
  instructorName?: string
  reason?: string
  swimmerNames?: string[]
  contactPhone?: string
  isPrivatePay?: boolean
  fundingSourceName?: string
  previousInstructor?: string
  newInstructor?: string
  [key: string]: unknown // For additional properties while maintaining type safety
}

interface SendEmailParams {
  to: string
  templateType: EmailTemplate
  parentName?: string
  childName?: string
  coordinatorName?: string
  toName?: string
  customData?: EmailCustomData
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
  // Generic email sending method
  async sendEmail(params: SendEmailParams) {
    return sendEmail(params)
  },

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

  async sendWelcomeEnrollment(params: {
    parentEmail: string
    parentName: string
    childName: string
    isPrivatePay: boolean
    fundingSourceName?: string
  }) {
    return sendEmail({
      to: params.parentEmail,
      templateType: 'welcome_enrollment',
      parentName: params.parentName,
      childName: params.childName,
      customData: {
        isPrivatePay: params.isPrivatePay,
        fundingSourceName: params.fundingSourceName
      },
    })
  },

  async sendAccountCreated(params: {
    parentEmail: string
    parentName: string
  }) {
    return sendEmail({
      to: params.parentEmail,
      templateType: 'account_created',
      parentName: params.parentName,
    })
  },

  async sendInstructorChange(params: {
    parentEmail: string
    parentName: string
    childName: string
    date: string
    time: string
    location: string
    previousInstructor: string
    newInstructor: string
  }) {
    return sendEmail({
      to: params.parentEmail,
      templateType: 'instructor_change',
      parentName: params.parentName,
      childName: params.childName,
      customData: {
        date: params.date,
        time: params.time,
        location: params.location,
        previousInstructor: params.previousInstructor,
        newInstructor: params.newInstructor,
      },
    })
  },

  async sendReferralRequest(params: {
    coordinatorEmail: string
    coordinatorName: string
    parentName: string
    parentEmail: string
    parentPhone?: string
    childName: string
    childDOB: string
    referralToken: string
  }) {
    const html = generateReferralRequestEmail({
      coordinatorName: params.coordinatorName,
      parentName: params.parentName,
      parentEmail: params.parentEmail,
      parentPhone: params.parentPhone,
      childName: params.childName,
      childDOB: params.childDOB,
      referralToken: params.referralToken,
    })

    return sendEmail({
      to: params.coordinatorEmail,
      templateType: 'referral_request',
      customData: {
        subject: `New Swim Lesson Referral Request - ${params.childName}`,
        html,
      },
    })
  },

  async sendPOSNotification(params: {
    to: string
    toName?: string
    subject: string
    html: string
  }) {
    return sendEmail({
      to: params.to,
      templateType: 'custom',
      toName: params.toName,
      customData: {
        subject: params.subject,
        html: params.html,
      },
    })
  },

  async sendReferralConfirmation(params: {
    parentName: string
    parentEmail: string
    childName: string
    coordinatorName: string
    coordinatorEmail: string
  }) {
    const { subject, html } = generateReferralConfirmationEmail(params)

    return sendEmail({
      to: params.parentEmail,
      templateType: 'custom',
      toName: params.parentName,
      customData: { subject, html }
    })
  },

  async sendAssessmentConfirmation(params: {
    parentName: string
    parentEmail: string
    swimmerName: string
    instructorName: string
    sessionDate: string
    sessionTime: string
  }) {
    const { subject, html } = generateAssessmentBookingEmail({
      parentName: params.parentName,
      parentEmail: params.parentEmail,
      swimmerName: params.swimmerName,
      instructorName: params.instructorName,
      sessionDate: params.sessionDate,
      sessionTime: params.sessionTime,
    })

    return sendEmail({
      to: params.parentEmail,
      templateType: 'custom',
      toName: params.parentName,
      customData: { subject, html }
    })
  },

  async sendLessonConfirmation(params: {
    parentName: string
    parentEmail: string
    swimmerName: string
    instructorName: string
    sessionDate: string
    sessionTime: string
  }) {
    const { subject, html } = generateLessonBookingEmail({
      parentName: params.parentName,
      parentEmail: params.parentEmail,
      swimmerName: params.swimmerName,
      instructorName: params.instructorName,
      sessionDate: params.sessionDate,
      sessionTime: params.sessionTime,
    })

    return sendEmail({
      to: params.parentEmail,
      templateType: 'custom',
      toName: params.parentName,
      customData: { subject, html }
    })
  },

  async sendRecurringConfirmation(params: {
    parentName: string
    parentEmail: string
    swimmerName: string
    instructorName: string
    dayOfWeek: string
    time: string
    sessions: Array<{ date: string; time: string }>
    totalSessions: number
  }) {
    const { subject, html } = generateRecurringBookingEmail({
      parentName: params.parentName,
      parentEmail: params.parentEmail,
      swimmerName: params.swimmerName,
      instructorName: params.instructorName,
      dayOfWeek: params.dayOfWeek,
      time: params.time,
      sessions: params.sessions,
      totalSessions: params.totalSessions,
    })

    return sendEmail({
      to: params.parentEmail,
      templateType: 'custom',
      toName: params.parentName,
      customData: { subject, html }
    })
  },

  async sendCancellationNotice(params: {
    parentName: string
    parentEmail: string
    swimmerName: string
    sessionDate: string
    sessionTime: string
    cancelledBy: 'parent' | 'admin' | 'instructor'
    reason?: string
    isLateCancellation: boolean
  }) {
    const { subject, html } = generateCancellationEmail({
      parentName: params.parentName,
      parentEmail: params.parentEmail,
      swimmerName: params.swimmerName,
      sessionDate: params.sessionDate,
      sessionTime: params.sessionTime,
      cancelledBy: params.cancelledBy,
      reason: params.reason,
      isLateCancellation: params.isLateCancellation,
    })

    return sendEmail({
      to: params.parentEmail,
      templateType: 'custom',
      toName: params.parentName,
      customData: { subject, html }
    })
  },
}