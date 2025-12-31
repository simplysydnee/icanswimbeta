import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export function useSwimmerAccess(swimmerId: string | undefined) {
  const { user, role, isLoadingProfile } = useAuth()
  const supabase = createClient()

  return useQuery({
    queryKey: ['swimmer-access', user?.id, swimmerId, role],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id || !swimmerId) {
        console.log('Missing user ID or swimmer ID')
        return false
      }

      // Admins always have access
      if (role === 'admin') {
        console.log(`Admin ${user.id} - always has access to swimmer ${swimmerId}`)
        return true
      }

      // Parents check if swimmer belongs to them
      if (role === 'parent') {
        console.log(`Parent ${user.id} - checking access to swimmer ${swimmerId}`)
        const { data, error } = await supabase
          .from('swimmers')
          .select('id')
          .eq('id', swimmerId)
          .eq('parent_id', user.id)
          .single()

        const hasAccess = !error && !!data
        console.log(`Parent access to swimmer ${swimmerId}: ${hasAccess}`)
        return hasAccess
      }

      // Instructors check via database function
      if (role === 'instructor') {
        console.log(`Instructor ${user.id} - checking access to swimmer ${swimmerId}`)
        const { data, error } = await supabase
          .rpc('instructor_has_swimmer_access', {
            p_instructor_id: user.id,
            p_swimmer_id: swimmerId
          })

        if (error) {
          console.error('Error checking swimmer access:', error)
          return false
        }

        const hasAccess = data === true
        console.log(`Instructor access to swimmer ${swimmerId}: ${hasAccess}`)
        return hasAccess
      }

      // Other roles (coordinator) - no access by default
      console.log(`Role ${role} - no access to swimmer ${swimmerId}`)
      return false
    },
    enabled: !!user?.id && !!swimmerId && !isLoadingProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}