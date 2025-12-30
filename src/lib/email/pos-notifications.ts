// Email notifications for POS (Purchase Order System)
import { emailService } from '../email-service'
import { wrapEmailWithHeader, createButton, BRAND_MAIN } from '../emails/email-wrapper'

const APP_URL = 'https://icanswimbeta.vercel.app'

interface POSEmailData {
  swimmerName: string;
  swimmerDOB: string;
  parentName: string;
  parentEmail: string;
  coordinatorName?: string;
  coordinatorEmail?: string;
  fundingSource: string;
  poType: 'assessment' | 'lessons';
  sessionsAuthorized: number;
  startDate: string;
  endDate: string;
  authorizationNumber?: string;
}

export async function notifyCoordinatorNewPOS(data: POSEmailData) {
  if (!data.coordinatorEmail) {
    console.error('Cannot send POS notification: coordinator email missing')
    return
  }

  const subject = `New POS Request - ${data.swimmerName}`

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">New Purchase Order Request</h2>

    <p>Hi ${data.coordinatorName || 'Coordinator'},</p>

    <p>A new <strong>${data.poType === 'assessment' ? 'Assessment' : 'Lessons'} Authorization</strong>
    has been requested for:</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Swimmer:</strong> ${data.swimmerName}</p>
      <p style="margin: 5px 0;"><strong>Parent:</strong> ${data.parentName}</p>
      <p style="margin: 5px 0;"><strong>Type:</strong> ${data.poType === 'assessment' ? 'Initial Assessment (1 session)' : 'Swim Lessons (12 sessions)'}</p>
      <p style="margin: 5px 0;"><strong>Funding Source:</strong> ${data.fundingSource}</p>
      ${data.authorizationNumber ? `<p style="margin: 5px 0;"><strong>Authorization #:</strong> ${data.authorizationNumber}</p>` : ''}
    </div>

    ${createButton('Review POS Request', `${APP_URL}/coordinator/pos`)}

    <p>Thank you for your partnership,<br><strong>I Can Swim</strong></p>
  `

  const html = wrapEmailWithHeader(content)

  try {
    await emailService.sendEmail({
      to: data.coordinatorEmail,
      templateType: 'custom',
      customData: { subject, html }
    })
    console.log(`POS notification sent to coordinator: ${data.coordinatorEmail}`)
  } catch (error) {
    console.error('Failed to send POS notification:', error)
    // Don't throw - email failure shouldn't block the main flow
  }
}

export async function notifyParentPOSApproved(data: POSEmailData) {
  const subject = `POS Approved - ${data.swimmerName}'s Swim Lessons`

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Purchase Order Approved!</h2>

    <p>Hi ${data.parentName},</p>

    <p>Great news! The purchase order for <strong>${data.swimmerName}'s</strong> swim lessons has been approved!</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Swimmer:</strong> ${data.swimmerName}</p>
      <p style="margin: 5px 0;"><strong>Type:</strong> ${data.poType === 'assessment' ? 'Initial Assessment' : 'Swim Lessons'}</p>
      <p style="margin: 5px 0;"><strong>Sessions Authorized:</strong> ${data.sessionsAuthorized}</p>
      <p style="margin: 5px 0;"><strong>Authorization Period:</strong> ${data.startDate} to ${data.endDate}</p>
      <p style="margin: 5px 0;"><strong>Funding Source:</strong> ${data.fundingSource}</p>
      ${data.authorizationNumber ? `<p style="margin: 5px 0;"><strong>Authorization #:</strong> ${data.authorizationNumber}</p>` : ''}
    </div>

    <p>You can now book swim sessions for ${data.swimmerName} through your parent portal:</p>

    ${createButton('Book Your Lessons', `${APP_URL}/parent/book`)}

    <p>Thank you,<br><strong>I Can Swim</strong></p>
  `

  const html = wrapEmailWithHeader(content)

  try {
    await emailService.sendEmail({
      to: data.parentEmail,
      templateType: 'custom',
      customData: { subject, html }
    })
    console.log(`POS approval notification sent to parent: ${data.parentEmail}`)
  } catch (error) {
    console.error('Failed to send POS approval notification:', error)
    // Don't throw - email failure shouldn't block the main flow
  }
}

export async function notifyParentPOSDeclined(data: POSEmailData & { reason?: string }) {
  const subject = `POS Update - ${data.swimmerName}'s Swim Lessons`

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Purchase Order Update</h2>

    <p>Hi ${data.parentName},</p>

    <p>We wanted to inform you about an update regarding the purchase order for <strong>${data.swimmerName}'s</strong> swim lessons.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Swimmer:</strong> ${data.swimmerName}</p>
      <p style="margin: 5px 0;"><strong>Type:</strong> ${data.poType === 'assessment' ? 'Initial Assessment' : 'Swim Lessons'}</p>
      <p style="margin: 5px 0;"><strong>Funding Source:</strong> ${data.fundingSource}</p>
      ${data.reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
    </div>

    <p>If you have questions about this decision or would like to discuss alternative options, please contact your coordinator:</p>
    <p><strong>${data.coordinatorName || 'Coordinator'}</strong><br>
    ${data.coordinatorEmail ? `Email: ${data.coordinatorEmail}<br>` : ''}
    Phone: (209) 778-7877</p>

    ${createButton('Contact Us', 'mailto:info@icanswim209.com')}

    <p>Thank you,<br><strong>I Can Swim</strong></p>
  `

  const html = wrapEmailWithHeader(content)

  try {
    await emailService.sendEmail({
      to: data.parentEmail,
      templateType: 'custom',
      customData: { subject, html }
    })
    console.log(`POS decline notification sent to parent: ${data.parentEmail}`)
  } catch (error) {
    console.error('Failed to send POS decline notification:', error)
    // Don't throw - email failure shouldn't block the main flow
  }
}

export async function notifyCoordinatorPOSExpiring(data: POSEmailData & {
  daysUntilExpiry: number;
  sessionsUsed: number;
  sessionsRemaining: number;
}) {
  if (!data.coordinatorEmail) {
    console.error('Cannot send POS expiry notification: coordinator email missing')
    return
  }

  const subject = `POS Expiring Soon - ${data.swimmerName}'s Authorization`

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Authorization Expiring Soon</h2>

    <p>Hi ${data.coordinatorName || 'Coordinator'},</p>

    <p>The purchase order for <strong>${data.swimmerName}'s</strong> swim lessons will expire in <strong>${data.daysUntilExpiry} days</strong>.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Swimmer:</strong> ${data.swimmerName}</p>
      <p style="margin: 5px 0;"><strong>Parent:</strong> ${data.parentName}</p>
      <p style="margin: 5px 0;"><strong>Authorization Period:</strong> ${data.startDate} to ${data.endDate}</p>
      <p style="margin: 5px 0;"><strong>Sessions Used:</strong> ${data.sessionsUsed} of ${data.sessionsAuthorized}</p>
      <p style="margin: 5px 0;"><strong>Sessions Remaining:</strong> ${data.sessionsRemaining}</p>
      <p style="margin: 5px 0;"><strong>Funding Source:</strong> ${data.fundingSource}</p>
      ${data.authorizationNumber ? `<p style="margin: 5px 0;"><strong>Authorization #:</strong> ${data.authorizationNumber}</p>` : ''}
    </div>

    <p>Please contact the parent to discuss renewal options or submit a new authorization request:</p>
    <p><strong>Parent Contact:</strong><br>
    ${data.parentName}<br>
    Email: ${data.parentEmail}<br>
    Phone: (209) 778-7877</p>

    ${createButton('Review POS', `${APP_URL}/coordinator/pos`)}

    <p>Thank you,<br><strong>I Can Swim</strong></p>
  `

  const html = wrapEmailWithHeader(content)

  try {
    await emailService.sendEmail({
      to: data.coordinatorEmail,
      templateType: 'custom',
      customData: { subject, html }
    })
    console.log(`POS expiry notification sent to coordinator: ${data.coordinatorEmail}`)
  } catch (error) {
    console.error('Failed to send POS expiry notification:', error)
    // Don't throw - email failure shouldn't block the main flow
  }
}

export async function notifyInstructorProgressNeeded(data: {
  instructorEmail: string;
  instructorName: string;
  swimmerName: string;
  parentName: string;
  sessionsCompleted: number;
  sessionsRemaining: number;
  expiryDate: string;
  progressSummary?: string;
}) {
  const subject = `Progress Report Needed - ${data.swimmerName}`

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Progress Report Request</h2>

    <p>Hi ${data.instructorName},</p>

    <p>We need a progress report for <strong>${data.swimmerName}</strong> to support renewal of their swim lesson authorization.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Swimmer:</strong> ${data.swimmerName}</p>
      <p style="margin: 5px 0;"><strong>Parent:</strong> ${data.parentName}</p>
      <p style="margin: 5px 0;"><strong>Sessions Completed:</strong> ${data.sessionsCompleted}</p>
      <p style="margin: 5px 0;"><strong>Sessions Remaining:</strong> ${data.sessionsRemaining}</p>
      <p style="margin: 5px 0;"><strong>Authorization Expires:</strong> ${data.expiryDate}</p>
    </div>

    <p>Please submit a progress report through your instructor portal that includes:</p>
    <ul>
      <li>Current skill level and progress</li>
      <li>Goals achieved</li>
      <li>Recommendations for continued instruction</li>
      <li>Any behavioral or safety notes</li>
    </ul>

    ${createButton('Submit Progress Notes', `${APP_URL}/instructor/progress`)}

    <p>Thank you,<br><strong>I Can Swim</strong></p>
  `

  const html = wrapEmailWithHeader(content)

  try {
    await emailService.sendEmail({
      to: data.instructorEmail,
      templateType: 'custom',
      customData: { subject, html }
    })
    console.log(`Progress report request sent to instructor: ${data.instructorEmail}`)
  } catch (error) {
    console.error('Failed to send progress report request:', error)
    // Don't throw - email failure shouldn't block the main flow
  }
}