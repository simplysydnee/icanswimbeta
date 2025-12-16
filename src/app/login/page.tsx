import { redirectIfAuthenticated } from '@/lib/auth/server'
import LoginForm from '@/components/auth/LoginForm'
import { Suspense } from 'react'

export default async function LoginPage() {
  // Redirect if already authenticated
  await redirectIfAuthenticated()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}