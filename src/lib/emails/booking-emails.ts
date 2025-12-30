import { wrapEmailWithHeader, createButton, BRAND_MAIN } from './email-wrapper'
import { emailUrls } from './url-helpers'
import { format } from 'date-fns'

// Types
export interface AssessmentBookingData {
  parentName: string
  parentEmail: string
  swimmerName: string
  instructorName: string
  sessionDate: string // ISO date
  sessionTime: string // e.g., "3:00 PM"
}

export interface LessonBookingData {
  parentName: string
  parentEmail: string
  swimmerName: string
  instructorName: string
  sessionDate: string
  sessionTime: string
}

export interface RecurringBookingData {
  parentName: string
  parentEmail: string
  swimmerName: string
  instructorName: string
  dayOfWeek: string
  time: string
  sessions: Array<{ date: string; time: string }>
  totalSessions: number
}

export interface BookingCancellationData {
  parentName: string
  parentEmail: string
  swimmerName: string
  sessionDate: string
  sessionTime: string
  cancelledBy: 'parent' | 'admin' | 'instructor'
  reason?: string
  isLateCancellation: boolean
}

// Assessment Booking Confirmation
export function generateAssessmentBookingEmail(data: AssessmentBookingData): { subject: string; html: string } {
  const formattedDate = format(new Date(data.sessionDate), 'EEEE, MMMM d, yyyy')
  const subject = `Assessment Confirmed - ${data.swimmerName} on ${format(new Date(data.sessionDate), 'MMM d')}`

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Assessment Confirmed!</h2>

    <p>Hi ${data.parentName},</p>

    <p>Thanks for booking ${data.swimmerName}'s Initial Assessment with I Can Swim! We're excited to meet you both and learn more about your child's comfort and confidence in the water.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; color: ${BRAND_MAIN};">Details</h3>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="margin: 5px 0;"><strong>Time:</strong> ${data.sessionTime}</p>
      <p style="margin: 5px 0;"><strong>Location:</strong> 1212 Kansas Ave, Modesto, CA 95351</p>
    </div>

    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${BRAND_MAIN};">
      <h3 style="margin-top: 0; color: ${BRAND_MAIN};">What to Bring</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li style="padding: 5px 0;">A towel and swimsuit</li>
        <li style="padding: 5px 0;">A swim diaper if your swimmer is not toilet trained</li>
        <li style="padding: 5px 0;">A positive attitude!</li>
      </ul>
    </div>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>Please avoid food 30 minutes before the assessment.</strong><br>
      We recommend water only to keep your swimmer hydrated.
    </div>

    <h3 style="color: ${BRAND_MAIN};">What to Expect During the Assessment</h3>

    <p><strong>${data.instructorName}</strong> will gently guide ${data.swimmerName} through a series of water comfort and movement checks.</p>

    <p>We'll assess communication preferences, learning style, safety awareness, and basic swim readiness to help create tailored swim lessons moving forward, based on ${data.swimmerName}'s needs.</p>

    <h3 style="color: ${BRAND_MAIN};">After the Assessment</h3>
    <ul style="padding-left: 20px;">
      <li style="padding: 5px 0;">We'll update ${data.swimmerName}'s profile in the app to include <strong>assessment results</strong></li>
      <li style="padding: 5px 0;">Notify you when <strong>it's time to book recurring lessons</strong></li>
    </ul>

    <p>If you have any questions or need to reschedule, just reply to this email—we're happy to help!</p>

    ${createButton('View My Schedule', emailUrls.parentSchedule(data.parentEmail))}

    <p style="margin-top: 30px;">See you at the pool!</p>

    <p>Warm regards,<br><strong>Sutton Lucas</strong><br>I Can Swim</p>
  `

  const html = wrapEmailWithHeader(content)
  return { subject, html }
}

// Single Lesson Booking Confirmation
export function generateLessonBookingEmail(data: LessonBookingData): { subject: string; html: string } {
  const formattedDate = format(new Date(data.sessionDate), 'EEEE, MMMM d, yyyy')
  const subject = `Lesson Confirmed - ${data.swimmerName} on ${format(new Date(data.sessionDate), 'MMM d')}`

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Lesson Confirmed!</h2>

    <p>Hi ${data.parentName},</p>

    <p>${data.swimmerName}'s swim lesson has been booked! We're looking forward to seeing you.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; color: ${BRAND_MAIN};">Lesson Details</h3>
      <p style="margin: 5px 0;"><strong>Swimmer:</strong> ${data.swimmerName}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="margin: 5px 0;"><strong>Time:</strong> ${data.sessionTime}</p>
      <p style="margin: 5px 0;"><strong>Instructor:</strong> ${data.instructorName}</p>
      <p style="margin: 5px 0;"><strong>Location:</strong> 1212 Kansas Ave, Modesto, CA 95351</p>
    </div>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>Reminder:</strong> Please arrive 5 minutes early. Cancellations within 24 hours may affect your enrollment status.
    </div>

    <p>If you have any questions or need to reschedule, just reply to this email!</p>

    ${createButton('View My Schedule', emailUrls.parentSchedule(data.parentEmail))}

    <p style="margin-top: 30px;">See you at the pool!</p>

    <p>Warm regards,<br><strong>Sutton Lucas</strong><br>I Can Swim</p>
  `

  const html = wrapEmailWithHeader(content)
  return { subject, html }
}

