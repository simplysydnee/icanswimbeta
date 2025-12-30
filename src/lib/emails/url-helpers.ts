import { APP_CONFIG } from '@/lib/constants'

const APP_URL = APP_CONFIG.url

/**
 * Creates a URL with email parameter for auth redirect
 */
export function createAuthUrl(path: string, email?: string): string {
  const url = new URL(path, APP_URL)
  if (email) {
    url.searchParams.set('email', email)
  }
  return url.toString()
}

/**
 * Common URLs for email buttons
 */
export const emailUrls = {
  login: (email?: string) => createAuthUrl('/login', email),
  signup: (email?: string) => createAuthUrl('/signup', email),
  parentBook: (email?: string) => createAuthUrl('/parent/book', email),
  parentSchedule: (email?: string) => createAuthUrl('/parent/schedule', email),
  coordinatorPos: (email?: string) => createAuthUrl('/coordinator/pos', email),
  instructorProgress: (email?: string) => createAuthUrl('/instructor/progress', email),
  enroll: (email?: string) => createAuthUrl('/enroll', email),
  referral: (token: string, email?: string) => {
    const url = new URL('/referral', APP_URL)
    url.searchParams.set('token', token)
    if (email) url.searchParams.set('email', email)
    return url.toString()
  },
}