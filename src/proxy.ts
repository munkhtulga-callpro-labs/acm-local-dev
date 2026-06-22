import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/access/:path*',
    '/approvals/:path*',
    '/audit-logs/:path*',
    '/companies/:path*',
    '/departments/:path*',
    '/employees/:path*',
    '/resources/:path*',
    '/systems/:path*',
    '/settings/:path*',
  ]
}
