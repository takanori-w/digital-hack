import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CSRF_COOKIE_NAME, CSRF_TOKEN_HEADER, validateCsrfToken } from '@/lib/csrf'

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

/**
 * Middleware for CSRF validation (Synchronizer Token Pattern)
 *
 * Token generation is handled by /api/csrf-token endpoint.
 * This middleware only validates tokens for state-changing requests.
 *
 * Flow:
 * 1. Client calls GET /api/csrf-token to obtain token
 * 2. API sets httpOnly cookie and returns token in response body
 * 3. Client stores token in memory and sends via X-CSRF-Token header
 * 4. This middleware validates header token against httpOnly cookie
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Validate CSRF token for state-changing requests
  if (STATE_CHANGING_METHODS.includes(request.method)) {
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
    const headerToken = request.headers.get(CSRF_TOKEN_HEADER)

    // Skip CSRF validation for specific routes
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
    const isExternalApiCall = request.nextUrl.pathname.startsWith('/api/external/')
    const isCsrfTokenEndpoint = request.nextUrl.pathname === '/api/csrf-token'

    if (!isExternalApiCall && !isCsrfTokenEndpoint && isApiRoute) {
      if (!cookieToken || !headerToken || !validateCsrfToken(cookieToken, headerToken)) {
        return NextResponse.json(
          { error: 'CSRF token validation failed' },
          { status: 403 }
        )
      }
    }
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
