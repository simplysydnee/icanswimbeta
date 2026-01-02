'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addMonths, startOfWeek, endOfWeek, parseISO, isBefore, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, User } from 'lucide-react';
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
  onSelectSession: (session: AvailableSession) => void;
  onSetRecurring: (opts: {
    day?: number;
    time?: string;
    startDate?: Date;
    endDate?: Date;
    sessionIds?: string[];
    sessions?: AvailableSession[];
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
  // Note: weekDays is no longer used in the new Calendly-style design
  // const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

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
      const data = await response.json();
      // API returns { sessions: AvailableSession[], sessionsByDate: Record<string, any[]>, total: number }
      // We need to extract and transform the sessions
      const sessions = data.sessions || [];
      // Transform snake_case to camelCase and flatten instructor object
      return sessions.map((session: any) => ({
        id: session.id,
        startTime: session.start_time,
        endTime: session.end_time,
        dayOfWeek: new Date(session.start_time).getDay(),
        instructorId: session.instructor_id,
        instructorName: session.instructor?.full_name || 'Unknown Instructor',
        instructorAvatarUrl: session.instructor?.avatar_url || null,
        location: session.location,
        sessionType: session.session_type,
        maxCapacity: session.max_capacity,
        currentBookings: session.booking_count || 0,
        isFull: session.is_full,
        priceCents: session.price_cents,
        spotsRemaining: session.max_capacity - (session.booking_count || 0)
      })) as AvailableSession[];
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
      const data = await response.json();
      // API returns { sessions: AvailableSession[], sessionsByDate: Record<string, any[]>, total: number }
      // We need to extract and transform the sessions
      const sessions = data.sessions || [];
      // Transform snake_case to camelCase and flatten instructor object
      return sessions.map((session: any) => ({
        id: session.id,
        startTime: session.start_time,
        endTime: session.end_time,
        dayOfWeek: new Date(session.start_time).getDay(),
        instructorId: session.instructor_id,
        instructorName: session.instructor?.full_name || 'Unknown Instructor',
        instructorAvatarUrl: session.instructor?.avatar_url || null,
        location: session.location,
        sessionType: session.session_type,
        maxCapacity: session.max_capacity,
        currentBookings: session.booking_count || 0,
        isFull: session.is_full,
        priceCents: session.price_cents,
        spotsRemaining: session.max_capacity - (session.booking_count || 0)
      })) as AvailableSession[];
    },
    enabled: sessionType === 'recurring' && !!localStartDate && !!localEndDate,
  });

  // Note: sessionsByDate is no longer used in the new Calendly-style design
  // Keeping the variable commented out in case it's needed elsewhere
  // const sessionsByDate = weekSessions.reduce((acc, session) => {
  //   const dateKey = format(parseISO(session.startTime), 'yyyy-MM-dd');
  //   if (!acc[dateKey]) {
  //     acc[dateKey] = [];
  //   }
  //   acc[dateKey].push(session);
  //   return acc;
  // }, {} as Record<string, AvailableSession[]>);

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

  // Single session mode - Calendly style
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  if (sessionType === 'single') {

    // Filter sessions for selected date
    const sessionsForSelectedDate = selectedDate
      ? weekSessions.filter(session =>
          format(parseISO(session.startTime), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
        )
      : [];

    // Group sessions by time for better display
    const timeSlots = sessionsForSelectedDate.reduce((acc, session) => {
      const timeKey = format(parseISO(session.startTime), 'h:mm a');
      if (!acc[timeKey]) {
        acc[timeKey] = [];
      }
      acc[timeKey].push(session);
      return acc;
    }, {} as Record<string, AvailableSession[]>);

    const hasAnySessions = weekSessions.length > 0;

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="font-semibold">Select Date & Time</h3>
          <p className="text-sm text-muted-foreground">
            Choose a date, then select an available time slot
          </p>
        </div>

        {/* Date selection */}
        <div className="space-y-4">
          <h4 className="font-medium">1. Select Date</h4>
          <div className="border rounded-lg p-4">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(date) => setSelectedDate(date || null)}
              disabled={(date) => {
                // Disable dates before today
                return isBefore(date, startOfDay(new Date()));
              }}
              className="w-full"
              required={false}
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </div>
        </div>

        {/* Time slots for selected date */}
        {selectedDate && (
          <div className="space-y-4">
            <h4 className="font-medium">
              2. Select Time for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h4>

            {isLoadingWeek ? (
              <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : sessionsForSelectedDate.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No available sessions on {format(selectedDate, 'MMMM d, yyyy')}. Try another date.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-3 gap-2">
                {Object.entries(timeSlots).map(([time, sessions]) => {
                  // For now, just show the first session at this time
                  // In a more advanced version, we could show multiple instructors at same time
                  const session = sessions[0];
                  const isSelected = session.id === selectedSessionId;
                  const spotsRemaining = session.spotsRemaining || session.maxCapacity - session.currentBookings;

                  return (
                    <Button
                      key={time}
                      variant={isSelected ? 'default' : 'outline'}
                      className="h-auto py-3 flex flex-col items-center justify-center"
                      onClick={() => onSelectSession(session)}
                    >
                      <div className="font-medium">{time}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} left
                      </div>
                      {session.instructorName && (
                        <div className="text-xs mt-1 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {session.instructorName}
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Week navigation for browsing other weeks */}
        {!selectedDate && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                disabled={isCurrentWeek}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Week
              </Button>

              <div className="text-center text-sm">
                {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
              >
                Next Week
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {!isLoadingWeek && !hasAnySessions && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No available sessions this week. Try another week or contact the office for availability.
                </AlertDescription>
              </Alert>
            )}
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
                {selectedSession.spotsRemaining !== undefined && (
                  <p className="text-xs text-green-600 mt-1">
                    {selectedSession.spotsRemaining} spot{selectedSession.spotsRemaining !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Recurring session mode - NEW FLOW: Month → Day → Time → Auto-book all instances
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));

  // Calculate month start and end
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Get all days in the month
  const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Filter to only the selected day of week
  const selectedDaysInMonth = useMemo(() => {
    if (recurringDay === null) return [];
    return allDaysInMonth.filter(date => date.getDay() === recurringDay);
  }, [allDaysInMonth, recurringDay]);

  // Calculate matched sessions for the selected day/time in the month
  const matchedSessionsInMonth = useMemo(() => {
    if (recurringDay === null || recurringTime === null || !rangeSessions.length) return [];

    return rangeSessions.filter(session => {
      const sessionDate = parseISO(session.startTime);
      return (
        sessionDate.getDay() === recurringDay &&
        getTimeFromISO(session.startTime) === recurringTime &&
        isSameMonth(sessionDate, monthStart)
      );
    });
  }, [rangeSessions, recurringDay, recurringTime, monthStart]);

  // Update selected sessions when matches change
  useEffect(() => {
    if (sessionType === 'recurring' && matchedSessionsInMonth.length > 0) {
      const matchedIds = matchedSessionsInMonth.map(s => s.id);
      if (JSON.stringify(matchedIds) !== JSON.stringify(selectedRecurringSessions)) {
        onSetRecurring({
          sessionIds: matchedIds,
          sessions: matchedSessionsInMonth,
          startDate: monthStart,
          endDate: monthEnd
        });
      }
    }
  }, [matchedSessionsInMonth, selectedRecurringSessions, sessionType, onSetRecurring, monthStart, monthEnd]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold">Recurring Weekly Schedule</h3>
        <p className="text-sm text-muted-foreground">
          Book all {DAYS_OF_WEEK[recurringDay || 0]}s in {format(monthStart, 'MMMM yyyy')} at your preferred time
        </p>
      </div>

      {/* Step 1: Month selection */}
      <div className="space-y-4">
        <h4 className="font-medium">1. Select Month</h4>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="text-center font-medium">
            {format(monthStart, 'MMMM yyyy')}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Step 2: Day of week selection */}
      <div className="space-y-4">
        <h4 className="font-medium">2. Select Day of Week</h4>
        <div className="grid grid-cols-7 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map(day => {
            const isSelected = recurringDay === day;
            const hasSessions = uniqueDays.includes(day);

            return (
              <Button
                key={day}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "h-12 flex flex-col items-center justify-center",
                  !hasSessions && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => {
                  if (hasSessions) {
                    onSetRecurring({ day });
                    onSetRecurring({ time: undefined, sessionIds: [] });
                  }
                }}
                disabled={!hasSessions}
              >
                <div className="text-xs font-medium">{DAYS_OF_WEEK[day].slice(0, 3)}</div>
                {!hasSessions && (
                  <div className="text-xs text-muted-foreground mt-1">No sessions</div>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Time selection (only shows when day selected) */}
      {recurringDay !== null && (
        <div className="space-y-4">
          <h4 className="font-medium">3. Select Time</h4>
          {isLoadingRange ? (
            <Skeleton className="h-10 w-full" />
          ) : uniqueTimes.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No sessions available on {DAYS_OF_WEEK[recurringDay]}. Try a different day or contact the office.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {uniqueTimes.map(time => {
                const isSelected = recurringTime === time;
                return (
                  <Button
                    key={time}
                    variant={isSelected ? "default" : "outline"}
                    className="h-12 flex flex-col items-center justify-center"
                    onClick={() => onSetRecurring({ time })}
                  >
                    <div className="font-medium">{formatTime12Hour(time)}</div>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Sessions preview */}
      {matchedSessionsInMonth.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">4. Sessions to Book</h4>
          <div className="rounded-lg border p-4">
            <p className="font-medium mb-3">
              {matchedSessionsInMonth.length} {DAYS_OF_WEEK[recurringDay!]} session{matchedSessionsInMonth.length !== 1 ? 's' : ''} in {format(monthStart, 'MMMM')}
            </p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {matchedSessionsInMonth.map(session => (
                <div
                  key={session.id}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>
                    {format(parseISO(session.startTime), 'EEE, MMM d')} at{' '}
                    {format(parseISO(session.startTime), 'h:mm a')}
                  </span>
                  {session.instructorName && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {session.instructorName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary box */}
      {matchedSessionsInMonth.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-green-800">Ready to Book</h4>
              <p className="text-sm text-green-700">
                {matchedSessionsInMonth.length} {DAYS_OF_WEEK[recurringDay!]} session{matchedSessionsInMonth.length !== 1 ? 's' : ''} in {format(monthStart, 'MMMM yyyy')}
              </p>
              <p className="text-sm text-green-700">
                Every {DAYS_OF_WEEK[recurringDay!]} at {formatTime12Hour(recurringTime!)}
              </p>

              {/* Check for blackout dates */}
              {selectedDaysInMonth.length > matchedSessionsInMonth.length && (
                <p className="text-xs text-amber-700 mt-2">
                  Note: {selectedDaysInMonth.length - matchedSessionsInMonth.length} {DAYS_OF_WEEK[recurringDay!]}{selectedDaysInMonth.length - matchedSessionsInMonth.length !== 1 ? 's' : ''} not available (blackout dates)
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
