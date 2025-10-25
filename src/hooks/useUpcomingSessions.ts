import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UpcomingSession {
  id: string;
  swimmerId: string;
  swimmerName: string;
  sessionDate: string;
  sessionStartTime: string;
  sessionEndTime: string;
  instructor: string;
  location: string;
  sessionType: string;
  bookingStatus: string;
}

export interface SwimmerSessionsSummary {
  swimmerId: string;
  swimmerName: string;
  photoUrl?: string;
  sessions: UpcomingSession[];
  remainingSessions: number | "unlimited";
  isVmrcClient: boolean;
}

export const useUpcomingSessions = () => {
  const [swimmerSessions, setSwimmerSessions] = useState<SwimmerSessionsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch swimmers for the logged-in parent
        const { data: swimmers, error: swimmersError } = await supabase
          .from("swimmers")
          .select("id, first_name, last_name, photo_url, payment_type, vmrc_sessions_used, vmrc_sessions_authorized")
          .eq("parent_id", user.id);

        if (swimmersError) throw swimmersError;
        if (!swimmers || swimmers.length === 0) {
          setSwimmerSessions([]);
          setLoading(false);
          return;
        }

        const summaries: SwimmerSessionsSummary[] = [];

        for (const swimmer of swimmers) {
          const isVmrc = swimmer.payment_type === "vmrc";

          // Fetch upcoming bookings for this swimmer
          const { data: bookings, error: bookingsError } = await supabase
            .from("bookings")
            .select(`
              id,
              status,
              sessions (
                id,
                start_time,
                end_time,
                location,
                session_type,
                instructor_id,
                profiles!sessions_instructor_id_fkey (
                  full_name
                )
              )
            `)
            .eq("swimmer_id", swimmer.id)
            .in("status", ["confirmed", "pending"])
            .gte("sessions.start_time", new Date().toISOString())
            .order("sessions(start_time)", { ascending: true });

          if (bookingsError) throw bookingsError;

          // Transform bookings into UpcomingSession format
          const sessions: UpcomingSession[] = (bookings || [])
            .filter(b => b.sessions) // Ensure session exists
            .map(booking => {
              const session = booking.sessions as any;
              const startTime = new Date(session.start_time);
              const endTime = new Date(session.end_time);
              
              return {
                id: booking.id,
                swimmerId: swimmer.id,
                swimmerName: `${swimmer.first_name} ${swimmer.last_name}`,
                sessionDate: startTime.toLocaleDateString("en-US", { 
                  timeZone: "America/Los_Angeles",
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                }),
                sessionStartTime: startTime.toLocaleTimeString("en-US", { 
                  timeZone: "America/Los_Angeles",
                  hour: "numeric",
                  minute: "2-digit"
                }),
                sessionEndTime: endTime.toLocaleTimeString("en-US", { 
                  timeZone: "America/Los_Angeles",
                  hour: "numeric",
                  minute: "2-digit"
                }),
                instructor: session.profiles?.full_name || "TBD",
                location: session.location || "TBD",
                sessionType: session.session_type || "Lesson",
                bookingStatus: booking.status,
              };
            });

          // Calculate remaining sessions
          let remainingSessions: number | "unlimited" = "unlimited";
          
          if (isVmrc) {
            // For VMRC clients, check authorizations
            const { data: auth, error: authError } = await supabase
              .from("vmrc_authorizations")
              .select("sessions_authorized, expires_at")
              .eq("swimmer_id", swimmer.id)
              .gte("expires_at", new Date().toISOString())
              .order("expires_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (authError) console.error("Error fetching VMRC auth:", authError);

            if (auth) {
              const authorized = auth.sessions_authorized || swimmer.vmrc_sessions_authorized || 12;
              const used = swimmer.vmrc_sessions_used || 0;
              remainingSessions = Math.max(0, authorized - used);
            } else {
              remainingSessions = 0;
            }
          }

          summaries.push({
            swimmerId: swimmer.id,
            swimmerName: `${swimmer.first_name} ${swimmer.last_name}`,
            photoUrl: swimmer.photo_url,
            sessions,
            remainingSessions,
            isVmrcClient: isVmrc,
          });
        }

        setSwimmerSessions(summaries);
      } catch (err) {
        console.error("Error fetching upcoming sessions:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingSessions();
  }, []);

  return { swimmerSessions, loading, error };
};
