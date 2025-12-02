'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
}

export function LogoutButton({ 
  variant = 'outline', 
  size = 'default',
  className = '',
  showIcon = true 
}: LogoutButtonProps) {
  const { signOut, loading, user } = useAuth()

  // Don't show button if user is not logged in
  if (!user) return null

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => signOut()}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          {showIcon && <LogOut className="mr-2 h-4 w-4" />}
          Sign Out
        </>
      )}
    </Button>
  )
}