'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Mail, Phone } from 'lucide-react';
import type { Swimmer } from './SwimmerDetailModal';

interface CoordinatorInfoCardProps {
  swimmer: Swimmer;
  onEmailCoordinator?: () => void;
}

export function CoordinatorInfoCard({
  swimmer,
  onEmailCoordinator,
}: CoordinatorInfoCardProps) {
  // Only show if swimmer has coordinator info (VMRC, CVRC)
  // Do NOT show for SD, SDM, Private Pay, Scholarship
  const hasCoordinator = !!(
    swimmer.coordinatorName ||
    swimmer.coordinatorEmail ||
    swimmer.coordinatorPhone
  );

  if (!hasCoordinator) {
    return null; // Don't render anything
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Coordinator Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {swimmer.coordinatorName && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Coordinator Name</p>
              <p className="font-medium">{swimmer.coordinatorName}</p>
            </div>
          )}
          {swimmer.coordinatorEmail && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Coordinator Email</p>
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <a
                  href={`mailto:${swimmer.coordinatorEmail}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {swimmer.coordinatorEmail}
                </a>
                {onEmailCoordinator && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEmailCoordinator}
                    className="ml-2"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Compose
                  </Button>
                )}
              </div>
            </div>
          )}
          {swimmer.coordinatorPhone && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Coordinator Phone</p>
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <a
                  href={`tel:${swimmer.coordinatorPhone}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {swimmer.coordinatorPhone}
                </a>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}