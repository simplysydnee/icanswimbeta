'use client';

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
  const hasCoordinator = !!(
    swimmer.coordinatorName ||
    swimmer.coordinatorEmail ||
    swimmer.coordinatorPhone
  );

  if (!hasCoordinator) {
    return null;
  }

  return (
    <div className="chart-section">
      <h3 className="chart-header flex items-center gap-1.5">
        <Building2 className="h-3 w-3" />
        Coordinator
      </h3>
      <div className="space-y-1">
        {swimmer.coordinatorName && (
          <div className="chart-row-bordered">
            <span className="chart-label">Name</span>
            <span className="chart-value">{swimmer.coordinatorName}</span>
          </div>
        )}
        {swimmer.coordinatorEmail && (
          <div className="chart-row-bordered">
            <span className="chart-label">Email</span>
            <div className="flex items-center gap-1.5">
              <a href={`mailto:${swimmer.coordinatorEmail}`} className="text-xs text-blue-600 hover:underline truncate max-w-[150px]">
                {swimmer.coordinatorEmail}
              </a>
              {onEmailCoordinator && (
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={onEmailCoordinator}>
                  <Mail className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
        {swimmer.coordinatorPhone && (
          <div className="chart-row-bordered">
            <span className="chart-label">Phone</span>
            <a href={`tel:${swimmer.coordinatorPhone}`} className="text-xs text-blue-600 hover:underline">
              {swimmer.coordinatorPhone}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
