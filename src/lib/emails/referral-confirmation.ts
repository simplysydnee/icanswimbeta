import { wrapEmailWithHeader, BRAND_MAIN, BRAND_ACCENT } from './email-wrapper'

export interface ReferralConfirmationData {
  parentName: string
  parentEmail: string
  childName: string
  coordinatorName: string
  coordinatorEmail: string
}

export function generateReferralConfirmationEmail(data: ReferralConfirmationData): { subject: string; html: string } {
  const subject = `Referral Request Submitted - ${data.childName}`

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Referral Request Submitted!</h2>

    <p>Hi ${data.parentName},</p>

    <p>Great news! Your referral request for <strong>${data.childName}</strong> has been submitted to your Regional Center coordinator.</p>

    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${BRAND_MAIN};">
      <h3 style="margin-top: 0; color: ${BRAND_MAIN};">What Happens Next?</h3>
      <ol style="margin-bottom: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;"><strong>${data.coordinatorName}</strong> will receive your request</li>
        <li style="margin-bottom: 8px;">They'll complete the referral form with ${data.childName}'s information</li>
        <li style="margin-bottom: 0;">Once complete, we'll email you to finish enrollment and book an assessment</li>
      </ol>
    </div>

    <p>This process typically takes a few days. You don't need to do anything right now—we'll reach out when it's your turn!</p>

    <p style="margin-top: 30px;">Thank you for choosing I Can Swim!</p>

    <p>Warm regards,<br><strong>Sutton Lucas</strong><br>Owner, I Can Swim</p>
  `

  const html = wrapEmailWithHeader(content)

  return { subject, html }
}