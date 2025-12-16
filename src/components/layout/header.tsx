'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navigation } from './navigation';
import { UserMenu } from '@/components/auth/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Loader2 } from 'lucide-react';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { user, loading, signOut, signIn, signInWithGoogle } = useAuth();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginData.email || !loginData.password) {
      setLoginError('Please fill in all fields');
      return;
    }

    setIsLoggingIn(true);
    try {
      await signIn(loginData);
      setIsLoginOpen(false);
      setLoginData({ email: '', password: '' });
    } catch (error) {
      setLoginError('Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
      setIsLoginOpen(false);
    } catch (error) {
      setLoginError('Google login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex flex-col items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-1">
              I Can Swim
            </h1>
            <div className="w-32">
              <svg
                viewBox="0 0 120 8"
                fill="none"
                className="w-full h-2"
                preserveAspectRatio="none"
              >
                <mask id="headerTaperMask">
                  <linearGradient id="headerTaperGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="white" stopOpacity="0" />
                    <stop offset="15%" stopColor="white" stopOpacity="1" />
                    <stop offset="85%" stopColor="white" stopOpacity="1" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                  <rect x="0" y="0" width="120" height="8" fill="url(#headerTaperGradient)" />
                </mask>
                <path
                  d="M0,4 C20,1 40,1 60,4 C80,7 100,7 120,4"
                  stroke="url(#headerWaveGradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  mask="url(#headerTaperMask)"
                />
                <defs>
                  <linearGradient id="headerWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2a5e84" />
                    <stop offset="100%" stopColor="#23a1c0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {!loading && (
            user ? (
              <>
                <Button variant="outline" onClick={() => signOut()}>
                  Sign Out
                </Button>
                <UserMenu />
              </>
            ) : (
              <>
                <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Login</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <div className="space-y-4">
                      <div>
                        <DialogTitle className="text-2xl font-bold">Welcome back</DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Sign in to your I Can Swim account
                        </p>
                      </div>

                      {loginError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                          {loginError}
                        </div>
                      )}

                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={loginData.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoggingIn}>
                          {isLoggingIn ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            'Sign in'
                          )}
                        </Button>
                      </form>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-gray-500">Or continue with</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleGoogleLogin}
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          'Google'
                        )}
                      </Button>

                      <div className="text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Button variant="link" className="p-0 h-auto" asChild>
                          <Link href="/signup">Sign up</Link>
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <div className="flex flex-col space-y-4 mt-4">
              <Navigation />
              <div className="border-t pt-4 space-y-2">
                {!loading && (
                  user ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">{user.fullName || user.email}</div>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link href="/dashboard">Dashboard</Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link href="/settings">Settings</Link>
                        </Button>
                      </div>
                      <div className="border-t pt-4">
                        <Button variant="outline" className="w-full" onClick={() => signOut()}>
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" className="w-full justify-start">
                            Sign In
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <div className="space-y-4">
                            <div>
                              <DialogTitle className="text-2xl font-bold">Welcome back</DialogTitle>
                              <p className="text-sm text-gray-500 mt-1">
                                Sign in to your I Can Swim account
                              </p>
                            </div>

                            {loginError && (
                              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                                {loginError}
                              </div>
                            )}

                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="mobile-email">Email</Label>
                                <Input
                                  id="mobile-email"
                                  name="email"
                                  type="email"
                                  placeholder="you@example.com"
                                  value={loginData.email}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="mobile-password">Password</Label>
                                <Input
                                  id="mobile-password"
                                  name="password"
                                  type="password"
                                  placeholder="••••••••"
                                  value={loginData.password}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>
                              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                                {isLoggingIn ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                  </>
                                ) : (
                                  'Sign in'
                                )}
                              </Button>
                            </form>

                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t"></div>
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-gray-500">Or continue with</span>
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={handleGoogleLogin}
                              disabled={isLoggingIn}
                            >
                              {isLoggingIn ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Connecting...
                                </>
                              ) : (
                                'Google'
                              )}
                            </Button>

                            <div className="text-center text-sm text-gray-500">
                              Don't have an account?{' '}
                              <Button variant="link" className="p-0 h-auto" asChild>
                                <Link href="/signup">Sign up</Link>
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button className="w-full" asChild>
                        <Link href="/signup">Get Started</Link>
                      </Button>
                    </>
                  )
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}