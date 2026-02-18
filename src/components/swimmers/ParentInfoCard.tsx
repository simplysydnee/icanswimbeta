'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  Mail,
  Phone,
  UserPlus,
  Loader2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { differenceInDays } from 'date-fns';
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
  // Check if parent is linked
  const hasLinkedParent = !!(swimmer.parentId || swimmer.parent?.id);

  // Parent is linked (works for ALL funding sources)
  if (hasLinkedParent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Parent/Guardian Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium">{swimmer.parent?.fullName || 'Not provided'}</p>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" /> Parent Linked
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {swimmer.parent?.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>{swimmer.parent.email}</span>
                    </div>
                  )}
                  {swimmer.parent?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span>{swimmer.parent.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm">
                Contact
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Parent has email but not linked yet
  // This works for ALL funding sources (VMRC, CVRC, SD, SDM, Private Pay, Scholarship)
  if (swimmer.parentEmail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Parent/Guardian Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-amber-600">Pending Parent Signup</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{swimmer.parentEmail}</span>
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  Parent has not created an account yet. They will be automatically linked when they sign up.
                </p>
                {swimmer.invitedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Invitation sent {differenceInDays(new Date(), new Date(swimmer.invitedAt))} days ago
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {isAdmin && (
                  <>
                    {swimmer.invitedAt ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onInviteParent}
                        disabled={invitingParent}
                      >
                        {invitingParent ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4 mr-2" />
                        )}
                        Resend Invite
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={onInviteParent}
                        disabled={invitingParent}
                      >
                        {invitingParent ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Invite Parent
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No parent email at all
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Parent/Guardian Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-muted-foreground">No parent information available</p>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Add parent email to swimmer profile first"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Parent
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}