'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DollarSign, Building2, Award as AwardIcon, HelpCircle } from 'lucide-react';

// Enrollment Status Configuration
export const enrollmentStatusConfig = {
  waitlist: {
    label: 'Waitlist',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  pending: {
    label: 'Pending Enrollment',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200'
  },
  pending_approval: {
    label: 'Pending Approval',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  enrolled: {
    label: 'Enrolled',
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  expired: {
    label: 'Expired',
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  declined: {
    label: 'Declined',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200'
  },
  dropped: {
    label: 'Dropped',
    bg: 'bg-gray-900',
    text: 'text-gray-100',
    border: 'border-gray-800'
  },
} as const;

// Approval Status Configuration
export const approvalStatusConfig = {
  pending: {
    label: 'Pending Approval',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200'
  },
  approved: {
    label: 'Approved',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200'
  },
  declined: {
    label: 'Declined',
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200'
  },
} as const;

// Assessment Status Configuration
export const assessmentStatusConfig = {
  not_scheduled: {
    label: 'Needs Assessment',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200'
  },
  not_started: {
    label: 'Not Started',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200'
  },
  scheduled: {
    label: 'Assessment Scheduled',
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    border: 'border-cyan-200'
  },
  completed: {
    label: 'Completed',
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    border: 'border-teal-200'
  },
  pending_approval: {
    label: 'Pending Approval',
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200'
  },
} as const;

// Funding Type Configuration
export const fundingTypeConfig = {
  private_pay: {
    label: 'Private Pay',
    icon: DollarSign,
    bg: 'bg-sky-100',
    text: 'text-sky-800',
    border: 'border-sky-200',
    size: 'default'
  },
  funded: {
    label: 'Funded',
    icon: Building2,
    bg: 'bg-violet-100',
    text: 'text-violet-800',
    border: 'border-violet-200',
    size: 'large'
  },
  vmrc: {
    label: 'VMRC',
    icon: Building2,
    bg: 'bg-violet-100',
    text: 'text-violet-800',
    border: 'border-violet-200',
    size: 'default'
  },
  cvrc: {
    label: 'CVRC',
    icon: Building2,
    bg: 'bg-violet-100',
    text: 'text-violet-800',
    border: 'border-violet-200',
    size: 'default'
  },
  scholarship: {
    label: 'Scholarship',
    icon: AwardIcon,
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    border: 'border-pink-200',
    size: 'default'
  },
  other: {
    label: 'Other',
    icon: HelpCircle,
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    size: 'default'
  },
} as const;

// Type definitions
export type EnrollmentStatus = keyof typeof enrollmentStatusConfig;
export type ApprovalStatus = keyof typeof approvalStatusConfig;
export type AssessmentStatus = keyof typeof assessmentStatusConfig;
export type FundingType = keyof typeof fundingTypeConfig;

export type StatusType = 'enrollment' | 'approval' | 'assessment' | 'funding';

interface StatusBadgeProps {
  type: StatusType;
  value: string;
  className?: string;
  showIcon?: boolean;
  size?: 'small' | 'default' | 'large';
}

export function StatusBadge({ type, value, className, showIcon = true, size }: StatusBadgeProps) {
  // Get the appropriate configuration based on type
  let config: Record<string, { label: string; bg: string; text: string; border: string; icon?: React.ComponentType<{ className?: string }>; size?: string }>;
  let defaultConfig = {
    label: value || '—',
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200'
  };

  switch (type) {
    case 'enrollment':
      config = enrollmentStatusConfig;
      break;
    case 'approval':
      config = approvalStatusConfig;
      break;
    case 'assessment':
      config = assessmentStatusConfig;
      break;
    case 'funding':
      config = fundingTypeConfig;
      break;
    default:
      config = {};
  }

  // Get the status configuration or use default
  const statusConfig = config[value] || defaultConfig;

  // Determine badge size
  const badgeSize = size || statusConfig.size || 'default';
  const sizeClasses = {
    small: 'px-1.5 py-0.5 text-xs',
    default: 'px-2.5 py-1 text-xs',
    large: 'px-3 py-1.5 text-sm font-semibold'
  };

  // Get icon if available and showIcon is true
  const IconComponent = showIcon && statusConfig.icon ? statusConfig.icon : null;

  return (
    <Badge
      variant="outline"
      className={cn(
        statusConfig.bg,
        statusConfig.text,
        statusConfig.border,
        sizeClasses[badgeSize as keyof typeof sizeClasses],
        'font-medium flex items-center gap-1.5',
        className
      )}
    >
      {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
      {statusConfig.label}
    </Badge>
  );
}

// Helper function to get all status options for dropdowns
export function getStatusOptions(type: StatusType) {
  let config: Record<string, { label: string }>;

  switch (type) {
    case 'enrollment':
      config = enrollmentStatusConfig;
      break;
    case 'approval':
      config = approvalStatusConfig;
      break;
    case 'assessment':
      config = assessmentStatusConfig;
      break;
    case 'funding':
      config = fundingTypeConfig;
      break;
    default:
      return [];
  }

  return Object.entries(config).map(([value, configItem]) => ({
    value,
    label: configItem.label
  }));
}