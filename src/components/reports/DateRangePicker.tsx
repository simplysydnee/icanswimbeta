'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
}

const PRESETS = [
  { label: 'Today', getRange: () => ({ start: new Date(), end: new Date() }) },
  { label: 'Yesterday', getRange: () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return { start: yesterday, end: yesterday };
  }},
  { label: 'This Week', getRange: () => {
    const now = new Date();
    const start = new Date(now.setDate(now.getDate() - now.getDay()));
    const end = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    return { start, end };
  }},
  { label: 'Last Week', getRange: () => {
    const now = new Date();
    const start = new Date(now.setDate(now.getDate() - now.getDay() - 7));
    const end = new Date(now.setDate(now.getDate() - now.getDay() - 1));
    return { start, end };
  }},
  { label: 'This Month', getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  }},
  { label: 'Last Month', getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start, end };
  }},
  { label: 'Last 3 Months', getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  }},
  { label: 'Year to Date', getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date();
    return { start, end };
  }},
  { label: 'Last Year', getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear() - 1, 0, 1);
    const end = new Date(now.getFullYear() - 1, 11, 31);
    return { start, end };
  }},
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    onChange(preset.getRange());
    setIsPresetsOpen(false);
  };

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onChange({ start: range.from, end: range.to });
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Popover open={isPresetsOpen} onOpenChange={setIsPresetsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal">
            Presets
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0" align="start">
          <div className="p-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                className="w-full justify-start text-left font-normal"
                onClick={() => handlePresetSelect(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.start ? (
              value.end ? (
                <>
                  {format(value.start, "LLL dd, y")} - {format(value.end, "LLL dd, y")}
                </>
              ) : (
                format(value.start, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value.start}
            selected={{ from: value.start, to: value.end }}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}