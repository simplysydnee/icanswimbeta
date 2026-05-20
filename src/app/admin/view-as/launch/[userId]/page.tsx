'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function ViewAsLaunchPage({ params }: { params: Promise<{ userId: string }> }) {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function launch() {
      const { userId } = await params

      try {
        const supabase = createClient()

        // 1) Save admin's current session into sessionStorage
        const { data: { session: adminSession } } = await supabase.auth.getSession()
        if (adminSession) {
          sessionStorage.setItem(
            'viewAsAdminSession',
            JSON.stringify({
              access_token: adminSession.access_token,
              refresh_token: adminSession.refresh_token,
            })
          )
        }

        // 2) Get a session for the target user
        const res = await fetch('/api/admin/view-as/generate-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to generate session')

        if (cancelled) return

        // 3) Switch to the target user's session
        const { error: setSessionErr } = await supabase.auth.setSession({
          access_token: json.access_token,
          refresh_token: json.refresh_token,
        })
        if (setSessionErr) throw setSessionErr

        // 4) Determine destination based on role
        const role = json.role as string
        const dest = role === 'coordinator' ? '/coordinator'
                   : role === 'instructor' ? '/instructor'
                   : '/parent'

        // 5) Redirect
        router.push(dest)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to switch user')
        }
      }
    }

    launch()
    return () => { cancelled = true }
  }, [params, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-medium mb-2">Failed to enter view-as mode</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="text-sm text-primary underline"
          >
            Back to Users
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Switching to user view...</p>
      </div>
    </div>
  )
}
