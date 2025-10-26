import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";

export interface ParentSwimmer {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  current_level: string;
  enrollment_status: string;
  assessment_status: string;
}

export const useParentSwimmers = () => {
  const [swimmers, setSwimmers] = useState<ParentSwimmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSwimmers();
  }, []);

  const fetchSwimmers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("swimmers")
        .select(`
          id,
          first_name,
          last_name,
          photo_url,
          enrollment_status,
          assessment_status,
          swim_levels!swimmers_current_level_id_fkey (
            display_name
          )
        `)
        .eq("parent_id", user.id)
        .order("first_name");

      if (fetchError) throw fetchError;

      const transformedSwimmers: ParentSwimmer[] = (data || []).map((swimmer: any) => ({
        id: swimmer.id,
        first_name: swimmer.first_name,
        last_name: swimmer.last_name,
        photo_url: swimmer.photo_url,
        current_level: swimmer.swim_levels?.display_name || "Not Assigned",
        enrollment_status: swimmer.enrollment_status,
        assessment_status: swimmer.assessment_status,
      }));

      setSwimmers(transformedSwimmers);
    } catch (err) {
      console.error("Error fetching swimmers:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch swimmers");
    } finally {
      setLoading(false);
    }
  };

  return { swimmers, loading, error, refetch: fetchSwimmers };
};
