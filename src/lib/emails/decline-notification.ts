import { wrapEmailWithHeader } from './email-wrapper';

export function generateDeclineEmail(params: {
  parentName: string;
  childName: string;
}): { subject: string; html: string } {
  const programName = 'I Can Swim';
  const subject = `Update regarding ${params.childName}’s enrollment in ${programName}`;
  const inner = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Dear ${params.parentName},</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
      Thank you for your interest in our swimming program and for taking the time to share ${params.childName}’s information with us.
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
      After a careful review of ${params.childName}’s profile and our current program capabilities, we have determined that our program is unfortunately unable to meet the specific needs of the swimmer at this time. Our goal is to ensure a safe and productive environment for all participants, and based on our current staffing and resource parameters, we do not feel we can provide the necessary level of support required.
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
      We understand this may be disappointing news. If you have any questions regarding this decision or would like to discuss this further, please reach out to your service coordinator to discuss the status.
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
      We wish ${params.childName} the very best in their swimming journey.
    </p>
    <p style="margin:0;font-size:16px;line-height:1.6;color:#334155;">
      Best regards,<br>The I Can Swim Team
    </p>
  `;
  return { subject, html: wrapEmailWithHeader(inner) };
}

export function generateCoordinatorDeclineNotification(params: {
  coordinatorName: string;
  parentName: string;
  childName: string;
}): { subject: string; html: string } {
  const subject = `Enrollment declined — ${params.childName}`;
  const inner = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Hi ${params.coordinatorName},</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
      This is a notification that <strong>${params.parentName}</strong>'s swimmer, <strong>${params.childName}</strong>, has been declined for enrollment in I Can Swim.
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
      The parent has been notified and directed to reach out to their service coordinator to discuss the status.
    </p>
    <p style="margin:0;font-size:16px;line-height:1.6;color:#334155;">— The I Can Swim Team</p>
  `;
  return { subject, html: wrapEmailWithHeader(inner) };
}
