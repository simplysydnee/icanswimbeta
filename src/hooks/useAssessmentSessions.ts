import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface AssessmentSession {
  id: string;
  start_time: string;
  end_time: string;
  instructor_id: string | null;
  location: string | null;
  price_cents: number;
  status: string;
}

export const useAssessmentSessions = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessmentSessions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const now = new Date().toISOString();
        
        const { data, error: fetchError } = await supabase
          .from("sessions")
          .select("id, start_time, end_time, instructor_id, location, price_cents, status")
          .eq("session_type", "assessment")
          .eq("session_type_detail", "initial")
          .in("status", ["available", "open"])
          .gte("start_time", now)
          .order("start_time", { ascending: true });

        if (fetchError) {
          console.error("Error fetching assessment sessions:", fetchError);
          setError("Failed to load assessment sessions");
          setSessions([]);
        } else {
          setSessions(data || []);
          if (!data || data.length === 0) {
            setError("No assessment openings available at this time");
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentSessions();
  }, []);

  return { sessions, loading, error };
};
