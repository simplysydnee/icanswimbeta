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

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading || isLoadingProfile) {
        // Force check even if still loading
        if (!user) {
          router.push('/login')
        }
      }
    }, 10000) // 10 second timeout

    if (!loading && !isLoadingProfile) {
      // If user is not authenticated
      if (!user) {
        router.push('/login')
        return
      }

      // If roles are specified and user doesn't have required role
      if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
        // Only redirect if noRedirect is false
        if (!noRedirect) {
          router.push(redirectTo)
          return
        }
      }
    }

    return () => clearTimeout(timeoutId)
  }, [user, role, loading, isLoadingProfile, allowedRoles, redirectTo, noRedirect, router])

  // Show loading state
  if (loading || isLoadingProfile) {
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