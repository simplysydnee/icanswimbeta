import { wrapEmailWithHeader, createButton, BRAND_MAIN, APP_URL } from './email-wrapper'

// Types
export interface ParentInvitationData {
  parentName?: string | null
  parentEmail: string
  swimmerFirstName: string
  swimmerLastName: string
  inviteToken: string
}

// Parent Invitation Email
export function generateParentInvitationEmail(data: ParentInvitationData): { subject: string; html: string } {
  const swimmerFullName = `${data.swimmerFirstName} ${data.swimmerLastName}`
  const greeting = data.parentName ? `Hi ${data.parentName},` : 'Hello,'
  const subject = `Complete enrollment for ${data.swimmerFirstName} - I Can Swim`

  const registrationUrl = `${APP_URL}/register?token=${data.inviteToken}`

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Complete ${data.swimmerFirstName}'s Enrollment</h2>

    <p>${greeting}</p>

    <p>You've been invited to create your I Can Swim parent account to manage enrollment for <strong>${swimmerFullName}</strong>.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; color: ${BRAND_MAIN};">Swimmer Details</h3>
      <p style="margin: 5px 0;"><strong>Name:</strong> ${swimmerFullName}</p>
      <p style="margin: 5px 0;"><strong>Email on file:</strong> ${data.parentEmail}</p>
    </div>

    <p>To get started, please create your parent account using the link below. Once your account is set up, you'll be able to:</p>

    <ul style="padding-left: 20px;">
      <li style="padding: 5px 0;">View ${data.swimmerFirstName}'s swim schedule</li>
      <li style="padding: 5px 0;">Book and manage lessons</li>
      <li style="padding: 5px 0;">Receive important updates and notifications</li>
      <li style="padding: 5px 0;">Track progress and achievements</li>
    </ul>

    ${createButton('Complete Registration', registrationUrl)}

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>Note:</strong> This invitation link expires in 7 days. Please complete your registration before it expires.
    </div>

    <p>If you have any questions or didn't request this invitation, please contact us at <a href="mailto:info@icanswim209.com" style="color: ${BRAND_MAIN};">info@icanswim209.com</a>.</p>

    <p style="margin-top: 30px;">We look forward to welcoming you to the I Can Swim family!</p>

    <p>Warm regards,<br><strong>The I Can Swim Team</strong></p>
  `

  const html = wrapEmailWithHeader(content)
  return { subject, html }
}