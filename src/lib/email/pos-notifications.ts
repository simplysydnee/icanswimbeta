// Email notifications - stubbed until Resend is configured
// TODO: Install resend package and add RESEND_API_KEY to environment variables

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
  console.log('📧 [STUB] Would notify coordinator of new POS:', {
    to: data.coordinatorEmail,
    swimmer: data.swimmerName,
    type: data.poType
  });
}

export async function notifyParentPOSApproved(data: POSEmailData) {
  console.log('📧 [STUB] Would notify parent of POS approval:', {
    to: data.parentEmail,
    swimmer: data.swimmerName
  });
}

export async function notifyParentPOSDeclined(data: POSEmailData & { reason?: string }) {
  console.log('📧 [STUB] Would notify parent of POS decline:', {
    to: data.parentEmail,
    swimmer: data.swimmerName,
    reason: data.reason
  });
}

export async function notifyCoordinatorRenewalNeeded(data: POSEmailData & {
  sessionsUsed: number;
  progressSummary?: string;
}) {
  console.log('📧 [STUB] Would notify coordinator of renewal needed:', {
    to: data.coordinatorEmail,
    swimmer: data.swimmerName,
    sessionsUsed: data.sessionsUsed
  });
}