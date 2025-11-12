import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type UserRole = "admin" | "instructor" | "parent" | "vmrc_coordinator";

interface UseAuthReturn {
  user: User | null;
  roles: UserRole[];
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  isParent: boolean;
  isCoordinator: boolean;
  isAdminOrInstructor: boolean;
  redirectByRole: (navigate: NavigateFunction) => void;
  signOut: () => Promise<void>;
}

/**
 * Centralized authentication hook using React Query for state management.
 * 
 * Provides:
 * - Current user data
 * - User roles with caching
 * - Helper functions for role checking
 * - Navigation helpers
 * - Sign out with cache invalidation
 * 
 * @example
 * ```tsx
 * const { user, isAdmin, redirectByRole, signOut } = useAuth();
 * 
 * if (isLoading) return <Spinner />;
 * if (!isAuthenticated) return <LoginPrompt />;
 * if (isAdmin) return <AdminPanel />;
 * ```
 */
export const useAuth = (): UseAuthReturn => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch current user
  const { data: user = null, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }
      return user;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Fetch user roles (only if user exists)
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['userRoles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      return (data?.map(r => r.role) || []) as UserRole[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  /**
   * Navigate user to appropriate dashboard based on their role(s)
   * Priority: admin > instructor > coordinator > parent
   */
  const redirectByRole = (nav: NavigateFunction = navigate) => {
    if (!user) {
      nav('/auth');
      return;
    }

    if (hasRole('admin')) {
      nav('/admin/dashboard');
    } else if (hasRole('instructor')) {
      nav('/schedule');
    } else if (hasRole('vmrc_coordinator')) {
      nav('/coordinator-hub');
    } else if (hasRole('parent')) {
      nav('/parent-home');
    } else {
      nav('/');
    }
  };

  /**
   * Sign out user and invalidate all auth-related queries
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      
      // Invalidate all queries to clear cached data
      queryClient.clear();
      
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Computed role checks for convenience
  const isAdmin = hasRole('admin');
  const isInstructor = hasRole('instructor');
  const isParent = hasRole('parent');
  const isCoordinator = hasRole('vmrc_coordinator');
  const isAdminOrInstructor = isAdmin || isInstructor;

  return {
    user,
    roles,
    isLoading: userLoading || rolesLoading,
    isAuthenticated: !!user,
    hasRole,
    isAdmin,
    isInstructor,
    isParent,
    isCoordinator,
    isAdminOrInstructor,
    redirectByRole,
    signOut,
  };
};
