'use client'

import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  fallback?: React.ReactNode
  redirectTo?: string
  noRedirect?: boolean  // If true, won't redirect to unauthorized page
}

export function RoleGuard({
  children,
  allowedRoles = [],
  fallback = null,
  redirectTo = '/unauthorized',
  noRedirect = false
}: RoleGuardProps) {
  const { user, role, loading, isLoadingProfile } = useAuth()
  const router = useRouter()

  console.log('RoleGuard: state', {
    user: user?.email,
    role,
    loading,
    isLoadingProfile,
    allowedRoles
  })

  useEffect(() => {
    console.log('RoleGuard: useEffect running', { loading, isLoadingProfile })

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading || isLoadingProfile) {
        console.log('RoleGuard: Auth taking too long (10s timeout), forcing check')
        // Force check even if still loading
        if (!user) {
          console.log('RoleGuard: timeout - no user, redirecting to login')
          router.push('/login')
        }
      }
    }, 10000) // 10 second timeout

    if (!loading && !isLoadingProfile) {
      console.log('RoleGuard: loading states false, checking auth...')
      // If user is not authenticated
      if (!user) {
        console.log('RoleGuard: no user, redirecting to login')
        router.push('/login')
        return
      }

      // If roles are specified and user doesn't have required role
      if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
        console.log('RoleGuard: user role', role, 'not in allowedRoles', allowedRoles, 'noRedirect:', noRedirect)

        // Only redirect if noRedirect is false
        if (!noRedirect) {
          console.log('RoleGuard: redirecting to', redirectTo)
          router.push(redirectTo)
          return
        }
      }

      console.log('RoleGuard: user authenticated with allowed role', role)
    } else {
      console.log('RoleGuard: still loading', { loading, isLoadingProfile })
    }

    return () => clearTimeout(timeoutId)
  }, [user, role, loading, isLoadingProfile, allowedRoles, redirectTo, noRedirect, router])

  // Show loading state
  if (loading || isLoadingProfile) {
    console.log('RoleGuard: showing loading spinner')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!user) {
    return fallback
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return fallback
  }

  return <>{children}</>
}