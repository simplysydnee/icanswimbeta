'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addMonths, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { AvailableSession } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InstructorAvatar } from '@/components/ui/instructor-avatar';
import { cn } from '@/lib/utils';

// Convert "16:00" to "4:00 PM"
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Extract time string "HH:mm" from ISO datetime
const getTimeFromISO = (isoString: string): string => {
  return format(parseISO(isoString), 'HH:mm');
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DateSelectStepProps {
  sessionType: 'single' | 'recurring';
  instructorId: string | null;
  selectedSessionId: string | null;
  recurringDay: number | null;
  recurringTime: string | null;
  recurringStartDate: Date | null;
  recurringEndDate: Date | null;
  selectedRecurringSessions: string[];
  swimmerId: string | null; // Add swimmerId for flexible_swimmer check
  onSelectSession: (sessionId: string) => void;
  onSetRecurring: (opts: {
    day?: number;
    time?: string;
    startDate?: Date;
    endDate?: Date;
    sessionIds?: string[];
  }) => void;
}

export function DateSelectStep({
  sessionType,
  instructorId,
  selectedSessionId,
  recurringDay,
  recurringTime,
  recurringStartDate,
  recurringEndDate,
  selectedRecurringSessions,
  swimmerId,
  onSelectSession,
  onSetRecurring,
}: DateSelectStepProps) {
  // Single session mode state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));

  // Recurring mode state
  const [localStartDate, setLocalStartDate] = useState<Date | null>(recurringStartDate);
  const [localEndDate, setLocalEndDate] = useState<Date | null>(recurringEndDate);

  // Update local state when props change
  useEffect(() => {
    setLocalStartDate(recurringStartDate);
  }, [recurringStartDate]);

  useEffect(() => {
    setLocalEndDate(recurringEndDate);
  }, [recurringEndDate]);

  // Calculate week range for single mode
  const weekEnd = endOfWeek(currentWeekStart);
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  // Fetch available sessions for single mode week
  const { data: weekSessions = [], isLoading: isLoadingWeek } = useQuery({
    queryKey: ['available-sessions', instructorId, currentWeekStart.toISOString(), swimmerId, 'single'],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: currentWeekStart.toISOString(),
        endDate: weekEnd.toISOString(),
        bookingType: 'single', // Specify booking type
      });
      if (instructorId) {
        params.append('instructorId', instructorId);
      }
      if (swimmerId) {
        params.append('swimmerId', swimmerId); // For flexible_swimmer check
      }

      const response = await fetch(`/api/sessions/available?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      return response.json() as Promise<AvailableSession[]>;
    },
    enabled: sessionType === 'single',
  });

  // Fetch available sessions for recurring mode date range
  const { data: rangeSessions = [], isLoading: isLoadingRange } = useQuery({
    queryKey: ['available-sessions-recurring', instructorId, localStartDate?.toISOString(), localEndDate?.toISOString(), swimmerId],
    queryFn: async () => {
      if (!localStartDate || !localEndDate) return [];

      const params = new URLSearchParams({
        startDate: localStartDate.toISOString(),
        endDate: localEndDate.toISOString(),
        bookingType: 'recurring', // Specify booking type
      });
      if (instructorId) {
        params.append('instructorId', instructorId);
      }
      if (swimmerId) {
        params.append('swimmerId', swimmerId); // For flexible_swimmer check
      }

      const response = await fetch(`/api/sessions/available?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      return response.json() as Promise<AvailableSession[]>;
    },
    enabled: sessionType === 'recurring' && !!localStartDate && !!localEndDate,
  });

  // Group sessions by date for single mode
  const sessionsByDate = weekSessions.reduce((acc, session) => {
    const dateKey = format(parseISO(session.startTime), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, AvailableSession[]>);

  // Get unique days from range sessions for recurring mode
  const uniqueDays = Array.from(new Set(rangeSessions.map(s => s.dayOfWeek))).sort();

  // Get unique times for selected day in recurring mode
  const uniqueTimes = recurringDay !== null
    ? Array.from(new Set(
        rangeSessions
          .filter(s => s.dayOfWeek === recurringDay)
          .map(s => getTimeFromISO(s.startTime))
      )).sort()
    : [];

  // Get matched sessions for recurring mode
  const matchedSessions = useMemo(() => {
    return recurringDay !== null && recurringTime
      ? rangeSessions.filter(s =>
          s.dayOfWeek === recurringDay &&
          getTimeFromISO(s.startTime) === recurringTime
        )
      : [];
  }, [recurringDay, recurringTime, rangeSessions]);

  // Update matched session IDs when matches change
  useEffect(() => {
    if (sessionType === 'recurring' && matchedSessions.length > 0) {
      const matchedIds = matchedSessions.map(s => s.id);
      if (JSON.stringify(matchedIds) !== JSON.stringify(selectedRecurringSessions)) {
        onSetRecurring({ sessionIds: matchedIds });
      }
    }
  }, [matchedSessions, selectedRecurringSessions, sessionType, onSetRecurring]);

  // Week navigation for single mode
  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => startOfWeek(addMonths(prev, -1)));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => startOfWeek(addMonths(prev, 1)));
  };

  const isCurrentWeek = isBefore(currentWeekStart, startOfDay(new Date()));

  // Get selected session details
  const selectedSession = weekSessions.find(s => s.id === selectedSessionId);

  // Handle date range changes for recurring mode
  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setLocalStartDate(date);
      onSetRecurring({ startDate: date });

      // Suggest end date 4 weeks later
      if (!localEndDate || isBefore(localEndDate, date)) {
        const suggestedEndDate = addMonths(date, 1);
        setLocalEndDate(suggestedEndDate);
        onSetRecurring({ endDate: suggestedEndDate });
      }
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      setLocalEndDate(date);
      onSetRecurring({ endDate: date });
    }
  };

  // Single session mode
  if (sessionType === 'single') {
    const hasAnySessions = weekSessions.length > 0;

    return (
      <div className="space-y-6">
        {/* Week navigation header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousWeek}
            disabled={isCurrentWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <h3 className="font-semibold">
              {format(currentWeekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
            </h3>
            <p className="text-sm text-muted-foreground">Select an available session</p>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* No sessions alert */}
        {!isLoadingWeek && !hasAnySessions && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No available sessions this week. Try another week or contact the office for availability.
            </AlertDescription>
          </Alert>
        )}

        {/* Days grid */}
        {isLoadingWeek ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, index) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const daySessions = sessionsByDate[dateKey] || [];

              return (
                <div key={index} className="space-y-1">
                  {/* Day header */}
                  <div className="text-center">
                    <div className="font-medium text-sm">{format(day, 'EEE')}</div>
                    <div className={cn(
                      "text-xs rounded-full w-6 h-6 flex items-center justify-center mx-auto",
                      format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground'
                    )}>
                      {format(day, 'd')}
                    </div>
                  </div>

                  {/* Time slots */}
                  <div className="space-y-1">
                    {daySessions.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-2">
                        No slots
                      </div>
                    ) : (
                      daySessions.map(session => {
                        const isSelected = session.id === selectedSessionId;
                        return (
                          <Button
                            key={session.id}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className="w-full justify-start text-xs h-8 px-2"
                            onClick={() => onSelectSession(session.id)}
                          >
                            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">
                              {format(parseISO(session.startTime), 'h:mm a')}
                            </span>
                          </Button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected session confirmation */}
        {selectedSession && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-800">Session Selected</h4>
                <p className="text-sm text-green-700">
                  {format(parseISO(selectedSession.startTime), 'EEEE, MMMM d, yyyy')} at{' '}
                  {format(parseISO(selectedSession.startTime), 'h:mm a')}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <InstructorAvatar
                    name={selectedSession.instructorName}
                    avatarUrl={selectedSession.instructorAvatarUrl}
                    size="sm"
                    showName={false}
                  />
                  <span className="text-xs text-green-600">
                    Instructor: {selectedSession.instructorName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Recurring session mode
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold">Recurring Weekly Schedule</h3>
        <p className="text-sm text-muted-foreground">
          Select a date range, then choose available day and time
        </p>
      </div>

      {/* Step 1: Date range selection */}
      <div className="space-y-4">
        <h4 className="font-medium">1. Select Date Range</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !localStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localStartDate ? format(localStartDate, 'PPP') : 'Pick a start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={localStartDate || undefined}
                  onSelect={handleStartDateChange}
                  disabled={date => isBefore(date, startOfDay(new Date()))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !localEndDate && "text-muted-foreground"
                  )}
                  disabled={!localStartDate}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localEndDate ? format(localEndDate, 'PPP') : 'Pick an end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={localEndDate || undefined}
                  onSelect={handleEndDateChange}
                  disabled={date => !localStartDate || isBefore(date, localStartDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Step 2: Day selection (only shows when date range selected) */}
      {localStartDate && localEndDate && (
        <div className="space-y-4">
          <h4 className="font-medium">2. Select Day of Week</h4>

          {isLoadingRange ? (
            <Skeleton className="h-10 w-full" />
          ) : rangeSessions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No sessions available in this date range. Try a different range or contact the office.
              </AlertDescription>
            </Alert>
          ) : (
            <Select
              value={recurringDay?.toString() || ''}
              onValueChange={value => {
                const day = parseInt(value);
                onSetRecurring({ day });
                // Clear time when day changes
                onSetRecurring({ time: undefined, sessionIds: [] });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select available day" />
              </SelectTrigger>
              <SelectContent>
                {uniqueDays.map(day => (
                  <SelectItem key={day} value={day.toString()}>
                    {DAYS_OF_WEEK[day]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Step 3: Time selection (only shows when day selected) */}
      {recurringDay !== null && uniqueTimes.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">3. Select Time</h4>
          <Select
            value={recurringTime || ''}
            onValueChange={value => onSetRecurring({ time: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select available time" />
            </SelectTrigger>
            <SelectContent>
              {uniqueTimes.map(time => (
                <SelectItem key={time} value={time}>
                  {formatTime12Hour(time)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Step 4: Matched sessions preview */}
      {matchedSessions.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">4. Available Sessions</h4>
          <div className="rounded-lg border p-4">
            <p className="font-medium mb-3">
              Found {matchedSessions.length} session{matchedSessions.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {matchedSessions.map(session => (
                <div
                  key={session.id}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>
                    {format(parseISO(session.startTime), 'EEE, MMM d')} at{' '}
                    {format(parseISO(session.startTime), 'h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary box */}
      {matchedSessions.length > 0 && localStartDate && localEndDate && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <CalendarIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-blue-800">Schedule Summary</h4>
              <p className="text-sm text-blue-700">
                {matchedSessions.length} session{matchedSessions.length !== 1 ? 's' : ''} on{' '}
                {DAYS_OF_WEEK[recurringDay!]}s at {formatTime12Hour(recurringTime!)}
              </p>
              <p className="text-sm text-blue-700">
                {format(localStartDate, 'MMM d, yyyy')} - {format(localEndDate, 'MMM d, yyyy')}
              </p>

              {/* Check for gaps in schedule */}
              {matchedSessions.length < 4 && (
                <p className="text-xs text-amber-700 mt-2">
                  Note: Some weeks don&apos;t have available sessions for this time
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}