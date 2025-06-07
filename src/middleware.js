// Middleware temporarily disabled for testing
// Uncomment the code below to enable authentication protection


import { withAuth } from "next-auth/middleware"

export default withAuth(
    function middleware(req) {
        // Add any additional middleware logic here
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token
        },
    }
)

// Protect these routes
export const config = {
    matcher: [
        // Match all request paths except for the ones starting with:
        // - api/auth (authentication routes)
        // - _next/static (static files)
        // - _next/image (image optimization files)
        // - favicon.ico (favicon file)
        // - auth/* (authentication pages)
        '/((?!api/auth|_next/static|_next/image|favicon.ico|auth).*)',
    ]
}

