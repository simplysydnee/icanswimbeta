'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { TIME_SLOTS, Break, formatTime12Hour } from '@/types/session-generator';
import { DURATION_OPTIONS } from '@/config/constants';
import { useState, useMemo } from 'react';

/**
 * Generate break end time options in 5-minute increments
 * Starting from breakStart + 5 minutes, up to 1 hour maximum
 */
const generateBreakEndOptions = (breakStartTime: string, dayEndTime: string): Array<{value: string, label: string}> => {
  if (!breakStartTime) return [];

  const options = [];
  const [startHour, startMin] = breakStartTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;

  // Parse day end time
  const [endHour, endMin] = dayEndTime.split(':').map(Number);
  const endMinutes = endHour * 60 + endMin;

  // Generate 5-minute increments for up to 1 hour, but don't exceed day end
  for (let i = 5; i <= 60; i += 5) {
    const totalMinutes = startMinutes + i;
    if (totalMinutes > 24 * 60) break; // Don't go past midnight
    if (totalMinutes > endMinutes) break; // Don't exceed day end time

    const hour = Math.floor(totalMinutes / 60);
    const min = totalMinutes % 60;
    const time24 = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    const time12 = formatTime12Hour(time24);

    options.push({ value: time24, label: time12 });
  }

  return options;
};

/**
 * Validate break duration doesn't exceed 1 hour
 */
const isValidBreakDuration = (startTime: string, endTime: string): boolean => {
  if (!startTime || !endTime) return false;

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  const durationMinutes = endMinutes - startMinutes;

  return durationMinutes > 0 && durationMinutes <= 60;
};

interface TimeSectionProps {
  startTime: string;
  endTime: string;
  durationMinutes: 30 | 45;
  breaks: Break[];
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onDurationChange: (duration: 30 | 45) => void;
  onBreaksChange: (breaks: Break[]) => void;
}

/**
 * Time window section - Start/end time, duration, and breaks
 * Breaks are times to skip (e.g., lunch break 12:00-12:30)
 */
export function TimeSection({
  startTime,
  endTime,
  durationMinutes,
  breaks,
  onStartTimeChange,
  onEndTimeChange,
  onDurationChange,
  onBreaksChange,
}: TimeSectionProps) {
  // State for adding new break
  const [newBreakStart, setNewBreakStart] = useState<string>('');
  const [newBreakEnd, setNewBreakEnd] = useState<string>('');

  // Add a break
  const addBreak = () => {
    if (newBreakStart && newBreakEnd && newBreakStart < newBreakEnd && isValidBreakDuration(newBreakStart, newBreakEnd)) {
      onBreaksChange([...breaks, { startTime: newBreakStart, endTime: newBreakEnd }]);
      setNewBreakStart('');
      setNewBreakEnd('');
    }
  };

  // Remove a break
  const removeBreak = (index: number) => {
    onBreaksChange(breaks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Time Window</Label>

      {/* Start time, end time, duration in a row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Start Time */}
        <div className="space-y-2">
          <Label className="text-sm">Start Time</Label>
          <Select value={startTime} onValueChange={onStartTimeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Start time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* End Time */}
        <div className="space-y-2">
          <Label className="text-sm">End Time</Label>
          <Select value={endTime} onValueChange={onEndTimeChange}>
            <SelectTrigger>
              <SelectValue placeholder="End time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.filter(slot => slot.value > startTime).map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label className="text-sm">Session Duration</Label>
          <Select
            value={durationMinutes.toString()}
            onValueChange={(v) => onDurationChange(parseInt(v) as 30 | 45)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value.toString()}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Breaks section */}
      <div className="space-y-3">
        <Label className="text-sm">Breaks (times to skip)</Label>

        {/* Existing breaks */}
        {breaks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {breaks.map((brk, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm"
              >
                <span>{formatTime12Hour(brk.startTime)} - {formatTime12Hour(brk.endTime)}</span>
                <button
                  type="button"
                  onClick={() => removeBreak(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new break */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Break Start</Label>
            <Select value={newBreakStart} onValueChange={setNewBreakStart}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Start" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.filter(s => s.value >= startTime && s.value < endTime).map((slot) => (
                  <SelectItem key={slot.value} value={slot.value}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Break End</Label>
            <Select value={newBreakEnd} onValueChange={setNewBreakEnd}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="End" />
              </SelectTrigger>
              <SelectContent>
                {generateBreakEndOptions(newBreakStart, endTime).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addBreak}
            disabled={!newBreakStart || !newBreakEnd || !isValidBreakDuration(newBreakStart, newBreakEnd)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Break
          </Button>
        </div>
      </div>
    </div>
  );
}