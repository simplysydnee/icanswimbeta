import { redirectIfAuthenticated } from '@/lib/auth/server'
import LoginForm from '@/components/auth/LoginForm'

export default async function LoginPage() {
  // Redirect if already authenticated
  await redirectIfAuthenticated()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <LoginForm />
    </div>
  )
}