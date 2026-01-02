'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function SignupForm() {
  const searchParams = useSearchParams()
  const { signUp, signInWithGoogle, loading, error } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    termsAccepted: false,
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isFromReferral, setIsFromReferral] = useState(false)
  const [childName, setChildName] = useState('')
  const [redirectUrl, setRedirectUrl] = useState('')
  const [emailParam, setEmailParam] = useState('')

  useEffect(() => {
    const emailParamValue = searchParams.get('email')
    const childParam = searchParams.get('child')
    const redirectParam = searchParams.get('redirect')

    if (emailParamValue) {
      const decodedEmail = decodeURIComponent(emailParamValue)
      setEmailParam(decodedEmail)
      setFormData(prev => ({ ...prev, email: decodedEmail }))
      // Only set as referral if there's also a child parameter
      // This allows email pre-fill without locking the field
      setIsFromReferral(!!childParam)
    }
    if (childParam) {
      setChildName(decodeURIComponent(childParam))
      // If there's a child parameter, it's definitely a referral
      setIsFromReferral(true)
    }
    if (redirectParam) {
      setRedirectUrl(decodeURIComponent(redirectParam))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Basic validation
    if (!formData.email || !formData.password || !formData.fullName) {
      setFormError('Please fill in all required fields')
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

    if (!formData.termsAccepted) {
      setFormError('You must accept the terms and conditions')
      return
    }

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        phone: formData.phone,
        confirm_password: formData.confirmPassword,
        terms_accepted: formData.termsAccepted,
        redirect_url: redirectUrl || (isFromReferral ? '/dashboard' : undefined),
      })
    } catch {
      // Error is handled by AuthContext
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch {
      // Error is handled by AuthContext
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          {isFromReferral
            ? `Sign up to complete enrollment for ${childName}`
            : 'Enter your information to create your account'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isFromReferral && (
          <div className="mb-6 p-4 bg-[#2a5e84]/10 border border-[#2a5e84]/20 rounded-lg">
            <p className="text-[#2a5e84] font-medium text-sm">
              🏊 Welcome! You're signing up to complete enrollment for {childName}.
            </p>
            <p className="text-xs text-gray-600 mt-1">
              After signing up, you'll be able to complete the enrollment form.
            </p>
          </div>
        )}

        {emailParam && !isFromReferral && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Create an account to continue. Your email has been pre-filled.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading || isFromReferral}
              readOnly={isFromReferral}
              className={isFromReferral ? 'bg-gray-50 cursor-not-allowed' : ''}
              required
            />
            {isFromReferral && (
              <p className="text-xs text-gray-500 mt-1">
                This email is linked to your referral and cannot be changed.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(209) 555-1234"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              showStrength={true}
              showRequirements={true}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="termsAccepted"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, termsAccepted: checked === true }))
              }
              disabled={loading}
            />
            <Label 
              htmlFor="termsAccepted" 
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>
          
          {(error || formError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {formError || error}
              </AlertDescription>
            </Alert>
          )}

          <LoadingButton
            type="submit"
            variant="default"
            className="w-full"
            loading={loading}
            loadingText="Creating account..."
          >
            Create Account
          </LoadingButton>

          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link
              href={`/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}${emailParam ? `${redirectUrl ? '&' : '?'}email=${encodeURIComponent(emailParam)}` : ''}${childName ? `${(redirectUrl || emailParam) ? '&' : '?'}child=${encodeURIComponent(childName)}` : ''}`}
              className="text-primary hover:underline"
            >
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}