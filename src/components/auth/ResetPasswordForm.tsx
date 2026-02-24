'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordForm() {
  const { updatePassword, loading, error } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState<boolean | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        console.log('ResetPasswordForm: Checking auth state...');

        // Check current session first
        const { data: { session } } = await supabase.auth.getSession()
        console.log('ResetPasswordForm: Session exists?', !!session);

        if (session) {
          console.log('ResetPasswordForm: Session found, token valid');
          setValidToken(true)
          return
        }

        // Check for reset parameters in URL
        const code = searchParams.get('code')
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')

        console.log('ResetPasswordForm: URL params:', {
          code: !!code,
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          searchParams: Array.from(searchParams.entries())
        });

        // Also check URL hash for tokens (common with Supabase)
        const hash = window.location.hash.substring(1)
        const hashParams = new URLSearchParams(hash)
        const hashAccessToken = hashParams.get('access_token')
        const hashRefreshToken = hashParams.get('refresh_token')

        console.log('ResetPasswordForm: Hash params:', {
          hash,
          hashAccessToken: !!hashAccessToken,
          hashRefreshToken: !!hashRefreshToken
        });

        if (code || accessToken || refreshToken || hashAccessToken || hashRefreshToken) {
          console.log('ResetPasswordForm: Tokens found in URL, attempting to exchange...');

          // Try to exchange the code/token for a session
          if (code) {
            console.log('ResetPasswordForm: Exchanging code for session...');
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('ResetPasswordForm: Code exchange failed:', error);
              setValidToken(false);
              return;
            }
            console.log('ResetPasswordForm: Code exchange successful');
          }

          // If we have access/refresh tokens in URL, try to set the session
          if ((accessToken && refreshToken) || (hashAccessToken && hashRefreshToken)) {
            console.log('ResetPasswordForm: Setting session from URL tokens...');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken || hashAccessToken || '',
              refresh_token: refreshToken || hashRefreshToken || '',
            });
            if (error) {
              console.error('ResetPasswordForm: Set session failed:', error);
              setValidToken(false);
              return;
            }
            console.log('ResetPasswordForm: Session set successfully');
          }

          setValidToken(true)
        } else {
          console.log('ResetPasswordForm: No tokens found in URL');
          setValidToken(false)
        }
      } catch (error) {
        console.error('ResetPasswordForm: Error checking auth state:', error)
        setValidToken(false)
      }
    }

    checkAuthState()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.password || !formData.confirmPassword) {
      setFormError('Please fill in all fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long')
      return
    }

    try {
      await updatePassword(formData.password)
      setSuccess(true)
      // Redirect to dashboard after success
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch {
      // Error is handled by AuthContext
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // Show loading state while checking token validity
  if (validToken === null) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error if token is invalid
  if (!validToken) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <p>
              Password reset links expire after 1 hour. Please request a new reset link.
            </p>
          </div>
          <div className="space-y-2">
            <Link href="/forgot-password">
              <Button variant="default" className="w-full">
                Request New Reset Link
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show success message
  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Password Updated</CardTitle>
          <CardDescription>
            Your password has been successfully updated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <p>
              Redirecting you to your dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Set New Password</CardTitle>
        <CardDescription className="text-center">
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          
          {(error || formError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {formError || error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            variant="default"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating password...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}