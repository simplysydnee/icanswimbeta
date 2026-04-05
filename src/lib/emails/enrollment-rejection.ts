import { wrapEmailWithHeader } from './email-wrapper';

export function generateEnrollmentRejectionEmail(params: {
  parentName: string;
  childName: string;
  coordinatorName?: string;
}): { subject: string; html: string } {
  const subject = `Enrollment update — ${params.childName}`;
  const inner = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Hi ${params.parentName || 'Parent'},</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
      Thank you for your interest in I Can Swim. After review, we are unable to move forward with enrollment for
      <strong>${params.childName}</strong> at this time.
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
      If you have questions, please contact us at
      <a href="mailto:info@icanswim209.com" style="color:#2a5e84;">info@icanswim209.com</a>
      or (209) 778-7877.
    </p>
    ${params.coordinatorName ? `<p style="margin:0;font-size:14px;color:#64748b;">— ${params.coordinatorName}</p>` : ''}
  `;
  return { subject, html: wrapEmailWithHeader(inner) };
}
