/**
 * Next.js Middleware
 *
 * Combines:
 * 1. NextAuth.js session validation for protected routes
 * 2. CSRF validation (Synchronizer Token Pattern) for state-changing requests
 * 3. Security headers for all responses
 *
 * Security Compliance:
 * - SEC-001: Session-based authentication
 * - SEC-002: CSRF protection
 * - SEC-003: Security headers (OWASP recommendations)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { CSRF_COOKIE_NAME, CSRF_TOKEN_HEADER, validateCsrfToken } from '@/lib/csrf';

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/financial',
  '/benefits',
  '/onboarding',
];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

// API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth', // NextAuth.js routes
  '/api/csrf-token',
  '/api/health',
  '/api/onboarding', // Onboarding API (anonymous users allowed)
  '/api/settings', // Settings API (needed during onboarding)
];

/**
 * Check if path matches any patterns
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('*')) {
      return pathname.startsWith(pattern.slice(0, -1));
    }
    return pathname === pattern || pathname.startsWith(pattern + '/');
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get NextAuth.js session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const response = NextResponse.next();

  // --- Route Protection ---

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && matchesPath(pathname, AUTH_ROUTES)) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && matchesPath(pathname, PROTECTED_ROUTES)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check API route authentication (except public routes)
  if (pathname.startsWith('/api/') && !matchesPath(pathname, PUBLIC_API_ROUTES)) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
  }

  // --- CSRF Validation ---

  if (STATE_CHANGING_METHODS.includes(request.method)) {
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const headerToken = request.headers.get(CSRF_TOKEN_HEADER);

    // Skip CSRF validation for specific routes
    const isApiRoute = pathname.startsWith('/api/');
    const isExternalApiCall = pathname.startsWith('/api/external/');
    const isCsrfTokenEndpoint = pathname === '/api/csrf-token';
    const isNextAuthRoute = pathname.startsWith('/api/auth/');

    // NextAuth.js handles its own CSRF protection
    if (!isExternalApiCall && !isCsrfTokenEndpoint && !isNextAuthRoute && isApiRoute) {
      if (!cookieToken || !headerToken || !validateCsrfToken(cookieToken, headerToken)) {
        return NextResponse.json(
          { error: 'CSRF token validation failed' },
          { status: 403 }
        );
      }
    }
  }

  // --- Security Headers ---

  // OWASP recommended security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Content Security Policy (strict mode)
  // Note: Adjust as needed for your CDN/external resources
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js dev mode
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // HSTS header (enable in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
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
};
