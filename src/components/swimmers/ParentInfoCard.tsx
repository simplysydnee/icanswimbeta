'use client';

import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Mail,
  Phone,
  UserPlus,
  Loader2,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Swimmer } from './SwimmerDetailModal';

interface ParentInfoCardProps {
  swimmer: Swimmer;
  isAdmin: boolean;
  onInviteParent: () => void;
  invitingParent: boolean;
}

export function ParentInfoCard({
  swimmer,
  isAdmin,
  onInviteParent,
  invitingParent,
}: ParentInfoCardProps) {
  const hasLinkedParent = !!(swimmer.parentId || swimmer.parent?.id);

  const formatInvitationTime = (invitedAt: string) => {
    return formatDistanceToNow(new Date(invitedAt), { addSuffix: true });
  };

  // Parent is linked
  if (hasLinkedParent) {
    return (
      <div className="chart-section">
        <h3 className="chart-header flex items-center gap-2">
          <Users className="h-4 w-4" />
          Parent/Guardian
        </h3>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{swimmer.parent?.fullName || 'Not provided'}</span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" /> Linked
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              {swimmer.parent?.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {swimmer.parent.email}
                </span>
              )}
              {swimmer.parent?.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {swimmer.parent.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Parent has email but not linked yet
  if (swimmer.parentEmail) {
    return (
      <div className="chart-section">
        <h3 className="chart-header flex items-center gap-2">
          <Users className="h-4 w-4" />
          Parent/Guardian
        </h3>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-amber-600 font-medium">Pending Signup</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {swimmer.parentEmail}
            </div>
            {swimmer.invitedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Invited {formatInvitationTime(swimmer.invitedAt)}
              </p>
            )}
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={onInviteParent}
              disabled={invitingParent}
            >
              {invitingParent ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : swimmer.invitedAt ? (
                <>
                  <Mail className="h-3.5 w-3.5 mr-1" />
                  Resend
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Invite
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // No parent email
  return (
    <div className="chart-section">
      <h3 className="chart-header flex items-center gap-2">
        <Users className="h-4 w-4" />
        Parent/Guardian
      </h3>
      <p className="text-sm text-muted-foreground">No parent information</p>
    </div>
  );
}
