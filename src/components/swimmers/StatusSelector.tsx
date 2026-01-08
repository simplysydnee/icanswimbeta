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
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  { value: 'pending_enrollment', label: 'Pending Enrollment' },
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
  currentEnrollmentStatus,
  currentAssessmentStatus,
  currentApprovalStatus,
  onStatusChange,
}: StatusSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Status Management</CardTitle>
        <p className="text-xs text-muted-foreground">
          Manually update swimmer statuses (admin only)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enrollment Status */}
        <div className="space-y-1">
          <Label className="text-xs">Enrollment Status</Label>
          <Select
            value={currentEnrollmentStatus || ''}
            onValueChange={(v) => handleStatusUpdate('enrollment_status', v)}
            disabled={isLoading}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {ENROLLMENT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assessment Status */}
        <div className="space-y-1">
          <Label className="text-xs">Assessment Status</Label>
          <Select
            value={currentAssessmentStatus || ''}
            onValueChange={(v) => handleStatusUpdate('assessment_status', v)}
            disabled={isLoading}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {ASSESSMENT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Approval Status */}
        <div className="space-y-1">
          <Label className="text-xs">Approval Status</Label>
          <Select
            value={currentApprovalStatus || ''}
            onValueChange={(v) => handleStatusUpdate('approval_status', v)}
            disabled={isLoading}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {APPROVAL_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Updating status...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}