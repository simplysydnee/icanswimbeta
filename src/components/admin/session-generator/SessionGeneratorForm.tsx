'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useGenerateSessions } from '@/hooks';
import { SessionMode, Break, GenerateSessionsRequest } from '@/types/session-generator';
import { format } from 'date-fns';

import { ModeSection } from './ModeSection';
import { DateSection } from './DateSection';
import { TimeSection } from './TimeSection';
import { InstructorSection } from './InstructorSection';
import { DetailsSection } from './DetailsSection';
import { PreviewSection } from './PreviewSection';

/**
 * Main Session Generator Form
 * Combines all section components and handles form submission
 */
export function SessionGeneratorForm() {
  const { toast } = useToast();
  const { mutate: generateSessions, isPending } = useGenerateSessions();

  // Form state
  const [mode, setMode] = useState<SessionMode>('repeating');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [repeatDay, setRepeatDay] = useState<number>(1); // Monday default
  const [blackoutDates, setBlackoutDates] = useState<Date[]>([]);
  const [startTime, setStartTime] = useState<string>('14:00'); // 2 PM default
  const [endTime, setEndTime] = useState<string>('17:00'); // 5 PM default
  const [durationMinutes, setDurationMinutes] = useState<30 | 45>(30);
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [instructorIds, setInstructorIds] = useState<string[]>([]);
  const [location, setLocation] = useState<string>('Turlock');
  const [maxCapacity, setMaxCapacity] = useState<number>(1);
  const [selectedSwimLevels, setSelectedSwimLevels] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Reset form to defaults
  const resetForm = () => {
    setMode('repeating');
    setStartDate(undefined);
    setEndDate(undefined);
    setRepeatDay(1);
    setBlackoutDates([]);
    setStartTime('14:00');
    setEndTime('17:00');
    setDurationMinutes(30);
    setBreaks([]);
    setInstructorIds([]);
    setLocation('Turlock');
    setMaxCapacity(1);
    setSelectedSwimLevels([]);
    setNotes('');
  };

  // Handle form submission
  const handleSubmit = () => {
    console.log('=== handleSubmit started ===');
    console.log('Form state:', {
      mode,
      startDate,
      endDate,
      startTime,
      endTime,
      durationMinutes,
      instructorIds,
      location,
      maxCapacity,
      selectedSwimLevels,
      breaks,
      notes
    });

    if (!startDate) {
      console.log('Validation failed: Missing start date');
      toast({
        title: 'Missing Date',
        description: 'Please select a date',
        variant: 'destructive',
      });
      return;
    }

    if (instructorIds.length === 0) {
      console.log('Validation failed: No instructors selected');
      toast({
        title: 'No Instructors',
        description: 'Please select at least one instructor',
        variant: 'destructive',
      });
      return;
    }

    // Build request based on mode
    let request: GenerateSessionsRequest;

    if (mode === 'single') {
      request = {
        mode: 'single',
        startDate: format(startDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        durationMinutes,
        maxCapacity,
        location,
        instructorIds,
        allowedSwimLevels: selectedSwimLevels.length > 0 ? selectedSwimLevels : undefined,
        breaks: breaks.length > 0 ? breaks : undefined,
        notes: notes || undefined,
      };
    } else if (mode === 'repeating') {
      if (!endDate) {
        toast({
          title: 'Missing End Date',
          description: 'Please select an end date for repeating sessions',
          variant: 'destructive',
        });
        return;
      }

      request = {
        mode: 'repeating',
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        repeatDay,
        startTime,
        endTime,
        durationMinutes,
        maxCapacity,
        location,
        instructorIds,
        allowedSwimLevels: selectedSwimLevels.length > 0 ? selectedSwimLevels : undefined,
        blackoutDates: blackoutDates.length > 0
          ? blackoutDates.map(d => format(d, 'yyyy-MM-dd'))
          : undefined,
        breaks: breaks.length > 0 ? breaks : undefined,
        notes: notes || undefined,
      };
    } else {
      // assessment mode
      request = {
        mode: 'assessment',
        startDate: format(startDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        durationMinutes,
        maxCapacity,
        location,
        instructorIds,
        allowedSwimLevels: selectedSwimLevels.length > 0 ? selectedSwimLevels : undefined,
        breaks: breaks.length > 0 ? breaks : undefined,
        notes: notes || undefined,
      };
    }

    // Send request
    console.log('=== Sending API request ===');
    console.log('Request data:', request);

    generateSessions(request, {
      onSuccess: (response) => {
        console.log('=== API Success ===');
        console.log('Response:', response);
        toast({
          title: 'Sessions Generated!',
          description: (
            <div className="space-y-1">
              <p>Successfully created {response.sessionsCreated} sessions</p>
              <Link
                href="/admin/sessions/drafts"
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                View Draft Sessions →
              </Link>
            </div>
          ),
        });
        console.log('Toast shown, resetting form...');
        resetForm();
      },
      onError: (error) => {
        console.error('=== API Error ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        toast({
          title: 'Generation Failed',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Session Generator</CardTitle>
        <CardDescription>
          Create swim sessions for instructors. Sessions start as drafts and open automatically
          on the last Sunday of the month.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Section 1: Mode */}
        <ModeSection value={mode} onChange={setMode} />

        <Separator />

        {/* Section 2: Dates */}
        <DateSection
          mode={mode}
          startDate={startDate}
          endDate={endDate}
          repeatDay={repeatDay}
          blackoutDates={blackoutDates}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onRepeatDayChange={setRepeatDay}
          onBlackoutDatesChange={setBlackoutDates}
        />

        <Separator />

        {/* Section 3: Time */}
        <TimeSection
          startTime={startTime}
          endTime={endTime}
          durationMinutes={durationMinutes}
          breaks={breaks}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
          onDurationChange={setDurationMinutes}
          onBreaksChange={setBreaks}
        />

        <Separator />

        {/* Section 4: Instructors */}
        <InstructorSection
          selectedIds={instructorIds}
          onChange={setInstructorIds}
        />

        <Separator />

        {/* Section 5: Details */}
        <DetailsSection
          location={location}
          maxCapacity={maxCapacity}
          selectedSwimLevels={selectedSwimLevels}
          notes={notes}
          onLocationChange={setLocation}
          onMaxCapacityChange={setMaxCapacity}
          onSwimLevelsChange={setSelectedSwimLevels}
          onNotesChange={setNotes}
        />

        <Separator />

        {/* Section 6: Preview & Submit */}
        <PreviewSection
          mode={mode}
          startDate={startDate}
          endDate={endDate}
          repeatDay={repeatDay}
          blackoutDates={blackoutDates}
          startTime={startTime}
          endTime={endTime}
          durationMinutes={durationMinutes}
          breaks={breaks}
          instructorCount={instructorIds.length}
          isSubmitting={isPending}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
}