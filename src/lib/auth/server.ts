import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AuthUser } from '@/types/auth'

export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null
    
    return {
      id: user.id,
      email: user.email!,
      fullName: user.user_metadata?.full_name,
      avatarUrl: user.user_metadata?.avatar_url,
      emailConfirmed: user.email_confirmed_at !== null,
      createdAt: user.created_at,
    }
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

export async function redirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const user = await getUser()
  
  if (user) {
    redirect(redirectTo)
  }
}