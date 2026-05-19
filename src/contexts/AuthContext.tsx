'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
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
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  // useRef keeps a stable reference to the browser Supabase client without re-running createClient on every render
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

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
    fullName: supabaseUser.user_metadata?.full_name as string || '',
    avatarUrl: supabaseUser.user_metadata?.avatar_url as string || '',
    emailConfirmed: supabaseUser.email_confirmed_at !== null && supabaseUser.email_confirmed_at !== undefined,
    createdAt: supabaseUser.created_at,
  })


  // Helper: run a single Supabase query with its own 12s timeout
  const withTimeout = <T,>(promise: Promise<T>): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 12000)
      ),
    ])

  // Fetch user profile and role (only called when we have a user)
  const fetchUserProfile = async (userId: string, userEmail?: string, retryCount = 0) => {
    try {
      setIsLoadingProfile(true)

      // ── Fetch profile ──────────────────────────────────────────────────────
      let profileData: Profile | null = null;
      let profileError: { code?: string; message?: string } | null = null;

      try {
        const result = await withTimeout(
          supabase.from('profiles').select('*').eq('id', userId).single()
        ) as any;
        profileData = result.data;
        profileError = result.error;
      } catch {
        profileError = { code: 'TIMEOUT', message: 'Profile query timeout' };
      }

      let finalProfileData = profileData;

      if (profileError?.code === 'PGRST116') {
        // Profile doesn't exist yet — create a minimal one
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
        finalProfileData = createError ? null : newProfile;
      } else if (profileError && profileError.code !== 'PGRST116') {
        // Non-fatal — continue with null profile; we still need the role
        finalProfileData = null;
      }

      // Ensure we always have a profile object
      if (!finalProfileData) {
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

      // ── Fetch roles ────────────────────────────────────────────────────────
      let rolesData: UserRoleRecord[] | null = null;

      try {
        const result = await withTimeout(
          supabase.from('user_roles').select('*').eq('user_id', userId)
        ) as any;
        rolesData = result.data;
      } catch {
        // Roles fetch timed out — default to parent below
        rolesData = null;
      }

      // Get primary role with priority
      // Handle case where rolesData might be null or undefined
      let primaryRole: UserRole = 'parent' // default

      if (rolesData && Array.isArray(rolesData)) {
        // Check for roles in priority order
        const rolePriority: UserRole[] = ['admin', 'coordinator', 'instructor', 'parent']

        for (const role of rolePriority) {
          const hasRole = rolesData.some(r => {
            const userRole = r.role as string; // Cast to string to handle 'vmrc_coordinator'
            return userRole === role || (userRole === 'vmrc_coordinator' && role === 'coordinator');
          });
          if (hasRole) {
            primaryRole = role
            break
          }
        }
      }

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
      console.error('Auth: fetchUserProfile unexpected error', String(error));
      // Set a safe fallback so the UI can still render
      setRole('parent');
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Initialize auth state
  useEffect(() => {
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
            setUser(null)
            setProfile(null)
            setRole(null)
            setLoading(false)
            setIsLoadingProfile(false)
            return
          } else {
            setError(getUserError.message)
            setLoading(false)
            setIsLoadingProfile(false)
          }
        } else if (user) {
          const authUser = transformUser(user)
          setUser(authUser)
          // Fire-and-forget — fetchUserProfile manages isLoadingProfile itself
          fetchUserProfile(user.id, user.email).catch(() => {
            setRole('parent')
            setIsLoadingProfile(false)
          })
          setLoading(false)
        } else {
          // No user, no error — just not logged in
          setLoading(false)
          setIsLoadingProfile(false)
        }
      } catch {
        setError('Failed to initialize authentication')
        setLoading(false)
        setIsLoadingProfile(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setRole(null)
          setLoading(false)
          setIsLoadingProfile(false)
          router.refresh()
        } else if (event === 'SIGNED_IN' && session?.user) {
          const authUser = transformUser(session.user)
          setUser(authUser)
          fetchUserProfile(session.user.id, session.user.email).catch(() => {
            setRole('parent')
            setIsLoadingProfile(false)
          })
          setLoading(false)
        }
        // INITIAL_SESSION and TOKEN_REFRESHED are handled by initializeAuth —
        // do not call router.refresh() for these events or it creates a reload loop.
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = async ({ email, password, redirectTo }: LoginCredentials) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error:', error)
        throw error
      }

      const redirectPath = redirectTo || '/dashboard'
      router.push(redirectPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async ({ email, password, name, phone, redirect_url, invitation_token }: RegisterCredentials) => {
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

        // Assign default 'parent' role to new user
        try {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: 'parent'
            });

          if (roleError) {
            console.error('Failed to assign default role:', roleError);
            // Don't fail signup if role assignment fails - user can still login
            // and will get default 'parent' role from fetchUserProfile fallback
          }
        } catch (roleError) {
          console.error('Error assigning default role:', roleError);
          // Continue anyway - user will get default role from fetchUserProfile
        }

        // Send account created email (server-side, non-fatal)
        try {
          await fetch('/api/auth/welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parentEmail: email,
              parentName: name || 'there',
            }),
          })
        } catch (emailError) {
          console.error('Welcome email failed:', emailError)
          // Non-fatal — do not block signup
        }

        // Wait for session to be fully established and database transaction to complete
        await new Promise(resolve => setTimeout(resolve, 500))

        // Force refresh the session to ensure auth state is updated
        await supabase.auth.refreshSession()
      }

      // Auto-link swimmers for this email
      if (data.user) {
        try {
          // Wait a bit longer to ensure session is fully established
          await new Promise(resolve => setTimeout(resolve, 1500));

          const response = await fetch('/api/auth/link-swimmers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invitation_token }),
            credentials: 'include', // Ensure cookies are sent
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to auto-link swimmers:', {
              status: response.status,
              statusText: response.statusText,
              error: errorText,
              url: '/api/auth/link-swimmers'
            });
            // Check if it's a 404 error
            if (response.status === 404) {
              console.warn('API route /api/auth/link-swimmers returned 404. The route might not exist or there might be a routing issue.');
            }
            // Continue anyway - signup succeeded, just auto-link failed
          } else {
            await response.json();
          }
        } catch (linkError) {
          console.error('Error auto-linking swimmers:', linkError);
          // Don't fail signup if auto-link fails
        }
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

      // Clear auth state immediately before signOut to prevent race conditions
      setUser(null)
      setProfile(null)
      setRole(null)

      // Redirect to login immediately to prevent any further component updates
      router.push('/login')

      // Force refresh the router to clear any cached auth state
      router.refresh()

      // Sign out from Supabase (this will trigger onAuthStateChange)
      const { error } = await supabase.auth.signOut()
      if (error) throw error

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
      // Even on error, clear auth state
      setUser(null)
      setProfile(null)
      setRole(null)
      router.push('/login')
      router.refresh()
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

      // Use the email app URL for password reset links to ensure they work in production
      const appUrl = process.env.NEXT_PUBLIC_EMAIL_APP_URL || process.env.NEXT_PUBLIC_APP_URL || window.location.origin

      // Use API route with admin.generateLink() which uses token flow (not PKCE)
      // This bypasses cross-origin cookie issues with email clients
      const response = await fetch('/api/auth/send-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          redirectTo: `${appUrl}/reset-password`,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Password reset failed')
      }

      return { success: true, message: 'Password reset email sent successfully' }
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Password reset failed'

      // Provide more user-friendly error messages for common issues
      if (errorMessage.includes('25 seconds') || errorMessage.includes('rate limit') || errorMessage.includes('over_email_send_rate_limit')) {
        errorMessage = 'Email sending rate limit reached. Please wait 25 seconds before trying again. Consider configuring custom SMTP in Supabase for higher limits.'
      } else if (errorMessage.includes('Site URL') || errorMessage.includes('redirect')) {
        errorMessage = 'Configuration issue: Please check Supabase Site URL configuration.'
      }

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
