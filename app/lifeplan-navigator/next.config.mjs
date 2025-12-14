/** @type {import('next').NextConfig} */

// Environment-based CSP configuration (VER-002, VER-003)
const isDevelopment = process.env.NODE_ENV === 'development'

// Script-src: Development allows unsafe-inline/unsafe-eval for hot reload
// Production uses strict mode for XSS protection
const scriptSrc = isDevelopment
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self'"

// Connect-src: Development allows localhost, production only allows API domain
const connectSrc = isDevelopment
  ? "connect-src 'self' http://localhost:8000 https://api.lifeplan-navigator.jp"
  : "connect-src 'self' https://api.lifeplan-navigator.jp"

const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              connectSrc,
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

export default nextConfig
