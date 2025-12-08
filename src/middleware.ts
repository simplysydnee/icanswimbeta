import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('Middleware: running for path:', request.nextUrl.pathname)

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session if expired
  await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes
  const protectedRoutes = ['/dashboard', '/settings', '/profile', '/parent']
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Auth routes
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.includes(pathname)

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check role-based access for parent routes
  if (pathname.startsWith('/parent') && user) {
    console.log('Middleware: checking role for parent route, user:', user.id)
    // Fetch user role from user_roles table (profiles table doesn't have role column)
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    console.log('Middleware: roles fetched:', roles)

    // Check if user has parent role (users can have multiple roles)
    const hasParentRole = roles?.some(role => role.role === 'parent')

    // Redirect if user doesn't have parent role
    if (!hasParentRole) {
      console.log('Middleware: user does not have parent role, redirecting to unauthorized')
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    console.log('Middleware: user has parent role, allowing access')
  }

  // Check role-based access for admin routes
  if (pathname.startsWith('/admin') && user) {
    console.log('Middleware: checking role for admin route, user:', user.id)
    // Fetch user role from user_roles table
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    console.log('Middleware: roles fetched for admin check:', roles)

    // Check if user has admin role
    const hasAdminRole = roles?.some(role => role.role === 'admin')

    // Redirect if user doesn't have admin role
    if (!hasAdminRole) {
      console.log('Middleware: user does not have admin role, redirecting to unauthorized')
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    console.log('Middleware: user has admin role, allowing access')
  }

  // Check role-based access for instructor routes
  if (pathname.startsWith('/instructor') && user) {
    console.log('Middleware: checking role for instructor route, user:', user.id)
    // Fetch user role from user_roles table
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    console.log('Middleware: roles fetched for instructor check:', roles)

    // Check if user has instructor or admin role
    const hasInstructorRole = roles?.some(role => role.role === 'instructor' || role.role === 'admin')

    // Redirect if user doesn't have instructor or admin role
    if (!hasInstructorRole) {
      console.log('Middleware: user does not have instructor or admin role, redirecting to unauthorized')
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    console.log('Middleware: user has instructor or admin role, allowing access')
  }

  // Check role-based access for coordinator routes
  if (pathname.startsWith('/coordinator') && user) {
    console.log('Middleware: checking role for coordinator route, user:', user.id)
    // Fetch user role from user_roles table
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    console.log('Middleware: roles fetched for coordinator check:', roles)

    // Check if user has vmrc_coordinator or admin role
    const hasCoordinatorRole = roles?.some(role => role.role === 'vmrc_coordinator' || role.role === 'admin')

    // Redirect if user doesn't have vmrc_coordinator or admin role
    if (!hasCoordinatorRole) {
      console.log('Middleware: user does not have vmrc_coordinator or admin role, redirecting to unauthorized')
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    console.log('Middleware: user has vmrc_coordinator or admin role, allowing access')
  }

  // Redirect authenticated users from auth routes
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/parent/:path*',
    '/admin/:path*',
    '/instructor/:path*',
    '/coordinator/:path*',
    '/login',
    '/signup',
  ],
}