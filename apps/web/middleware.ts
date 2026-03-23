import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionRaw = request.cookies.get('clinic_session')?.value
  if (!sessionRaw) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let session: { role: string }
  try {
    session = JSON.parse(sessionRaw)
  } catch {
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
