'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface AdminSession {
  access_token: string
  refresh_token: string
}

export function ViewAsBanner() {
  const router = useRouter()
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('viewAsAdminSession')
      if (raw) {
        setAdminSession(JSON.parse(raw))
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  if (!adminSession) return null

  const handleExit = async () => {
    setExiting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      })
      if (error) throw error

      sessionStorage.removeItem('viewAsAdminSession')
      router.push('/admin/users')
    } catch (err) {
      console.error('Failed to restore admin session:', err)
      setExiting(false)
    }
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm sticky top-0 z-50">
      <span className="font-medium">Viewing as another user</span>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="bg-white text-amber-700 px-3 py-1 rounded-md hover:bg-amber-50 transition-colors font-medium text-xs disabled:opacity-50"
      >
        {exiting ? 'Restoring...' : 'Exit View-As'}
      </button>
    </div>
  )
}
