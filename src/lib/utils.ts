import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Swimmer } from "@/types/booking"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a price in cents to a display string
 * @param priceCents Price in cents (e.g., 7500 = $75.00)
 * @returns Formatted price string (e.g., "$75.00")
 */
export function formatPrice(priceCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(priceCents / 100)
}

/**
 * Check if swimmer can book regular lessons
 * @param swimmer Swimmer object
 * @returns True if swimmer is enrolled and has completed assessment
 */
export function canBookRegularLessons(swimmer: Swimmer): boolean {
  return (swimmer.enrollmentStatus === 'enrolled' || swimmer.enrollmentStatus === 'active') &&
         swimmer.assessmentStatus === 'completed';
}

/**
 * Check if swimmer needs assessment
 * @param swimmer Swimmer object
 * @returns True if swimmer is on waitlist or hasn't completed assessment
 */
export function needsAssessment(swimmer: Swimmer): boolean {
  return swimmer.enrollmentStatus === 'waitlist' ||
         swimmer.enrollmentStatus === 'pending_assessment' ||
         swimmer.assessmentStatus === 'not_started' ||
         swimmer.assessmentStatus === 'scheduled' || // Already has assessment scheduled
         swimmer.assessmentStatus === null; // No assessment status set
}

/**
 * Check if swimmer is pending approval
 * @param swimmer Swimmer object
 * @returns True if swimmer is pending enrollment or approval
 */
export function isPendingApproval(swimmer: Swimmer): boolean {
  return swimmer.enrollmentStatus === 'pending_enrollment' ||
         swimmer.enrollmentStatus === 'pending_assessment';
}

/**
 * Get swimmer status badge text and color
 * @param swimmer Swimmer object
 * @returns Object with text and variant for badge
 */
export function getSwimmerStatusBadge(swimmer: Swimmer): { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (swimmer.enrollmentStatus === 'waitlist') {
    return { text: 'Assessment Required', variant: 'destructive' };
  }
  if (swimmer.enrollmentStatus === 'pending_enrollment' || swimmer.enrollmentStatus === 'pending_assessment') {
    return { text: 'Pending Approval', variant: 'secondary' };
  }
  if ((swimmer.enrollmentStatus === 'enrolled' || swimmer.enrollmentStatus === 'active') && swimmer.assessmentStatus === 'completed') {
    return { text: 'Ready to Book', variant: 'default' };
  }
  if ((swimmer.enrollmentStatus === 'enrolled' || swimmer.enrollmentStatus === 'active') && swimmer.assessmentStatus !== 'completed') {
    return { text: 'Assessment Needed', variant: 'destructive' };
  }
  if (swimmer.enrollmentStatus === 'inactive') {
    return { text: 'Inactive', variant: 'outline' };
  }
  if (swimmer.enrollmentStatus === 'declined') {
    return { text: 'Declined', variant: 'outline' };
  }
  return { text: 'Unknown Status', variant: 'outline' };
}
