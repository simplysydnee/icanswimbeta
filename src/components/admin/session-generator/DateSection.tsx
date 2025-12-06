'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, X } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { SessionMode } from '@/types/session-generator';
import { DAYS_OF_WEEK } from '@/config/constants';
import { cn } from '@/lib/utils';

interface DateSectionProps {
  mode: SessionMode;
  startDate: Date | undefined;
  endDate: Date | undefined;
  repeatDay: number | undefined;
  blackoutDates: Date[];
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onRepeatDayChange: (day: number) => void;
  onBlackoutDatesChange: (dates: Date[]) => void;
}

/**
 * Date selection section - Changes based on mode
 * - Single/Assessment: Just one date picker
 * - Repeating: Date range + day of week selector + blackout dates
 */
export function DateSection({
  mode,
  startDate,
  endDate,
  repeatDay,
  blackoutDates,
  onStartDateChange,
  onEndDateChange,
  onRepeatDayChange,
  onBlackoutDatesChange,
}: DateSectionProps) {
  const isRepeating = mode === 'repeating';

  // Quick date range buttons for repeating mode
  const setThisMonth = () => {
    const now = new Date();
    onStartDateChange(startOfMonth(now));
    onEndDateChange(endOfMonth(now));
  };

  const setNextMonth = () => {
    const next = addMonths(new Date(), 1);
    onStartDateChange(startOfMonth(next));
    onEndDateChange(endOfMonth(next));
  };

  // Remove a blackout date
  const removeBlackout = (dateToRemove: Date) => {
    onBlackoutDatesChange(
      blackoutDates.filter(d => d.getTime() !== dateToRemove.getTime())
    );
  };

  // Add blackout date
  const addBlackout = (date: Date | undefined) => {
    if (date && !blackoutDates.some(d => d.getTime() === date.getTime())) {
      onBlackoutDatesChange([...blackoutDates, date]);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">
        {isRepeating ? 'Date Range' : 'Date'}
      </Label>

      {/* Quick buttons for repeating mode */}
      {isRepeating && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={setThisMonth}>
            This Month
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={setNextMonth}>
            Next Month
          </Button>
        </div>
      )}

      {/* Date pickers */}
      <div className={cn("grid gap-4", isRepeating ? "sm:grid-cols-2" : "")}>
        {/* Start Date */}
        <div className="space-y-2">
          <Label className="text-sm">{isRepeating ? 'Start Date' : 'Session Date'}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date (only for repeating) */}
        {isRepeating && (
          <div className="space-y-2">
            <Label className="text-sm">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={onEndDateChange}
                  disabled={(date) => startDate ? date < startDate : false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Day of week selector (only for repeating) */}
      {isRepeating && (
        <div className="space-y-2">
          <Label className="text-sm">Repeat Every</Label>
          <Select
            value={repeatDay?.toString()}
            onValueChange={(v) => onRepeatDayChange(parseInt(v))}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map((day) => (
                <SelectItem key={day.value} value={day.value.toString()}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Blackout dates (only for repeating) */}
      {isRepeating && (
        <div className="space-y-2">
          <Label className="text-sm">Blackout Dates (days to skip)</Label>

          <div className="flex flex-wrap gap-2">
            {blackoutDates.map((date) => (
              <div
                key={date.getTime()}
                className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
              >
                {format(date, "MMM d")}
                <button
                  type="button"
                  onClick={() => removeBlackout(date)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Add Blackout Date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                onSelect={addBlackout}
                disabled={(date) => {
                  if (!startDate || !endDate) return true;
                  return date < startDate || date > endDate;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}