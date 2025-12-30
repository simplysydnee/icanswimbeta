export function generateReferralRequestEmail(data: {
  coordinatorName: string
  parentName: string
  parentEmail: string
  parentPhone?: string
  childName: string
  childDOB: string
  referralToken: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a5e84;">New Referral Request</h2>

      <p>Hi ${data.coordinatorName},</p>

      <p><strong>${data.parentName}</strong> has requested a referral for adaptive swim lessons
      through I Can Swim.</p>

      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Child Information</h3>
        <p><strong>Name:</strong> ${data.childName}</p>
        <p><strong>Date of Birth:</strong> ${data.childDOB}</p>

        <h3>Parent/Guardian</h3>
        <p><strong>Name:</strong> ${data.parentName}</p>
        <p><strong>Email:</strong> ${data.parentEmail}</p>
        ${data.parentPhone ? `<p><strong>Phone:</strong> ${data.parentPhone}</p>` : ''}
      </div>

      <p>To complete this referral, please click the link below to fill out the required information:</p>

      <p><a href="https://icanswim209.com/referral?token=${data.referralToken}"
            style="background: #2a5e84; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Complete Referral Form
      </a></p>

      <p style="color: #666; font-size: 14px;">
        This link will allow you to enter the child's medical profile, behavioral information,
        and other details needed for swim instruction.
      </p>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Questions? Contact us at info@icanswim209.com or (209) 778-7877
      </p>

      <p>Thank you for your partnership,<br><strong>Sutton Lucas</strong><br>Owner, I Can Swim</p>
    </div>
  `
}