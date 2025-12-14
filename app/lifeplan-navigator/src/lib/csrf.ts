import { headers } from 'next/headers'
import crypto from 'crypto'

export const CSRF_TOKEN_HEADER = 'X-CSRF-Token'
export const CSRF_COOKIE_NAME = '__Host-csrf-token'

/**
 * Generate a cryptographically secure CSRF token
 * @returns A 64-character hex string
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Get CSRF token from request headers (Server Component)
 * @returns The CSRF token or null if not present
 */
export function getCsrfToken(): string | null {
  const headersList = headers()
  return headersList.get(CSRF_TOKEN_HEADER)
}

/**
 * Validate that two tokens match using constant-time comparison
 * @param token1 First token
 * @param token2 Second token
 * @returns true if tokens match
 */
export function validateCsrfToken(token1: string, token2: string): boolean {
  if (!token1 || !token2) {
    return false
  }

  if (token1.length !== token2.length) {
    return false
  }

  return crypto.timingSafeEqual(
    Buffer.from(token1, 'utf8'),
    Buffer.from(token2, 'utf8')
  )
}
