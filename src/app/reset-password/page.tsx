import { Suspense } from 'react'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import { Loader2 } from 'lucide-react'

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Suspense fallback={<LoadingFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}