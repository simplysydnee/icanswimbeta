import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const useBookingHold = () => {
  const [heldSessionIds, setHeldSessionIds] = useState<string[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const { toast } = useToast();

  // Auto-release hold after timeout
  useEffect(() => {
    if (!holdExpiresAt) return;

    const now = new Date();
    const timeUntilExpiry = holdExpiresAt.getTime() - now.getTime();

    if (timeUntilExpiry <= 0) {
      releaseHold();
      return;
    }

    const timer = setTimeout(() => {
      releaseHold();
      toast({
        title: "Selection Expired",
        description: "Your session hold has expired. Please select again.",
        variant: "destructive",
      });
    }, timeUntilExpiry);

    return () => clearTimeout(timer);
  }, [holdExpiresAt]);

  const createHold = useCallback(async (sessionIds: string[]) => {
    try {
      // In production, this would create actual hold records in the database
      // For now, we'll use client-side state with a timer
      setHeldSessionIds(sessionIds);
      const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);
      setHoldExpiresAt(expiresAt);

      console.log(`Hold created for ${sessionIds.length} sessions, expires at:`, expiresAt);
      
      return { success: true, expiresAt };
    } catch (error) {
      console.error("Error creating hold:", error);
      return { success: false };
    }
  }, []);

  const releaseHold = useCallback(() => {
    setHeldSessionIds([]);
    setHoldExpiresAt(null);
    console.log("Hold released");
  }, []);

  const validateAndBook = useCallback(async (
    sessionIds: string[],
    swimmerId: string,
    parentId: string
  ) => {
    try {
      // Final availability check before booking
      const { data: sessions, error: sessionError } = await supabase
        .from("sessions")
        .select(`
          id,
          status,
          max_capacity,
          bookings (count)
        `)
        .in("id", sessionIds);

      if (sessionError) throw sessionError;

      // Check if all sessions are still available
      const unavailableSessions = sessions?.filter((session) => {
        const bookingCount = Array.isArray(session.bookings) ? session.bookings.length : 0;
        return session.status !== "available" || bookingCount >= session.max_capacity;
      });

      if (unavailableSessions && unavailableSessions.length > 0) {
        toast({
          title: "Sessions No Longer Available",
          description: `${unavailableSessions.length} session(s) were booked by someone else. Please select again.`,
          variant: "destructive",
        });
        releaseHold();
        return { success: false };
      }

      // Create bookings atomically
      const bookings = sessionIds.map((sessionId) => ({
        session_id: sessionId,
        swimmer_id: swimmerId,
        parent_id: parentId,
        status: "confirmed",
      }));

      const { error: bookingError } = await supabase
        .from("bookings")
        .insert(bookings);

      if (bookingError) throw bookingError;

      // Update session statuses
      const { error: updateError } = await supabase
        .from("sessions")
        .update({ status: "booked" })
        .in("id", sessionIds);

      if (updateError) throw updateError;

      releaseHold();
      
      toast({
        title: "Booking Confirmed! 🎉",
        description: `Successfully booked ${sessionIds.length} session(s).`,
      });

      return { success: true };
    } catch (error) {
      console.error("Error validating and booking:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error completing your booking. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    }
  }, [toast, releaseHold]);

  return {
    heldSessionIds,
    holdExpiresAt,
    createHold,
    releaseHold,
    validateAndBook,
  };
};
