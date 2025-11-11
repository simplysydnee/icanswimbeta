import { useMemo } from 'react';

interface InstructorData {
  instructorId: string;
  instructorName: string;
  conflictDates: Date[];
  availableForAll: boolean;
}

export const useSessionFiltering = (
  remainingDates: Date[],
  instructorData: InstructorData | undefined,
  skipConflicts: boolean
) => {
  // Filter dates based on conflicts
  const filteredDates = useMemo(() => {
    if (!instructorData || instructorData.availableForAll) {
      return remainingDates;
    }

    if (skipConflicts) {
      return remainingDates.filter(
        (date) =>
          !instructorData.conflictDates.some((c) => c.getTime() === date.getTime())
      );
    }

    return remainingDates;
  }, [remainingDates, instructorData, skipConflicts]);

  // Check if a specific date has a conflict
  const isDateConflicted = (date: Date): boolean => {
    if (!instructorData) return false;
    return instructorData.conflictDates.some((c) => c.getTime() === date.getTime());
  };

  // Check if a date should be skipped
  const isDateSkipped = (date: Date): boolean => {
    return isDateConflicted(date) && skipConflicts;
  };

  // Generate mock session IDs for booking
  const generateSessionIds = (): string[] => {
    return filteredDates.map((_, i) => `session-${i}`);
  };

  return {
    filteredDates,
    isDateConflicted,
    isDateSkipped,
    generateSessionIds,
  };
};