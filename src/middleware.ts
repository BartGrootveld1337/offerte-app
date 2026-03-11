import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // Add CORS headers for v1 API
  if (req.nextUrl.pathname.startsWith('/api/v1/')) {
    const res = NextResponse.next()
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/v1/:path*',
}
