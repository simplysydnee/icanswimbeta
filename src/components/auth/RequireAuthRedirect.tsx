'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface RequireAuthRedirectProps {
  children: ReactNode
  fallback?: ReactNode
}

export function RequireAuthRedirect({ children, fallback }: RequireAuthRedirectProps) {
  // AuthContext exposes `loading` (session check) and `isLoadingProfile` (role/profile fetch).
  // We must wait for BOTH before deciding the user is unauthenticated, otherwise a
  // hydration-time race causes a false redirect to /signup → middleware bounces to /dashboard.
  const { user, loading, isLoadingProfile } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  const email = searchParams.get('email')
  const isLoading = loading || isLoadingProfile

  useEffect(() => {
    // Still initialising — do nothing
    if (isLoading) return

    if (!user) {
      const currentPath = window.location.pathname + window.location.search
      const signupUrl = new URL('/signup', window.location.origin)
      if (email) signupUrl.searchParams.set('email', email)
      signupUrl.searchParams.set('redirect', currentPath)
      router.push(signupUrl.toString())
    }
  }, [user, isLoading, email, router])

  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-muted-foreground text-sm">Redirecting...</div>
      </div>
    )
  }

  return <>{children}</>
}
