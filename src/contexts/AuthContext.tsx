'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AuthContextType, AuthUser, LoginCredentials, RegisterCredentials, ResetPasswordRequest, UserWithRole, UserRole, Profile, UserRoleRecord } from '@/types/auth'

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
    const fetchUserProfile = async (userId: string, userEmail?: string, retryCount = 0) => {
      try {
        setIsLoadingProfile(true)

        // Set a global timeout for the entire fetchUserProfile operation (reduced from 30s)
        const globalTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth fetch timeout after 10 seconds')), 10000)
        );

        // Set a timeout for individual database queries (reduced from 10s)
        const queryTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout after 5 seconds')), 5000)
        );

        // Fetch profile
        let profileData: Profile | null = null;
        let profileError: { code?: string; message?: string; details?: string; hint?: string } | null = null;

        try {
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          const profileResult = await Promise.race([profilePromise, queryTimeoutPromise, globalTimeoutPromise]) as any;
          profileData = profileResult.data;
          profileError = profileResult.error;
        } catch {
          profileError = {
            code: 'TIMEOUT',
            message: 'Profile query timeout',
            details: '',
            hint: ''
          };
        }

        // Small delay between queries to reduce database load
        await new Promise(resolve => setTimeout(resolve, 100));

        let finalProfileData = profileData;

        // If profile doesn't exist, create one
        if (profileError && profileError.code === 'PGRST116') { // PGRST116 is "No rows returned"
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userEmail || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (createError) {
            // Create a minimal profile object to prevent the error at line 183
            finalProfileData = {
              id: userId,
              email: userEmail || '',
              full_name: null,
              phone: null,
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          } else {
            // Use the newly created profile
            finalProfileData = newProfile;
          }
        } else if (profileError && retryCount === 0 && profileError.code !== 'PGRST116') {
          // If profile fetch fails for other reasons (not "not found") and we haven't retried yet, wait and retry once
          await new Promise(resolve => setTimeout(resolve, 500))
          return fetchUserProfile(userId, userEmail, 1)
        } else if (profileError) {
          // Create a minimal profile object to prevent the error at line 183
          finalProfileData = {
            id: userId,
            email: userEmail || '',
            full_name: null,
            phone: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }

        // Fetch roles
        let rolesData: UserRoleRecord[] | null = null;
        let rolesError: { code?: string; message?: string; details?: string; hint?: string } | null = null;

        try {
          const rolesPromise = supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', userId);

          const rolesResult = await Promise.race([rolesPromise, queryTimeoutPromise, globalTimeoutPromise]) as any;
          rolesData = rolesResult.data;
          rolesError = rolesResult.error;
        } catch {
          rolesError = {
            code: 'TIMEOUT',
            message: 'Roles query timeout',
            details: '',
            hint: ''
          };
        }

        // If roles fetch fails and we haven't retried yet, wait and retry once
        if (rolesError && retryCount === 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
          return fetchUserProfile(userId, userEmail, 1)
        }

        // Get primary role (first role in the array)
        // Handle case where rolesData might be null or undefined
        const primaryRole = rolesData && Array.isArray(rolesData) && rolesData[0]?.role || 'parent'

        // Make sure finalProfileData is not null or undefined
        if (!finalProfileData) {
          // Create a minimal profile object
          finalProfileData = {
            id: userId,
            email: userEmail || '',
            full_name: null,
            phone: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }

        const userWithRole: UserWithRole = {
          ...finalProfileData,
          role: primaryRole,
          roles: rolesData || []
        }

        setProfile(userWithRole)
        setRole(primaryRole)
      } catch (error) {
        // Try to extract as much error information as possible
        let errorDetails: any = {
          errorType: typeof error,
          errorString: String(error),
          userId,
          retryCount
        };

        // Try to get error properties
        if (error && typeof error === 'object') {
          try {
            const err = error as any;
            errorDetails = {
              ...errorDetails,
              message: err.message,
              name: err.name,
              stack: err.stack,
              // Try to get Supabase error properties
              code: err.code,
              details: err.details,
              hint: err.hint,
            };
          } catch (e) {
            errorDetails.extractionError = String(e);
          }
        }

        // Check if it's a timeout error
        const errorMessage = String(error);
        if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
          // Create a minimal profile object to allow the UI to render
          const minimalProfile: UserWithRole = {
            id: userId,
            email: userEmail || '',
            full_name: null,
            phone: null,
            avatar_url: null,
            role: 'parent' as UserRole,
            roles: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          setProfile(minimalProfile);
          setRole('parent');
        } else {
          // Set default values instead of null to prevent UI issues
          setProfile(null);
          setRole('parent'); // Default role
        }
      } finally {
        setIsLoadingProfile(false)
      }
    }

    const initializeAuth = async () => {
      try {
        // Use getUser() instead of getSession() to check for stale tokens
        const { data: { user }, error: getUserError } = await supabase.auth.getUser()

        if (getUserError) {
          // Handle stale refresh token
          if (getUserError.message.includes('Refresh Token')) {
            await supabase.auth.signOut()
            setUser(null)
            setProfile(null)
            setRole(null)
          } else if (getUserError.message.includes('Auth session missing')) {
            // This is normal for unauthenticated users
            setUser(null)
            setProfile(null)
            setRole(null)
          } else {
            setError(getUserError.message)
          }
        } else if (user) {
          const authUser = transformUser(user)
          setUser(authUser)

          // Start profile fetch but don't wait for it to complete
          // This prevents the page from hanging if profile fetch is slow
          fetchUserProfile(user.id, user.email).catch(() => {
            // Set default role if profile fetch fails
            setRole('parent')
          })
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
        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setRole(null)
        } else if (session?.user) {
          const authUser = transformUser(session.user)
          setUser(authUser)

          // Start profile fetch but don't wait for it to complete
          fetchUserProfile(session.user.id, session.user.email).catch(() => {
            // Set default role if profile fetch fails
            setRole('parent')
          })
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

  const signIn = async ({ email, password, redirectTo }: LoginCredentials) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Redirect to specified path or default to dashboard
      const redirectPath = redirectTo || '/dashboard'
      router.push(redirectPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async ({ email, password, name, phone, redirect_url }: RegisterCredentials) => {
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
            phone: phone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) throw profileError

        // Database trigger will auto-assign role based on email domain
        // @regional-center.net → coordinator (regional center coordinator)
        // @icanswim209.com → admin
        // All others → parent

        // Wait for session to be fully established and database transaction to complete
        await new Promise(resolve => setTimeout(resolve, 500))

        // Force refresh the session to ensure auth state is updated
        await supabase.auth.refreshSession()
      }

      // Redirect to specified path or default to dashboard
      const redirectPath = redirect_url || '/dashboard'
      router.push(redirectPath)
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
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
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