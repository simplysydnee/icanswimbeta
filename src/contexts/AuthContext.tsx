'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AuthContextType, AuthUser, LoginCredentials, RegisterCredentials, ResetPasswordRequest, UserWithRole, UserRole } from '@/types/auth'

interface ExtendedAuthContextType extends AuthContextType {
  profile: UserWithRole | null
  role: UserRole | null
  isLoadingProfile: boolean
}

const AuthContext = createContext<ExtendedAuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  isLoadingProfile: true,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshSession: async () => {},
  resetPassword: async () => ({ success: false, message: '' }),
  updatePassword: async () => ({ success: false, message: '' }),
  signInWithGoogle: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserWithRole | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Transform Supabase user to AuthUser
  const transformUser = (supabaseUser: {
    id: string
    email?: string
    user_metadata?: Record<string, unknown>
    email_confirmed_at?: string | null
    created_at: string
  }): AuthUser => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    fullName: supabaseUser.user_metadata?.full_name as string,
    avatarUrl: supabaseUser.user_metadata?.avatar_url as string,
    emailConfirmed: supabaseUser.email_confirmed_at !== null && supabaseUser.email_confirmed_at !== undefined,
    createdAt: supabaseUser.created_at,
  })


  // Initialize auth state
  useEffect(() => {
    // Fetch user profile and role
    const fetchUserProfile = async (userId: string) => {
      try {
        console.log('AuthContext: fetchUserProfile started for user', userId)
        setIsLoadingProfile(true)

        // Get profile (for name, email, etc. - NOT for role)
        console.log('AuthContext: fetching profile...')
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, email, full_name, phone, avatar_url, created_at, updated_at')
          .eq('id', userId)
          .single()
        console.log('AuthContext: profile result', profileData)

        // Get role from user_roles table ONLY
        console.log('AuthContext: fetching roles...')
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)
        console.log('AuthContext: roles result', { rolesData, rolesError })

        let primaryRole: UserRole = 'parent'
        const roles: UserRole[] = []

        if (rolesError) {
          console.error('AuthContext: Error fetching roles:', rolesError)
        } else if (rolesData) {
          roles.push(...rolesData.map(r => r.role))
          // Get primary role (admin > instructor > parent)
          primaryRole = roles.includes('admin') ? 'admin'
            : roles.includes('instructor') ? 'instructor'
            : 'parent'
        }

        console.log('AuthContext: determined primaryRole', primaryRole)

        // Create UserWithRole object if profile exists
        if (profileData) {
          const userWithRole: UserWithRole = {
            ...profileData,
            role: primaryRole,
            roles: rolesData || []
          }
          console.log('AuthContext: setting profile', userWithRole)
          setProfile(userWithRole)
        } else {
          console.log('AuthContext: setting profile to null')
          setProfile(null)
        }

        console.log('AuthContext: setting role', primaryRole)
        setRole(primaryRole)

      } catch (error) {
        console.error('AuthContext: Error in fetchUserProfile:', error)
        setProfile(null)
        setRole('parent' as UserRole)
      } finally {
        console.log('AuthContext: setIsLoadingProfile(false)')
        setIsLoadingProfile(false)
      }
    }

    const initializeAuth = async () => {
      try {
        console.log('AuthContext: initializeAuth started')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('AuthContext: session check result', { hasSession: !!session, hasUser: !!session?.user })
        if (session?.user) {
          const authUser = transformUser(session.user)
          console.log('AuthContext: setting user', authUser.email)
          setUser(authUser)
          await fetchUserProfile(session.user.id)
        } else {
          console.log('AuthContext: no session found')
        }
      } catch (error) {
        console.error('AuthContext: initializeAuth error', error)
        setError('Failed to initialize authentication')
      } finally {
        console.log('AuthContext: setLoading(false)')
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const authUser = transformUser(session.user)
          setUser(authUser)
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setRole(null)
        }
        setLoading(false)
        // Don't refresh router here - it causes infinite loops
        // router.refresh()
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const signIn = async ({ email, password }: LoginCredentials) => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      // Redirect handled by auth state change
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async ({ email, password, name }: RegisterCredentials) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      })

      if (error) throw error

      // Create profile and assign default 'parent' role if user was created
      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            full_name: name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) throw profileError

        // Assign default 'parent' role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'parent',
            created_at: new Date().toISOString()
          })

        if (roleError) throw roleError
      }

      // Redirect to dashboard after successful signup
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    } finally {
      setLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession()
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session refresh failed')
    }
  }

  const resetPassword = async ({ email }: ResetPasswordRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      
      return { success: true, message: 'Password reset email sent successfully' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) throw error
      
      return { success: true, message: 'Password updated successfully' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password update failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign-in failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role,
      loading,
      isLoadingProfile,
      error,
      signIn,
      signUp,
      signOut,
      refreshSession,
      resetPassword,
      updatePassword,
      signInWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  )
}