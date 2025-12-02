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
}

export function RoleGuard({
  children,
  allowedRoles = [],
  fallback = null,
  redirectTo = '/unauthorized'
}: RoleGuardProps) {
  const { user, role, loading, isLoadingProfile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isLoadingProfile) {
      // If user is not authenticated
      if (!user) {
        router.push('/auth')
        return
      }

      // If roles are specified and user doesn't have required role
      if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
        router.push(redirectTo)
        return
      }
    }
  }, [user, role, loading, isLoadingProfile, allowedRoles, redirectTo, router])

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