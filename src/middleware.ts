import { createServerClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type Cookie = {
  name: string
  value: string
  options: CookieOptions
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Cookie[]) {
          // Write updated cookies back onto the request so downstream reads see them
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Re-create the response with the updated request and set cookies on it
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Protected routes
  const protectedRoutes = ['/dashboard', '/settings', '/profile', '/parent', '/admin', '/instructor', '/coordinator', '/staff-mode']
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

  // Allow /claim routes for all users (authenticated or not)
  // These routes handle their own authentication logic
  if (pathname.startsWith('/claim')) {
    return supabaseResponse
  }

  // If no user or not a protected route that needs role checking, return early
  if (!user || (!pathname.startsWith('/parent') &&
                !pathname.startsWith('/admin') &&
                !pathname.startsWith('/instructor') &&
                !pathname.startsWith('/coordinator') &&
                !pathname.startsWith('/staff-mode') &&
                pathname !== '/dashboard')) {
    return supabaseResponse
  }

  // Fetch user roles once and cache for this request
  let userRoles: string[] = []

  // Only fetch roles if we need them
  if (user && (pathname.startsWith('/parent') ||
               pathname.startsWith('/admin') ||
               pathname.startsWith('/instructor') ||
               pathname.startsWith('/coordinator') ||
               pathname.startsWith('/staff-mode') ||
               pathname === '/dashboard')) {

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    userRoles = roles?.map(r => r.role) || []
  }

  // Check role-based access for parent routes
  if (pathname.startsWith('/parent') && !userRoles.includes('parent')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // Check role-based access for admin routes
  if (pathname.startsWith('/admin') && !userRoles.includes('admin')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // Check role-based access for instructor routes
  if (pathname.startsWith('/instructor') && !userRoles.includes('instructor') && !userRoles.includes('admin')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // Check role-based access for coordinator routes
  if (pathname.startsWith('/coordinator') && !userRoles.includes('coordinator') && !userRoles.includes('admin')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // Check role-based access for staff mode routes
  if (pathname.startsWith('/staff-mode') && !userRoles.includes('instructor') && !userRoles.includes('admin')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // Check role-based access for dashboard route
  if (pathname === '/dashboard') {
    const hasValidRole = userRoles.some(r => ['parent', 'instructor', 'admin', 'coordinator'].includes(r))
    if (!hasValidRole) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return supabaseResponse
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
    '/staff-mode/:path*',
    '/claim/:path*',
    '/login',
    '/signup',
    '/reset-password',
    '/forgot-password',
    '/api/:path*',
  ],
}
