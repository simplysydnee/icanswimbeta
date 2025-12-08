'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DraftSession } from '@/hooks/useDraftSessions';
import { useInstructors } from '@/hooks';

interface EditSessionDialogProps {
  session: DraftSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: {
    start_time?: string;
    end_time?: string;
    instructor_id?: string;
  }) => Promise<void>;
}

export function EditSessionDialog({
  session,
  open,
  onOpenChange,
  onSave,
}: EditSessionDialogProps) {
  const { data: instructors = [], isLoading: isLoadingInstructors } = useInstructors();
  const [date, setDate] = useState<Date>(new Date(session.start_time));
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [instructorId, setInstructorId] = useState<string>(session.instructor_id);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with session data
  useEffect(() => {
    if (session) {
      const startDate = new Date(session.start_time);
      const endDate = new Date(session.end_time);

      setDate(startDate);
      setStartTime(format(startDate, 'HH:mm'));
      setEndTime(format(endDate, 'HH:mm'));
      setInstructorId(session.instructor_id);
    }
  }, [session]);

  const handleSave = async () => {
    if (!date || !startTime || !endTime || !instructorId) {
      return;
    }

    setIsSaving(true);
    try {
      // Combine date with time
      const startDateTime = new Date(date);
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const endDateTime = new Date(date);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      await onSave({
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        instructor_id: instructorId,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save session:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimeForDisplay = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDateForDisplay = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Original session info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Original Session</Label>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>{formatDateForDisplay(session.start_time)}</div>
              <div>
                {formatTimeForDisplay(session.start_time)} - {formatTimeForDisplay(session.end_time)}
              </div>
              <div>Instructor: {session.instructor_name}</div>
            </div>
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Start time */}
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full"
            />
          </div>

          {/* End time */}
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Instructor dropdown */}
          <div className="space-y-2">
            <Label htmlFor="instructor">Instructor</Label>
            <Select value={instructorId} onValueChange={setInstructorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingInstructors ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading instructors...
                  </div>
                ) : (
                  instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.fullName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}