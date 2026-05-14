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
        <h3 className="chart-header flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          Parent/Guardian
        </h3>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{swimmer.parent?.fullName || 'Not provided'}</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                <CheckCircle className="h-3 w-3" /> Linked
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              {swimmer.parent?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {swimmer.parent.email}
                </span>
              )}
              {swimmer.parent?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
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
        <h3 className="chart-header flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          Parent/Guardian
        </h3>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-600 font-medium">Pending Signup</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              {swimmer.parentEmail}
            </div>
            {swimmer.invitedAt && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Invited {formatInvitationTime(swimmer.invitedAt)}
              </p>
            )}
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={onInviteParent}
              disabled={invitingParent}
            >
              {invitingParent ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : swimmer.invitedAt ? (
                <>
                  <Mail className="h-3 w-3 mr-1" />
                  Resend
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
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
      <h3 className="chart-header flex items-center gap-1.5">
        <Users className="h-3 w-3" />
        Parent/Guardian
      </h3>
      <p className="text-xs text-muted-foreground">No parent information</p>
    </div>
  );
}
