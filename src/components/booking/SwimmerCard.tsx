'use client';

import { Check, User } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import type { Swimmer } from '@/types/booking';
import { cn, getSwimmerStatusBadge } from '@/lib/utils';

interface SwimmerCardProps {
  swimmer: Swimmer;
  isSelected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function SwimmerCard({ swimmer, isSelected, disabled, onClick }: SwimmerCardProps) {
  const initials = `${swimmer.firstName[0]}${swimmer.lastName[0]}`.toUpperCase();
  const bookingStatus = getSwimmerStatusBadge(swimmer);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition-all',
        'hover:border-primary/50 hover:bg-muted/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected && 'border-primary bg-primary/5',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {swimmer.photoUrl ? (
          <Image
            src={swimmer.photoUrl}
            alt={`${swimmer.firstName} ${swimmer.lastName}`}
            width={48}
            height={48}
            className="rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <User className="h-6 w-6 text-muted-foreground" />
            <span className="sr-only">{initials}</span>
          </div>
        )}

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Swimmer info */}
      <div className="flex-1 space-y-2">
        {/* Name and badges */}
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">
            {swimmer.firstName} {swimmer.lastName}
          </h3>
          {swimmer.fundingSourceShortName && (
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              {swimmer.fundingSourceShortName}
            </Badge>
          )}
        </div>

        {/* Status and level badges */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={swimmer.enrollmentStatus} size="sm" />

          <Badge variant={bookingStatus.variant} size="sm">
            {bookingStatus.text}
          </Badge>

          {swimmer.currentLevelName && (
            <Badge variant="secondary" className="bg-secondary/20">
              {swimmer.currentLevelName}
            </Badge>
          )}

          {/* Funding source session info */}
          {swimmer.fundingSourceId && swimmer.sessionsAuthorized && (
            <span className="text-xs text-muted-foreground">
              {swimmer.sessionsUsed || 0}/{swimmer.sessionsAuthorized} sessions
            </span>
          )}
        </div>

        {/* Age display */}
        <p className="text-sm text-muted-foreground">
          {calculateAge(swimmer.dateOfBirth)} years old
        </p>
      </div>
    </button>
  );
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}