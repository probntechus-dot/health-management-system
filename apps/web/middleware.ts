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

  if (path.startsWith('/doctor') && session.role !== 'doctor') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (path.startsWith('/receptionist') && session.role !== 'receptionist') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/doctor/:path*', '/receptionist/:path*', '/settings'],
}
