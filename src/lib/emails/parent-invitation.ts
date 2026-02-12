import { wrapEmailWithHeader, createButton, BRAND_MAIN, EMAIL_APP_URL } from './email-wrapper'

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

  const registrationUrl = `${EMAIL_APP_URL}/claim/${data.inviteToken}`

  const content = `<h2 style="color:${BRAND_MAIN};margin-top:0;font-size:28px;line-height:1.2;text-align:center;">Complete ${data.swimmerFirstName}'s Enrollment</h2>
<p style="margin:20px 0;font-size:18px;line-height:1.6;text-align:center;">${greeting}</p>
<p style="margin:20px 0;font-size:16px;line-height:1.6;">You're almost done! We just need you to complete the enrollment process for <strong>${data.swimmerFirstName}</strong> so they can start swim lessons with us.</p>
<div style="background:#f0f9ff;padding:20px;border-radius:12px;margin:25px 0;border-left:4px solid ${BRAND_MAIN};">
<h3 style="margin-top:0;color:${BRAND_MAIN};font-size:20px;line-height:1.4;">📍 What you need to do:</h3>
<ol style="padding-left:20px;margin:15px 0;">
<li style="padding:8px 0;font-size:16px;line-height:1.6;"><strong>Click the button below</strong> to create your parent account</li>
<li style="padding:8px 0;font-size:16px;line-height:1.6;"><strong>Complete the enrollment forms</strong> for ${data.swimmerFirstName}</li>
<li style="padding:8px 0;font-size:16px;line-height:1.6;"><strong>Review and submit</strong> - we'll notify you once approved</li>
</ol>
</div>
${createButton('Complete Enrollment Now', registrationUrl)}
<div style="background:#fef3c7;padding:16px;border-radius:8px;margin:25px 0;text-align:center;">
<p style="margin:0;font-size:15px;line-height:1.5;color:#92400e;"><strong>⏰ Reminder:</strong> This link expires in 7 days. Please complete enrollment soon to secure your spot.</p>
</div>
<p style="margin:25px 0;font-size:16px;line-height:1.6;text-align:center;">If you need help, reply to this email or contact us at <a href="mailto:info@icanswim209.com" style="color:${BRAND_MAIN};text-decoration:none;font-weight:bold;">info@icanswim209.com</a></p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:30px 0;">
<p style="margin:0 0 10px;font-size:14px;color:#64748b;"><strong>Swimmer details:</strong></p>
<p style="margin:5px 0;font-size:14px;color:#64748b;"><strong>Name:</strong> ${swimmerFullName}</p>
<p style="margin:5px 0 20px;font-size:14px;color:#64748b;"><strong>Email on file:</strong> ${data.parentEmail}</p>
<p style="margin:30px 0 0;font-size:16px;line-height:1.6;text-align:center;">We look forward to welcoming you to the I Can Swim family!</p>
<p style="margin:10px 0 0;font-size:16px;line-height:1.6;text-align:center;"><strong>The I Can Swim Team</strong></p>`

  const html = wrapEmailWithHeader(content)
  return { subject, html }
}