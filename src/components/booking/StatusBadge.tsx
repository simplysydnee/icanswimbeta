'use client';

import type { EnrollmentStatus } from '@/types/booking';

interface StatusBadgeProps {
  status: EnrollmentStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = {
    enrolled: {
      label: 'Enrolled',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    waitlist: {
      label: 'Waitlist',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    pending_enrollment: {
      label: 'Pending',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    inactive: {
      label: 'Inactive',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    declined: {
      label: 'Declined',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  };

  const { label, className } = config[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${className}`}
    >
      {label}
    </span>
  );
}