import { NextRequest, NextResponse } from 'next/server'

const encoder = new TextEncoder()

async function verifySessionCookie(raw: string): Promise<{ role: string } | null> {
  const dotIdx = raw.lastIndexOf('.')
  if (dotIdx === -1) return null
  const payload = raw.slice(0, dotIdx)
  const signature = raw.slice(dotIdx + 1)

  const secret = process.env.SESSION_SECRET
  if (!secret) return null

  // Compute HMAC-SHA256 using Web Crypto API (Edge Runtime compatible)
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time comparison
  if (expected.length !== signature.length) return null
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  if (mismatch !== 0) return null

  try {
    return JSON.parse(payload)
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const sessionRaw = request.cookies.get('clinic_session')?.value
  if (!sessionRaw) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const session = await verifySessionCookie(sessionRaw)
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const path = request.nextUrl.pathname
  const role = session.role

  // Role-based route protection
  if (path.startsWith('/doctor') && role !== 'doctor') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (path.startsWith('/receptionist') && role !== 'receptionist') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (path.startsWith('/clinic-admin') && role !== 'clinic_admin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/doctor/:path*',
    '/receptionist/:path*',
    '/clinic-admin/:path*',
    '/settings/:path*',
    '/settings',
  ],
}
