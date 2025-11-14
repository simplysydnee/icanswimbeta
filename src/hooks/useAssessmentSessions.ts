import { useState, useEffect } from "react";
import { assessmentsApi } from "@/lib/api-client";
import { Session } from "@/lib/api-client";

export const useAssessmentSessions = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessmentSessions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await assessmentsApi.getAvailableSessions();

        if (response.error) {
          console.error("Error fetching assessment sessions:", response.error);
          setError(response.error);
          setSessions([]);
        } else {
          setSessions(response.data || []);
          if (!response.data || response.data.length === 0) {
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
