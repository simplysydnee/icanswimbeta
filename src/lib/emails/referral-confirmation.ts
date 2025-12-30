export interface ReferralConfirmationData {
  parentName: string
  parentEmail: string
  childName: string
  coordinatorName: string
  coordinatorEmail: string
}

export function generateReferralConfirmationEmail(data: ReferralConfirmationData): { subject: string; html: string } {
  const subject = `Referral Request Submitted - ${data.childName}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a5e84;">Referral Request Submitted!</h2>

      <p>Hi ${data.parentName},</p>

      <p>Great news! Your referral request for <strong>${data.childName}</strong> has been submitted to your Regional Center coordinator.</p>

      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2a5e84;">
        <h3 style="margin-top: 0; color: #2a5e84;">What Happens Next?</h3>
        <ol style="margin-bottom: 0;">
          <li><strong>${data.coordinatorName}</strong> (${data.coordinatorEmail}) will receive your request</li>
          <li>They'll complete the referral form with ${data.childName}'s information</li>
          <li>Once complete, we'll email you to finish enrollment and book an assessment</li>
        </ol>
      </div>

      <p>This process typically takes a few days. You don't need to do anything right now—we'll reach out when it's your turn!</p>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Questions? Contact us anytime:
        <br>📧 info@icanswim209.com
        <br>📞 (209) 778-7877
        <br>📱 Text: 209-643-7969
      </p>

      <p>Thank you for choosing I Can Swim!</p>

      <p>Warm regards,<br><strong>Sutton Lucas</strong><br>Owner, I Can Swim</p>
    </div>
  `

  return { subject, html }
}