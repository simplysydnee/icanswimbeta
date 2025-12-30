import { wrapEmailWithHeader, createButton, BRAND_MAIN } from './email-wrapper'

const APP_URL = 'https://icanswimbeta.vercel.app'

export interface ReferralRequestData {
  coordinatorName: string
  coordinatorEmail: string
  parentName: string
  parentEmail: string
  parentPhone: string
  childFirstName: string
  childLastName: string
  childDOB: string
  referralToken: string
}

export function generateReferralRequestEmail(data: ReferralRequestData): { subject: string; html: string } {
  const subject = `New Swim Lesson Referral Request - ${data.childFirstName} ${data.childLastName}`

  const referralUrl = `${APP_URL}/referral?token=${data.referralToken}`

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">New Referral Request</h2>

    <p>Hi ${data.coordinatorName},</p>

    <p><strong>${data.parentName}</strong> has requested a referral for adaptive swim lessons through I Can Swim.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #334155;">Child Information</h3>
      <p style="margin: 5px 0;"><strong>Name:</strong> ${data.childFirstName} ${data.childLastName}</p>
      <p style="margin: 5px 0;"><strong>Date of Birth:</strong> ${data.childDOB}</p>

      <h3 style="margin-top: 20px; color: #334155;">Parent/Guardian</h3>
      <p style="margin: 5px 0;"><strong>Name:</strong> ${data.parentName}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${data.parentEmail}</p>
      <p style="margin: 5px 0;"><strong>Phone:</strong> ${data.parentPhone}</p>
    </div>

    ${createButton('Complete Referral Form', referralUrl)}

    <p style="color: #64748b; font-size: 14px;">
      Or copy this link: <a href="${referralUrl}" style="color: ${BRAND_MAIN};">${referralUrl}</a>
    </p>
  `

  const html = wrapEmailWithHeader(content)

  return { subject, html }
}