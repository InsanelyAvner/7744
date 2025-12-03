// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Pull in your creds from env
const ADMIN_USER = process.env.ADMIN_USER
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

// Only run on /admin and everything under it
export const config = {
  matcher: ['/admin', '/admin/:path*'],
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  console.log('Middleware running on:', pathname)

  // If it’s not an /admin path, do nothing
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const authHeader = req.headers.get('authorization') || ''
  const [scheme, encoded] = authHeader.split(' ')

  // No header or wrong scheme? 401 + prompt
  if (scheme !== 'Basic' || !encoded) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' },
    })
  }

  // Decode "username:password"
  let decoded = ''
  try {
    decoded = atob(encoded)
  } catch {
    return new NextResponse('Invalid auth header', { status: 400 })
  }
  const [user, pass] = decoded.split(':', 2)

  // Wrong creds?
  if (user !== ADMIN_USER || pass !== ADMIN_PASSWORD) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' },
    })
  }

  // Authorized!
  return NextResponse.next()
}
