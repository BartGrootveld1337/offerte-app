import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that require authentication (redirect to login if not authenticated)
const PROTECTED_ROUTES = [
  '/dashboard',
  '/quotes',
  '/clients',
  '/catalog',
  '/settings',
  '/invoices',
  '/onboarding',
  '/api-docs',
]

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const res = NextResponse.next()

  // CVE-006: Add CORS headers for v1 API
  if (pathname.startsWith('/api/v1/')) {
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res
  }

  // CVE-007: Protect authenticated routes at middleware level (defense in depth)
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  if (isProtected || isAuthRoute) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) return res

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    if (isProtected && !user) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/api/v1/:path*',
    '/dashboard/:path*',
    '/quotes/:path*',
    '/clients/:path*',
    '/catalog/:path*',
    '/settings/:path*',
    '/invoices/:path*',
    '/onboarding/:path*',
    '/api-docs/:path*',
    '/login',
  ],
}
