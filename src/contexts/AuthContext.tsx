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
        setIsLoadingProfile(true)

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) throw profileError

        // Fetch roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)

        if (rolesError) throw rolesError

        // Get primary role (first role in the array)
        const primaryRole = rolesData[0]?.role || 'parent'

        const userWithRole: UserWithRole = {
          ...profileData,
          role: primaryRole,
          roles: rolesData
        }

        setProfile(userWithRole)
        setRole(primaryRole)
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setProfile(null)
        setRole(null)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const authUser = transformUser(session.user)
          setUser(authUser)
          await fetchUserProfile(session.user.id)
        }
      } catch {
        setError('Failed to initialize authentication')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
        router.refresh()
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