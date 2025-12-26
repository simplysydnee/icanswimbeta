'use client';

import { getUserColor, getUserInitials } from '@/lib/user-colors';
import { cn } from '@/lib/utils';

interface UserBadgeProps {
  userId: string;
  fullName: string | null;
  email?: string;
  showName?: boolean;
  size?: 'sm' | 'md';
}

export function UserBadge({ userId, fullName, email, showName = true, size = 'sm' }: UserBadgeProps) {
  const colors = getUserColor(userId);
  const initials = getUserInitials(fullName);
  const displayName = fullName || email || 'Unknown';

  return (
    <div className={cn(
      "flex items-center gap-1.5",
      size === 'sm' ? 'text-xs' : 'text-sm'
    )}>
      <span className={cn(
        "inline-flex items-center justify-center rounded-full font-medium",
        colors.bg,
        colors.text,
        size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs'
      )}>
        {initials}
      </span>
      {showName && (
        <span className="text-muted-foreground truncate max-w-[100px]">
          {displayName}
        </span>
      )}
    </div>
  );
}