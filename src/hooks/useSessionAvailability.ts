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
      
      // Mock data for demo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockTimes: TimeSlot[] = [
        { time: "09:00 AM", availableInstructorsCount: 2 },
        { time: "10:00 AM", availableInstructorsCount: 3 },
        { time: "11:00 AM", availableInstructorsCount: 1 },
        { time: "02:00 PM", availableInstructorsCount: 2 },
        { time: "03:00 PM", availableInstructorsCount: 3 },
        { time: "04:00 PM", availableInstructorsCount: 2 },
        { time: "05:00 PM", availableInstructorsCount: 1 },
      ];
      
      setAvailableTimes(mockTimes);
      setLoading(false);
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
      
      // Mock data for demo - simulate checking availability
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Create mock instructors with some having conflicts
      const mockInstructors: InstructorAvailability[] = [
        {
          instructorId: "instructor-1",
          instructorName: "Sutton Lucas",
          availableForAll: true,
          conflictDates: [],
        },
        {
          instructorId: "instructor-2",
          instructorName: "Coach Emma",
          availableForAll: true,
          conflictDates: [],
        },
        {
          instructorId: "instructor-3",
          instructorName: "Michael Chen",
          availableForAll: remainingDates.length <= 3, // Only available if 3 or fewer dates
          conflictDates: remainingDates.length > 3 ? [remainingDates[remainingDates.length - 1]] : [],
        },
      ];
      
      // For morning times (before noon), add an instructor with conflicts
      if (selectedTime.includes("AM") && !selectedTime.includes("11:")) {
        mockInstructors.push({
          instructorId: "instructor-4",
          instructorName: "Sarah Johnson",
          availableForAll: false,
          conflictDates: remainingDates.slice(0, Math.min(2, remainingDates.length)),
        });
      }
      
      // For afternoon times, add different instructors
      if (selectedTime.includes("PM") && parseInt(selectedTime) >= 2) {
        mockInstructors.push({
          instructorId: "instructor-5",
          instructorName: "Coach Riley",
          availableForAll: true,
          conflictDates: [],
        });
      }
      
      setAvailableInstructors(mockInstructors);
      setLoading(false);
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
