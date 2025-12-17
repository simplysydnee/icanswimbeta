import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'I Can Swim <notifications@icanswim209.com>';
const ADMIN_EMAIL = 'sutton@icanswim209.com';

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

/**
 * Notify coordinator when new POS needs approval
 */
export async function notifyCoordinatorNewPOS(data: POSEmailData) {
  if (!data.coordinatorEmail) {
    console.log('No coordinator email - skipping notification');
    return;
  }

  const subject = `🏊 New POS Request: ${data.swimmerName} - ${data.poType === 'assessment' ? 'Assessment' : 'Lessons'}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0891b2; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">I Can Swim</h1>
        <p style="margin: 5px 0 0;">New Purchase Order Request</p>
      </div>

      <div style="padding: 20px; background: #f8fafc;">
        <h2 style="color: #0891b2; margin-top: 0;">New Authorization Needed</h2>

        <p>A new purchase order has been created and needs your approval:</p>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Swimmer:</td>
              <td style="padding: 8px 0; font-weight: bold;">${data.swimmerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">DOB:</td>
              <td style="padding: 8px 0;">${data.swimmerDOB}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Parent:</td>
              <td style="padding: 8px 0;">${data.parentName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Funding Source:</td>
              <td style="padding: 8px 0;">${data.fundingSource}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">PO Type:</td>
              <td style="padding: 8px 0;">
                <span style="background: ${data.poType === 'assessment' ? '#dbeafe' : '#dcfce7'}; color: ${data.poType === 'assessment' ? '#1e40af' : '#166534'}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                  ${data.poType === 'assessment' ? 'ASSESSMENT' : 'LESSONS'}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Sessions:</td>
              <td style="padding: 8px 0;">${data.sessionsAuthorized}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Date Range:</td>
              <td style="padding: 8px 0;">${data.startDate} - ${data.endDate}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/coordinator/pos"
             style="background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review & Approve
          </a>
        </div>

        <p style="color: #64748b; font-size: 14px;">
          Please log in to approve this request and provide the authorization number.
        </p>
      </div>

      <div style="padding: 16px; background: #f1f5f9; text-align: center; color: #64748b; font-size: 12px;">
        I Can Swim, LLC | 209-985-1538 | sutton@icanswim209.com
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.coordinatorEmail,
      subject,
      html
    });
    console.log(`POS notification sent to coordinator: ${data.coordinatorEmail}`);
  } catch (error) {
    console.error('Failed to send coordinator notification:', error);
  }
}

/**
 * Notify parent when POS is approved
 */
export async function notifyParentPOSApproved(data: POSEmailData) {
  const subject = `✅ Authorization Approved: ${data.swimmerName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0891b2; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">I Can Swim</h1>
        <p style="margin: 5px 0 0;">Authorization Approved!</p>
      </div>

      <div style="padding: 20px; background: #f8fafc;">
        <h2 style="color: #16a34a; margin-top: 0;">🎉 Great News!</h2>

        <p>Hi ${data.parentName},</p>

        <p>The ${data.fundingSource} authorization for <strong>${data.swimmerName}</strong> has been approved!</p>

        <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #166534;">Type:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #166534;">
                ${data.poType === 'assessment' ? 'Assessment' : 'Swim Lessons'}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #166534;">Sessions Authorized:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #166534;">${data.sessionsAuthorized}</td>
            </tr>
            ${data.authorizationNumber ? `
            <tr>
              <td style="padding: 8px 0; color: #166534;">Auth Number:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #166534;">${data.authorizationNumber}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #166534;">Valid:</td>
              <td style="padding: 8px 0; color: #166534;">${data.startDate} - ${data.endDate}</td>
            </tr>
          </table>
        </div>

        <p>You can now book ${data.poType === 'assessment' ? 'your assessment' : 'swim lessons'} for ${data.swimmerName}.</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/parent/book"
             style="background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Book Now
          </a>
        </div>
      </div>

      <div style="padding: 16px; background: #f1f5f9; text-align: center; color: #64748b; font-size: 12px;">
        I Can Swim, LLC | 209-985-1538 | sutton@icanswim209.com
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.parentEmail,
      subject,
      html
    });
    console.log(`POS approval notification sent to parent: ${data.parentEmail}`);
  } catch (error) {
    console.error('Failed to send parent notification:', error);
  }
}

/**
 * Notify parent when POS is declined
 */
export async function notifyParentPOSDeclined(data: POSEmailData & { reason?: string }) {
  const subject = `⚠️ Authorization Update: ${data.swimmerName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">I Can Swim</h1>
        <p style="margin: 5px 0 0;">Authorization Update</p>
      </div>

      <div style="padding: 20px; background: #f8fafc;">
        <h2 style="color: #dc2626; margin-top: 0;">Authorization Not Approved</h2>

        <p>Hi ${data.parentName},</p>

        <p>Unfortunately, the ${data.fundingSource} authorization request for <strong>${data.swimmerName}</strong> was not approved.</p>

        ${data.reason ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${data.reason}</p>
        </div>
        ` : ''}

        <p>Any sessions that were booked under this authorization have been cancelled.</p>

        <p>Please contact your coordinator for more information or to discuss alternatives:</p>

        ${data.coordinatorName ? `<p><strong>${data.coordinatorName}</strong><br>${data.coordinatorEmail}</p>` : ''}

        <p>You can also contact us directly if you have questions.</p>
      </div>

      <div style="padding: 16px; background: #f1f5f9; text-align: center; color: #64748b; font-size: 12px;">
        I Can Swim, LLC | 209-985-1538 | sutton@icanswim209.com
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.parentEmail,
      subject,
      html
    });
    console.log(`POS declined notification sent to parent: ${data.parentEmail}`);
  } catch (error) {
    console.error('Failed to send parent notification:', error);
  }
}

/**
 * Notify coordinator of renewal needed (at lesson 11)
 */
export async function notifyCoordinatorRenewalNeeded(data: POSEmailData & {
  sessionsUsed: number;
  progressSummary?: string;
}) {
  if (!data.coordinatorEmail) return;

  const subject = `🔄 Renewal Needed: ${data.swimmerName} - Lesson ${data.sessionsUsed}/12`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">I Can Swim</h1>
        <p style="margin: 5px 0 0;">POS Renewal Request</p>
      </div>

      <div style="padding: 20px; background: #f8fafc;">
        <h2 style="color: #f97316; margin-top: 0;">Renewal Authorization Needed</h2>

        <p>${data.swimmerName} has completed ${data.sessionsUsed} of 12 authorized sessions and needs a renewal POS to continue lessons.</p>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Swimmer:</td>
              <td style="padding: 8px 0; font-weight: bold;">${data.swimmerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">DOB:</td>
              <td style="padding: 8px 0;">${data.swimmerDOB}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Sessions Used:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #f97316;">${data.sessionsUsed} of 12</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Current POS Ends:</td>
              <td style="padding: 8px 0;">${data.endDate}</td>
            </tr>
          </table>
        </div>

        ${data.progressSummary ? `
        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="margin-top: 0; color: #166534;">Progress Summary</h3>
          <p style="color: #166534; margin-bottom: 0;">${data.progressSummary}</p>
        </div>
        ` : ''}

        <p>A new POS request has been automatically created and is awaiting your approval.</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/coordinator/pos"
             style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Renewal Request
          </a>
        </div>
      </div>

      <div style="padding: 16px; background: #f1f5f9; text-align: center; color: #64748b; font-size: 12px;">
        I Can Swim, LLC | 209-985-1538 | sutton@icanswim209.com
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.coordinatorEmail,
      subject,
      html
    });
    console.log(`Renewal notification sent to coordinator: ${data.coordinatorEmail}`);
  } catch (error) {
    console.error('Failed to send renewal notification:', error);
  }
}