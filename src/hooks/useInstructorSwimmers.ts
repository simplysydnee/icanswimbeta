import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { Swimmer } from '@/types/swimmer'

export function useInstructorSwimmers() {
  const { user, role, isLoadingProfile } = useAuth()
  const supabase = createClient()

  return useQuery({
    queryKey: ['instructor-swimmers', user?.id, role],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available')
        return []
      }

      // Admins see all swimmers
      if (role === 'admin') {
        console.log('Admin user - fetching all swimmers')
        const { data, error } = await supabase
          .from('swimmers')
          .select('*')
          .order('last_name')
          .order('first_name')

        if (error) {
          console.error('Error fetching all swimmers for admin:', error)
          throw error
        }

        console.log(`Admin fetched ${data?.length || 0} swimmers`)
        return data || []
      }

      // Instructors see only their swimmers via database function
      if (role === 'instructor') {
        console.log(`Instructor ${user.id} - fetching instructor swimmers`)
        const { data, error } = await supabase
          .rpc('get_instructor_swimmers', { p_instructor_id: user.id })

        if (error) {
          console.error('Error fetching instructor swimmers:', error)
          throw error
        }

        console.log(`Instructor fetched ${data?.length || 0} swimmers`)
        return data || []
      }

      // Parents see their own swimmers
      if (role === 'parent') {
        console.log(`Parent ${user.id} - fetching parent swimmers`)
        const { data, error } = await supabase
          .from('swimmers')
          .select('*')
          .eq('parent_id', user.id)
          .order('last_name')
          .order('first_name')

        if (error) {
          console.error('Error fetching parent swimmers:', error)
          throw error
        }

        console.log(`Parent fetched ${data?.length || 0} swimmers`)
        return data || []
      }

      // Other roles (coordinator) - no swimmers by default
      console.log(`Role ${role} - returning empty swimmers list`)
      return []
    },
    enabled: !!user?.id && !isLoadingProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}