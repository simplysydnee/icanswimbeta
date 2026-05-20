'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface StatusSelectorProps {
  swimmerId: string;
  currentEnrollmentStatus: string | null;
  currentAssessmentStatus: string | null;
  currentApprovalStatus: string | null;
  onStatusChange?: () => void;
}

const ENROLLMENT_STATUSES = [
  { value: 'waitlist', label: 'Waitlist' },
  { value: 'pending_enrollment', label: 'Pending' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'inactive', label: 'Inactive' },
];

const ASSESSMENT_STATUSES = [
  { value: 'not_scheduled', label: 'Not Scheduled' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending_approval', label: 'Pending Approval' },
];

const APPROVAL_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
];

export function StatusSelector({
  swimmerId,
  currentEnrollmentStatus: initialEnrollmentStatus,
  currentAssessmentStatus: initialAssessmentStatus,
  currentApprovalStatus: initialApprovalStatus,
  onStatusChange,
}: StatusSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentEnrollmentStatus, setCurrentEnrollmentStatus] = useState(initialEnrollmentStatus);
  const [currentAssessmentStatus, setCurrentAssessmentStatus] = useState(initialAssessmentStatus);
  const [currentApprovalStatus, setCurrentApprovalStatus] = useState(initialApprovalStatus);
  const { toast } = useToast();
  const supabase = createClient();

  const handleStatusUpdate = async (
    field: 'enrollment_status' | 'assessment_status' | 'approval_status',
    value: string
  ) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('swimmers')
        .update({ [field]: value })
        .eq('id', swimmerId);

      if (error) throw error;

      if (field === 'approval_status' && value === 'approved') {
        try {
          const res = await fetch(
            `/api/admin/swimmers/${swimmerId}/send-welcome-email`,
            { method: 'POST' }
          );
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error('Welcome email failed:', err);
            toast({
              title: 'Status updated, but email failed',
              description: err.error || 'Parent was not notified.',
              variant: 'destructive',
            });
          }
        } catch (emailErr) {
          console.error('Welcome email request error:', emailErr);
        }
      }

      toast({
        title: 'Status Updated',
        description: `${field.replace('_', ' ')} changed to ${value}`,
      });

      onStatusChange?.();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Enrollment */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Enrollment:</span>
        <Select
          value={currentEnrollmentStatus || ''}
          onValueChange={(v) => {
            if (typeof v === 'string') {
              setCurrentEnrollmentStatus(v);
              handleStatusUpdate('enrollment_status', v);
            }
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="h-7 w-[120px] text-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {ENROLLMENT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assessment */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Assessment:</span>
        <Select
          value={currentAssessmentStatus || ''}
          onValueChange={(v) => {
            if (typeof v === 'string') {
              setCurrentAssessmentStatus(v);
              handleStatusUpdate('assessment_status', v);
            }
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="h-7 w-[130px] text-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {ASSESSMENT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Approval */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Approval:</span>
        <Select
          value={currentApprovalStatus || ''}
          onValueChange={(v) => {
            if (typeof v === 'string') {
              setCurrentApprovalStatus(v);
              handleStatusUpdate('approval_status', v);
            }
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="h-7 w-[110px] text-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {APPROVAL_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
