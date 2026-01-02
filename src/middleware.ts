import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware: running for path:', request.nextUrl.pathname)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const { pathname } = request.nextUrl

  // Protected routes
  const protectedRoutes = ['/dashboard', '/settings', '/profile', '/parent', '/admin', '/instructor', '/coordinator']
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Auth routes
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.includes(pathname)

  // Get user session (only once)
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users from auth routes
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If no user or not a protected route that needs role checking, return early
  if (!user || (!pathname.startsWith('/parent') &&
                !pathname.startsWith('/admin') &&
                !pathname.startsWith('/instructor') &&
                !pathname.startsWith('/coordinator') &&
                pathname !== '/dashboard')) {
    return response
  }

  // Fetch user roles once and cache for this request
  let userRoles: string[] = []

  // Only fetch roles if we need them
  if (user && (pathname.startsWith('/parent') ||
               pathname.startsWith('/admin') ||
               pathname.startsWith('/instructor') ||
               pathname.startsWith('/coordinator') ||
               pathname === '/dashboard')) {

    if (process.env.NODE_ENV === 'development') {
      console.log('Middleware: fetching roles for user:', user.id)
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    userRoles = roles?.map(r => r.role) || []

    if (process.env.NODE_ENV === 'development') {
      console.log('Middleware: user roles:', userRoles)
    }
  }

  // Check role-based access for parent routes
  if (pathname.startsWith('/parent')) {
    const hasParentRole = userRoles.includes('parent')
    if (!hasParentRole) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware: user does not have parent role, redirecting to unauthorized')
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Check role-based access for admin routes
  if (pathname.startsWith('/admin')) {
    const hasAdminRole = userRoles.includes('admin')
    if (!hasAdminRole) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware: user does not have admin role, redirecting to unauthorized')
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Check role-based access for instructor routes
  if (pathname.startsWith('/instructor')) {
    const hasInstructorRole = userRoles.includes('instructor') || userRoles.includes('admin')
    if (!hasInstructorRole) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware: user does not have instructor or admin role, redirecting to unauthorized')
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Check role-based access for coordinator routes
  if (pathname.startsWith('/coordinator')) {
    const hasCoordinatorRole = userRoles.includes('coordinator') || userRoles.includes('admin')
    if (!hasCoordinatorRole) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware: user does not have coordinator or admin role, redirecting to unauthorized')
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Check role-based access for dashboard route
  if (pathname === '/dashboard') {
    const hasValidRole = userRoles.some(role =>
      role === 'parent' ||
      role === 'instructor' ||
      role === 'admin' ||
      role === 'coordinator'
    )
    if (!hasValidRole) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware: user does not have any valid role, redirecting to unauthorized')
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
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