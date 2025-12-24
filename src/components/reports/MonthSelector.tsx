'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subMonths, addMonths, startOfMonth } from 'date-fns';

interface MonthSelectorProps {
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number, year: number) => void;
  showYearSelector?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function MonthSelector({
  currentMonth,
  currentYear,
  onMonthChange,
  showYearSelector = true
}: MonthSelectorProps) {
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  // Update local state when props change
  useEffect(() => {
    setMonth(currentMonth);
    setYear(currentYear);
  }, [currentMonth, currentYear]);

  const handlePreviousMonth = () => {
    const currentDate = new Date(year, month - 1, 1);
    const previousDate = subMonths(currentDate, 1);
    const newMonth = previousDate.getMonth() + 1;
    const newYear = previousDate.getFullYear();

    setMonth(newMonth);
    setYear(newYear);
    onMonthChange(newMonth, newYear);
  };

  const handleNextMonth = () => {
    const currentDate = new Date(year, month - 1, 1);
    const nextDate = addMonths(currentDate, 1);
    const newMonth = nextDate.getMonth() + 1;
    const newYear = nextDate.getFullYear();

    setMonth(newMonth);
    setYear(newYear);
    onMonthChange(newMonth, newYear);
  };

  const handleMonthChange = (value: string) => {
    const newMonth = parseInt(value);
    setMonth(newMonth);
    onMonthChange(newMonth, year);
  };

  const handleYearChange = (value: string) => {
    const newYear = parseInt(value);
    setYear(newYear);
    onMonthChange(month, newYear);
  };

  // Generate year options (current year and 5 years back)
  const currentYearNum = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYearNum - i);

  return (
    <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-2">
          <Select value={month.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue>{MONTH_NAMES[month - 1]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((monthName, index) => (
                <SelectItem key={index} value={(index + 1).toString()}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showYearSelector && (
            <Select value={year.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue>{year}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((yearOption) => (
                  <SelectItem key={yearOption} value={yearOption.toString()}>
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {format(startOfMonth(new Date(year, month - 1, 1)), 'MMMM yyyy')}
      </div>
    </div>
  );
}