/**
 * NextAuth.js API Route Handler
 *
 * Handles all authentication routes:
 * - GET/POST /api/auth/signin
 * - GET/POST /api/auth/signout
 * - GET /api/auth/session
 * - GET /api/auth/csrf
 * - GET/POST /api/auth/callback/:provider
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
