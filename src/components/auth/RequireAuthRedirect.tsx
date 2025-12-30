'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface RequireAuthRedirectProps {
  children: ReactNode
  fallback?: ReactNode
}

export function RequireAuthRedirect({ children, fallback }: RequireAuthRedirectProps) {
  const { user, isLoading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  const email = searchParams.get('email')

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      // Build signup URL with email and redirect back to current page
      const currentPath = window.location.pathname + window.location.search
      const signupUrl = new URL('/signup', window.location.origin)
      if (email) signupUrl.searchParams.set('email', email)
      signupUrl.searchParams.set('redirect', currentPath)
      router.push(signupUrl.toString())
    }
  }, [user, isLoading, email, router])

  if (isLoading) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>
  }

  return <>{children}</>
}