// Recurring Lessons Booking Confirmation
export function generateRecurringBookingEmail(data: RecurringBookingData): { subject: string; html: string } {
  const subject = `${data.totalSessions} Lessons Confirmed - ${data.swimmerName} (${data.dayOfWeek}s at ${data.time})`

  const sessionsList = data.sessions.map(s => {
    const formattedDate = format(new Date(s.date), 'EEEE, MMMM d, yyyy')
    return `<li style="padding: 5px 0;">${formattedDate} at ${s.time}</li>`
  }).join('')

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Recurring Lessons Confirmed!</h2>

    <p>Hi ${data.parentName},</p>

    <p>Great news! You've successfully booked <strong>${data.totalSessions} lessons</strong> for ${data.swimmerName}. We're excited to continue the swim journey together!</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; color: ${BRAND_MAIN};">Booking Summary</h3>
      <p style="margin: 5px 0;"><strong>Swimmer:</strong> ${data.swimmerName}</p>
      <p style="margin: 5px 0;"><strong>Schedule:</strong> ${data.dayOfWeek}s at ${data.time}</p>
      <p style="margin: 5px 0;"><strong>Instructor:</strong> ${data.instructorName}</p>
      <p style="margin: 5px 0;"><strong>Location:</strong> 1212 Kansas Ave, Modesto, CA 95351</p>
      <p style="margin: 5px 0;"><strong>Total Sessions:</strong> ${data.totalSessions}</p>
    </div>

    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${BRAND_MAIN};">
      <h3 style="margin-top: 0; color: ${BRAND_MAIN};">Your Scheduled Dates</h3>
      <ol style="margin: 0; padding-left: 20px;">
        ${sessionsList}
      </ol>
    </div>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>Reminder:</strong> Cancellations within 24 hours may affect your enrollment status. Please give us advance notice if you need to reschedule.
    </div>

    <p>If you have any questions, just reply to this email—we're happy to help!</p>

    ${createButton('View My Schedule', emailUrls.parentSchedule(data.parentEmail))}

    <p style="margin-top: 30px;">See you at the pool!</p>

    <p>Warm regards,<br><strong>Sutton Lucas</strong><br>I Can Swim</p>
  `

  const html = wrapEmailWithHeader(content)
  return { subject, html }
}

// Booking Cancellation
export function generateCancellationEmail(data: BookingCancellationData): { subject: string; html: string } {
  const formattedDate = format(new Date(data.sessionDate), 'EEEE, MMMM d, yyyy')
  const subject = `Lesson Cancelled - ${data.swimmerName} on ${format(new Date(data.sessionDate), 'MMM d')}`

  const cancelledByText = data.cancelledBy === 'parent'
    ? 'at your request'
    : data.cancelledBy === 'admin'
      ? 'by I Can Swim administration'
      : 'by your instructor'

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Lesson Cancelled</h2>

    <p>Hi ${data.parentName},</p>

    <p>This confirms that ${data.swimmerName}'s lesson has been cancelled ${cancelledByText}.</p>

    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
      <h3 style="margin-top: 0; color: #991b1b;">Cancelled Session</h3>
      <p style="margin: 5px 0;"><strong>Swimmer:</strong> ${data.swimmerName}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="margin: 5px 0;"><strong>Time:</strong> ${data.sessionTime}</p>
      ${data.reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
    </div>

    ${data.isLateCancellation ? `
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>Note:</strong> This was a late cancellation (within 24 hours). Please review our cancellation policy for future bookings.
    </div>
    ` : ''}

    <p>Need to book a new session? Click below to schedule.</p>

    ${createButton('Book New Session', emailUrls.parentBook(data.parentEmail))}

    <p style="margin-top: 30px;">Questions? Just reply to this email.</p>

    <p>Warm regards,<br><strong>Sutton Lucas</strong><br>I Can Swim</p>
  `

  const html = wrapEmailWithHeader(content)
  return { subject, html }
}