import { redirectIfAuthenticated } from '@/lib/auth/server'
import SignupForm from '@/components/auth/SignupForm'

export default async function SignupPage() {
  // Redirect if already authenticated
  await redirectIfAuthenticated()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <SignupForm />
    </div>
  )
}