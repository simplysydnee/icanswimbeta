import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, eachWeekOfInterval, addDays, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Los_Angeles";

export interface TimeSlot {
  time: string;
  availableInstructorsCount: number;
}

export interface InstructorAvailability {
  instructorId: string;
  instructorName: string;
  availableForAll: boolean;
  conflictDates: Date[];
}

export const useSessionAvailability = (
  currentMonth: Date,
  selectedDay: number | null,
  selectedTime: string | null
) => {
  const [loading, setLoading] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);
  const [availableInstructors, setAvailableInstructors] = useState<InstructorAvailability[]>([]);

  // Calculate remaining dates for the selected day in current month
  const remainingDates = useMemo(() => {
    if (selectedDay === null) return [];

    const now = toZonedTime(new Date(), TIMEZONE);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const dates: Date[] = [];
    let currentDate = monthStart;

    while (currentDate <= monthEnd) {
      if (currentDate.getDay() === selectedDay && currentDate >= now) {
        dates.push(currentDate);
      }
      currentDate = addDays(currentDate, 1);
    }

    return dates;
  }, [selectedDay, currentMonth]);

  // Fetch available times for the selected day
  useEffect(() => {
    if (selectedDay === null || remainingDates.length === 0) {
      setAvailableTimes([]);
      return;
    }

    const fetchAvailableTimes = async () => {
      setLoading(true);
      try {
        // For each remaining date, check which times have at least one available instructor
        const timeSlotMap = new Map<string, Set<string>>();

        for (const date of remainingDates) {
          // Query sessions for this specific date
          const { data: sessions, error } = await supabase
            .from("sessions")
            .select(`
              id,
              start_time,
              instructor_id,
              status,
              max_capacity,
              bookings (count)
            `)
            .eq("day_of_week", selectedDay)
            .gte("start_time", date.toISOString())
            .lt("start_time", addDays(date, 1).toISOString())
            .eq("status", "available");

          if (error) throw error;

          // Group by time and track which instructors are free
          sessions?.forEach((session) => {
            const time = format(new Date(session.start_time), "hh:mm a");
            const bookingCount = Array.isArray(session.bookings) ? session.bookings.length : 0;
            
            // Only include if session has capacity (1:1 means max_capacity = 1)
            if (bookingCount < session.max_capacity) {
              if (!timeSlotMap.has(time)) {
                timeSlotMap.set(time, new Set());
              }
              timeSlotMap.get(time)!.add(session.instructor_id);
            }
          });
        }

        // Convert to array and filter to times available on ALL dates
        const times: TimeSlot[] = Array.from(timeSlotMap.entries())
          .map(([time, instructors]) => ({
            time,
            availableInstructorsCount: instructors.size,
          }))
          .filter((slot) => slot.availableInstructorsCount > 0)
          .sort((a, b) => a.time.localeCompare(b.time));

        setAvailableTimes(times);
      } catch (error) {
        console.error("Error fetching available times:", error);
        setAvailableTimes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableTimes();
  }, [selectedDay, remainingDates]);

  // Fetch available instructors for the selected day/time
  useEffect(() => {
    if (selectedDay === null || selectedTime === null || remainingDates.length === 0) {
      setAvailableInstructors([]);
      return;
    }

    const fetchAvailableInstructors = async () => {
      setLoading(true);
      try {
        // Check each remaining date to find instructors available for ALL occurrences
        const instructorAvailabilityMap = new Map<string, {
          name: string;
          availableDates: Set<string>;
          conflictDates: Date[];
        }>();

        for (const date of remainingDates) {
          const { data: sessions, error } = await supabase
            .from("sessions")
            .select(`
              id,
              instructor_id,
              start_time,
              status,
              max_capacity,
              bookings (count)
            `)
            .eq("day_of_week", selectedDay)
            .gte("start_time", date.toISOString())
            .lt("start_time", addDays(date, 1).toISOString())
            .eq("status", "available");

          if (error) throw error;

          // Get instructor names separately if we have sessions
          const instructorIds = sessions?.map(s => s.instructor_id).filter((id): id is string => Boolean(id)) || [];
          const { data: instructors } = instructorIds.length > 0
            ? await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", instructorIds)
            : { data: [] };

          const instructorMap = new Map<string, string>();
          instructors?.forEach(i => {
            if (i.id && i.full_name) {
              instructorMap.set(i.id as string, i.full_name as string);
            }
          });

          sessions?.forEach((session) => {
            const sessionTime = format(new Date(session.start_time), "hh:mm a");
            if (sessionTime !== selectedTime) return;

            const bookingCount = Array.isArray(session.bookings) ? session.bookings.length : 0;
            const isAvailable = bookingCount < session.max_capacity;

            const instructorId = session.instructor_id as string;
            const instructorName = instructorMap.get(instructorId) || "Unknown Instructor";

            if (!instructorAvailabilityMap.has(instructorId)) {
              instructorAvailabilityMap.set(instructorId, {
                name: instructorName,
                availableDates: new Set(),
                conflictDates: [],
              });
            }

            const instructor = instructorAvailabilityMap.get(instructorId)!;
            if (isAvailable) {
              instructor.availableDates.add(date.toISOString());
            } else {
              instructor.conflictDates.push(date);
            }
          });
        }

        // Convert to array and mark who is available for all dates
        const instructors: InstructorAvailability[] = Array.from(instructorAvailabilityMap.entries())
          .map(([instructorId, data]) => ({
            instructorId,
            instructorName: data.name,
            availableForAll: data.availableDates.size === remainingDates.length,
            conflictDates: data.conflictDates,
          }))
          .sort((a, b) => {
            // Sort by availability first, then by name
            if (a.availableForAll !== b.availableForAll) {
              return a.availableForAll ? -1 : 1;
            }
            return a.instructorName.localeCompare(b.instructorName);
          });

        setAvailableInstructors(instructors);
      } catch (error) {
        console.error("Error fetching available instructors:", error);
        setAvailableInstructors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableInstructors();
  }, [selectedDay, selectedTime, remainingDates]);

  return {
    loading,
    remainingDates,
    availableTimes,
    availableInstructors,
  };
};
