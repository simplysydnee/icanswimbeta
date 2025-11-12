import { useQuery } from '@tanstack/react-query';
import { swimmersApi } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export interface ParentSwimmer {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  current_level: string;
  enrollment_status: string;
  assessment_status: string;
  flexible_swimmer: boolean;
}

interface UseParentSwimmersQueryOptions {
  parentId?: string;
}

export const useParentSwimmersQuery = (options?: UseParentSwimmersQueryOptions) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Get current user ID if parentId not provided
  useEffect(() => {
    const getUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
      } catch (error) {
        console.error('Error getting user:', error);
        setCurrentUserId(null);
      } finally {
        setIsAuthChecking(false);
      }
    };

    if (!options?.parentId) {
      getUserId();
    } else {
      setCurrentUserId(options.parentId);
      setIsAuthChecking(false);
    }
  }, [options?.parentId]);

  const parentId = options?.parentId || currentUserId;

  return useQuery({
    queryKey: ['swimmers', 'parent', parentId],
    queryFn: async () => {
      // DEVELOPMENT ONLY: Return mock data when not authenticated
      // TODO: Remove this mock data check before production deployment
      if (!parentId) {
        console.warn('[DEV] No authenticated user - returning mock data');
        const mockSwimmers: ParentSwimmer[] = [
          {
            id: "mock-1",
            first_name: "Emma",
            last_name: "Johnson",
            photo_url: "",
            current_level: "Level 2",
            enrollment_status: "enrolled",
            assessment_status: "completed",
            flexible_swimmer: false
          },
          {
            id: "mock-2",
            first_name: "Liam",
            last_name: "Johnson",
            photo_url: "",
            current_level: "Level 1",
            enrollment_status: "approved",
            assessment_status: "scheduled",
            flexible_swimmer: false
          },
          {
            id: "mock-3",
            first_name: "Olivia",
            last_name: "Johnson",
            photo_url: "",
            current_level: "Not Yet Assessed",
            enrollment_status: "waitlist",
            assessment_status: "pending",
            flexible_swimmer: false
          }
        ];
        return mockSwimmers;
      }

      // Fetch real data from API
      const { data, error } = await swimmersApi.getByParentId(parentId);
      
      if (error) {
        toast({
          title: 'Error fetching swimmers',
          description: error,
          variant: 'destructive',
        });
        throw new Error(error);
      }

      // Transform to ParentSwimmer interface
      const transformedSwimmers: ParentSwimmer[] = (data || []).map((swimmer: any) => ({
        id: swimmer.id,
        first_name: swimmer.first_name,
        last_name: swimmer.last_name,
        photo_url: swimmer.photo_url,
        current_level: swimmer.swim_levels?.display_name || "Not Assigned",
        enrollment_status: swimmer.enrollment_status,
        assessment_status: swimmer.assessment_status,
        flexible_swimmer: swimmer.flexible_swimmer || false,
      }));

      return transformedSwimmers;
    },
    enabled: !isAuthChecking && !!parentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
