import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const role  = req.nextauth.token?.role as string
    const path  = req.nextUrl.pathname

    if ((path.startsWith('/queue') || path.startsWith('/team') || path.startsWith('/dashboards')) && role !== 'manager' && role !== 'admin')
      return NextResponse.redirect(new URL('/reviews', req.url))

    if (path.startsWith('/admin') && role !== 'admin')
      return NextResponse.redirect(new URL('/reviews', req.url))
  },
  { callbacks: { authorized: ({ token }) => !!token } }
)

export const config = {
  matcher: [
    '/reviews/:path*',
    '/training/:path*',
    '/library/:path*',
    '/queue/:path*',
    '/team/:path*',
    '/dashboards/:path*',
  ],
}
