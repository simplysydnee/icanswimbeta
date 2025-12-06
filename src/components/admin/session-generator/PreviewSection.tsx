'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Loader2 } from 'lucide-react';
import { SessionMode, formatTime12Hour } from '@/types/session-generator';
import { DAYS_OF_WEEK } from '@/config/constants';
import { format, eachDayOfInterval, parseISO, getDay } from 'date-fns';

interface PreviewSectionProps {
  mode: SessionMode;
  startDate: Date | undefined;
  endDate: Date | undefined;
  repeatDay: number | undefined;
  blackoutDates: Date[];
  startTime: string;
  endTime: string;
  durationMinutes: number;
  breaks: Array<{ startTime: string; endTime: string }>;
  instructorCount: number;
  isSubmitting: boolean;
  onSubmit: () => void;
}

/**
 * Preview section - Shows summary of what will be created and submit button
 */
export function PreviewSection({
  mode,
  startDate,
  endDate,
  repeatDay,
  blackoutDates,
  startTime,
  endTime,
  durationMinutes,
  breaks,
  instructorCount,
  isSubmitting,
  onSubmit,
}: PreviewSectionProps) {
  // Calculate estimated session count
  const calculateSessionCount = (): number => {
    if (!startDate || !startTime || !endTime || instructorCount === 0) {
      return 0;
    }

    // Calculate time slots per day
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    const totalMinutes = endMinutes - startMinutes;

    // Subtract break time
    let breakMinutes = 0;
    for (const brk of breaks) {
      const brkStart = parseInt(brk.startTime.split(':')[0]) * 60 + parseInt(brk.startTime.split(':')[1]);
      const brkEnd = parseInt(brk.endTime.split(':')[0]) * 60 + parseInt(brk.endTime.split(':')[1]);
      breakMinutes += brkEnd - brkStart;
    }

    const availableMinutes = totalMinutes - breakMinutes;
    const slotsPerDay = Math.floor(availableMinutes / durationMinutes);

    // Calculate number of days
    let dayCount = 1;
    if (mode === 'repeating' && endDate && repeatDay !== undefined) {
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      const matchingDays = allDays.filter(d => getDay(d) === repeatDay);
      const blackoutSet = new Set(blackoutDates.map(d => format(d, 'yyyy-MM-dd')));
      dayCount = matchingDays.filter(d => !blackoutSet.has(format(d, 'yyyy-MM-dd'))).length;
    }

    return slotsPerDay * dayCount * instructorCount;
  };

  const sessionCount = calculateSessionCount();
  const dayLabel = repeatDay !== undefined ? DAYS_OF_WEEK.find(d => d.value === repeatDay)?.label : '';

  // Validation
  const canSubmit =
    startDate &&
    startTime &&
    endTime &&
    instructorCount > 0 &&
    (mode !== 'repeating' || (endDate && repeatDay !== undefined));

  return (
    <div className="space-y-4">
      {/* Info about draft status */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Sessions will be created as <strong>Draft</strong>. They will automatically
          open for booking on the last Sunday of the month at 6:00 PM PT, or you can
          manually open them from the session list.
        </AlertDescription>
      </Alert>

      {/* Preview summary */}
      {sessionCount > 0 && (
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <h4 className="font-semibold">Preview</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>
              <strong>Mode:</strong>{' '}
              {mode === 'single' ? 'Single (Floating)' : mode === 'repeating' ? 'Repeating (Weekly)' : 'Assessment'}
            </li>
            {mode === 'repeating' && dayLabel && (
              <li><strong>Repeats:</strong> Every {dayLabel}</li>
            )}
            <li>
              <strong>Time:</strong> {formatTime12Hour(startTime)} - {formatTime12Hour(endTime)}
            </li>
            <li>
              <strong>Duration:</strong> {durationMinutes} minutes per session
            </li>
            {breaks.length > 0 && (
              <li>
                <strong>Breaks:</strong> {breaks.length} break{breaks.length !== 1 ? 's' : ''} scheduled
              </li>
            )}
            <li>
              <strong>Instructors:</strong> {instructorCount}
            </li>
          </ul>

          <div className="pt-2 border-t mt-2">
            <p className="text-lg font-bold text-primary">
              ~{sessionCount} sessions will be created
            </p>
          </div>
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!canSubmit || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Sessions...
          </>
        ) : (
          `Generate ${sessionCount > 0 ? sessionCount : ''} Sessions`
        )}
      </Button>

      {!canSubmit && (
        <p className="text-sm text-muted-foreground text-center">
          Please fill in all required fields
        </p>
      )}
    </div>
  );
}