import { NextRequest, NextResponse } from 'next/server'
import { generateCsrfToken, CSRF_COOKIE_NAME } from '@/lib/csrf'

/**
 * CSRF Token API Endpoint
 *
 * Implements Synchronizer Token Pattern:
 * 1. Generates a cryptographically secure token
 * 2. Stores token in httpOnly cookie (for server-side validation)
 * 3. Returns token in response body (for client to attach to headers)
 *
 * This approach maintains httpOnly: true for XSS protection
 * while allowing the client to send the token in request headers.
 */
export async function GET(request: NextRequest) {
  // Check if token already exists in cookie
  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value

  // Use existing token or generate new one
  const token = existingToken || generateCsrfToken()

  const response = NextResponse.json({ csrfToken: token })

  // Set/refresh the httpOnly cookie with the token
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })

  // Add cache control to prevent caching of tokens
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')

  return response
}
