import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "instructor" | "parent" | "vmrc_coordinator" | null;

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        } else if (roleData) {
          setUserRole(roleData.role as UserRole);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const isAdmin = userRole === "admin";
  const isInstructor = userRole === "instructor";
  const isParent = userRole === "parent";
  const isCoordinator = userRole === "vmrc_coordinator";
  const isAdminOrInstructor = userRole === "admin" || userRole === "instructor";

  return {
    userRole,
    loading,
    isAdmin,
    isInstructor,
    isParent,
    isCoordinator,
    isAdminOrInstructor,
  };
};
