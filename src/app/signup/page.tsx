import { redirectIfAuthenticated } from '@/lib/auth/server'
import SignupForm from '@/components/auth/SignupForm'
import { Suspense } from 'react'

export default async function SignupPage() {
  // Redirect if already authenticated
  await redirectIfAuthenticated()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  )
}