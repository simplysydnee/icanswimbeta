export function generateApproveToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
}

export function getApproveUrl(token: string): string {
  return `https://jtqlamkrhdfwtmaubfrc.supabase.co/functions/v1/po-approve?token=${token}`
}
