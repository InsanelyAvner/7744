// lib/auth.ts
import { NextRequest, NextResponse } from 'next/server'

export function requireBasicAuth(request: NextRequest): NextResponse | undefined {
  const auth = request.headers.get('authorization') || ''
  const [scheme, encoded] = auth.split(' ')

  if (scheme === 'Basic' && encoded) {
    const [user, pass] = Buffer.from(encoded, 'base64')
      .toString()
      .split(':')

    if (
      user === process.env.ADMIN_USER &&
      pass === process.env.ADMIN_PASSWORD
    ) {
      return undefined  // authorised, proceed
    }
  }

  const res = new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area"',
    },
  })
  return res
}
