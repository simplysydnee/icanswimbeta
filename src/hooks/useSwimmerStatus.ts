import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SwimmerStatus {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  currentLevel: string;
  enrollmentStatus: "waitlist" | "approved" | "enrolled";
  assessmentStatus: "not_started" | "scheduled" | "complete";
  progressPercentage: number;
}

export const useSwimmerStatus = (swimmerId?: string) => {
  const [swimmer, setSwimmer] = useState<SwimmerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSwimmerStatus = async () => {
      if (!swimmerId) {
        setLoading(false);
        return;
      }

      try {
        const { data: swimmerData, error: swimmerError } = await supabase
          .from("swimmers")
          .select(`
            id,
            first_name,
            last_name,
            photo_url,
            enrollment_status,
            assessment_status,
            current_level_id,
            swim_levels (
              display_name
            )
          `)
          .eq("id", swimmerId)
          .single();

        if (swimmerError) throw swimmerError;

        // Calculate progress percentage based on completed skills
        const { data: skillsData } = await supabase
          .from("swimmer_skills")
          .select("status")
          .eq("swimmer_id", swimmerId);

        const totalSkills = skillsData?.length || 0;
        const completedSkills = skillsData?.filter(s => s.status === "mastered").length || 0;
        const progressPercentage = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;

        setSwimmer({
          id: swimmerData.id,
          firstName: swimmerData.first_name,
          lastName: swimmerData.last_name,
          photoUrl: swimmerData.photo_url,
          currentLevel: swimmerData.swim_levels?.display_name || "Not Assigned",
          enrollmentStatus: swimmerData.enrollment_status as "waitlist" | "approved" | "enrolled",
          assessmentStatus: swimmerData.assessment_status as "not_started" | "scheduled" | "complete",
          progressPercentage,
        });
      } catch (err) {
        console.error("Error fetching swimmer status:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch swimmer status");
      } finally {
        setLoading(false);
      }
    };

    fetchSwimmerStatus();
  }, [swimmerId]);

  return { swimmer, loading, error };
};
