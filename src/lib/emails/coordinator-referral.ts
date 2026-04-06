import { wrapEmailWithHeader } from './email-wrapper';
import { APP_CONFIG } from '@/lib/constants';

export function generateCoordinatorReferralNewParentEmail(params: {
  parentName: string;
  childName: string;
  email: string;
  temporaryPassword: string;
}): { subject: string; html: string } {
  const loginUrl = `${APP_CONFIG.url}/login`;
  const subject = `Your I Can Swim account — ${params.childName}`;
  const inner = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Hi ${params.parentName},</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
      A coordinator has added <strong>${params.childName}</strong> to I Can Swim on your behalf.
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
      We created an account for you. Sign in with:
    </p>
    <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:0 0 16px;font-size:15px;color:#0f172a;">
      <p style="margin:0 0 8px;"><strong>Email:</strong> ${params.email}</p>
      <p style="margin:0;"><strong>Temporary password:</strong> ${params.temporaryPassword}</p>
    </div>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#334155;">
      Please sign in and change your password after your first login.
    </p>
    <p style="margin:0 0 24px;">
      <a href="${loginUrl}" style="display:inline-block;background:#2a5e84;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Sign in</a>
    </p>
    <p style="margin:0;font-size:14px;color:#64748b;">Questions? info@icanswim209.com · (209) 778-7877</p>
  `;
  return { subject, html: wrapEmailWithHeader(inner) };
}

export function generateCoordinatorReferralExistingParentEmail(params: {
  parentName: string;
  childName: string;
}): { subject: string; html: string } {
  const subject = `New swimmer added — ${params.childName}`;
  const inner = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Hi ${params.parentName},</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
      A coordinator has added <strong>${params.childName}</strong> to your I Can Swim account.
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
      Log in to your parent portal to view details and complete any next steps.
    </p>
    <p style="margin:0;">
      <a href="${APP_CONFIG.url}/parent" style="display:inline-block;background:#2a5e84;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Go to parent dashboard</a>
    </p>
  `;
  return { subject, html: wrapEmailWithHeader(inner) };
}
