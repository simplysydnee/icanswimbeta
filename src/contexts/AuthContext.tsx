'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { emailService } from '@/lib/email-service'
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
    fullName: supabaseUser.user_metadata?.full_name as string || '',
    avatarUrl: supabaseUser.user_metadata?.avatar_url as string || '',
    emailConfirmed: supabaseUser.email_confirmed_at !== null && supabaseUser.email_confirmed_at !== undefined,
    createdAt: supabaseUser.created_at,
  })


  // Fetch user profile and role (only called when we have a user)
  const fetchUserProfile = async (userId: string, userEmail?: string, retryCount = 0) => {
    console.log('=== AUTH DEBUG: fetchUserProfile called ===');
    console.log('Parameters:', { userId, userEmail, retryCount });

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
        console.log('=== AUTH DEBUG: Fetching roles for user ===');
        console.log('User ID:', userId);

        const rolesPromise = supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId);

        const rolesResult = await Promise.race([rolesPromise, queryTimeoutPromise, globalTimeoutPromise]) as any;
        rolesData = rolesResult.data;
        rolesError = rolesResult.error;

        console.log('Roles query result:', {
          data: rolesData,
          error: rolesError,
          hasData: !!rolesData,
          dataLength: rolesData?.length || 0
        });
      } catch (error) {
        console.error('=== AUTH DEBUG: Roles query catch error ===', error);
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

      console.log('=== AUTH DEBUG: Setting role ===');
      console.log('Primary role determined:', primaryRole);
      console.log('Roles data:', rolesData);
      console.log('Final profile data exists:', !!finalProfileData);

      const userWithRole: UserWithRole = {
        ...finalProfileData,
        role: primaryRole,
        roles: rolesData || []
      }

      setProfile(userWithRole)
      setRole(primaryRole)
      console.log('=== AUTH DEBUG: Role set to ===', primaryRole);
    } catch (error) {
      console.error('=== AUTH DEBUG: fetchUserProfile catch block error ===', error);
      console.error('Error details:', {
        userId,
        retryCount,
        errorString: String(error)
      });

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
            // This is normal for unauthenticated users - set loading to false immediately
            setUser(null)
            setProfile(null)
            setRole(null)
            setLoading(false) // Non-authenticated users shouldn't see loading
            return
          } else {
            setError(getUserError.message)
          }
        } else if (user) {
          console.log('Auth: User found during initialization:', user.id, user.email)
          const authUser = transformUser(user)
          setUser(authUser)

          // Start profile fetch but don't wait for it to complete
          // This prevents the page from hanging if profile fetch is slow
          fetchUserProfile(user.id, user.email).catch((error) => {
            console.error('Auth: Profile fetch failed during initialization:', error)
            // Set default role if profile fetch fails
            setRole('parent')
          })

          // Set loading to false immediately since we have a user
          // Profile fetch will handle isLoadingProfile separately
          console.log('Auth: Setting loading to false (user exists)')
          setLoading(false)
        } else {
          // No user found - set loading to false immediately
          setLoading(false)
        }
      } catch {
        setError('Failed to initialize authentication')
        // Even on error, set loading to false to prevent UI from hanging
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          // Only update state if not already cleared by manual signOut
          // This prevents race conditions with the signOut function
          setUser((currentUser) => {
            if (currentUser !== null) {
              setProfile(null)
              setRole(null)
              setLoading(false)
            }
            return null
          })
        } else if (session?.user) {
          console.log('Auth: Auth state change - user signed in:', session.user.id, session.user.email)
          const authUser = transformUser(session.user)
          setUser(authUser)

          // Start profile fetch but don't wait for it to complete
          fetchUserProfile(session.user.id, session.user.email).catch((error) => {
            console.error('Auth: Profile fetch failed during auth state change:', error)
            // Set default role if profile fetch fails
            setRole('parent')
          })
          // Set loading to false immediately since we have a user
          // Profile fetch will handle isLoadingProfile separately
          console.log('Auth: Setting loading to false (auth state change)')
          setLoading(false)
        } else {
          // No session/user - this is a non-authenticated state
          setUser(null)
          setProfile(null)
          setRole(null)
          setLoading(false) // Non-authenticated users shouldn't see loading
        }
        router.refresh()
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const signIn = async ({ email, password, redirectTo }: LoginCredentials) => {
    try {
      setLoading(true)
      setError(null)

      console.log('Attempting login for:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Login response:', { data, error })

      if (error) {
        console.error('Login error:', error)
        throw error
      }

      console.log('Login successful, redirecting...')
      // Redirect to specified path or default to dashboard
      const redirectPath = redirectTo || '/dashboard'
      router.push(redirectPath)
    } catch (err) {
      console.error('Login catch error:', err)
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
          } else {
            console.log('Assigned default parent role to new user:', data.user.id);
          }
        } catch (roleError) {
          console.error('Error assigning default role:', roleError);
          // Continue anyway - user will get default role from fetchUserProfile
        }

        // Send account created email (for users with no swimmers enrolled yet)
        try {
          await emailService.sendAccountCreated({
            parentEmail: email,
            parentName: name || 'there',
          })
        } catch (emailError) {
          console.error('Failed to send account created email:', emailError)
          // Don't fail signup if email fails
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

          console.log('Attempting to auto-link swimmers for new user:', data.user.email);

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
            const result = await response.json();
            console.log('Auto-link result:', result);
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