import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth/server'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default async function ProtectedRoute({ 
  children, 
  fallback = <LoadingSpinner /> 
}: ProtectedRouteProps) {
  // This will redirect to /login if not authenticated
  await requireAuth()
  
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}