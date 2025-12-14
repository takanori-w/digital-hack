/**
 * NextAuth.js v5 Configuration
 *
 * Implements secure authentication with:
 * - Credentials Provider with Argon2 password hashing
 * - MFA support (TOTP)
 * - Server-side session management
 * - Role-based access control integration
 *
 * Security Compliance:
 * - SEC-010: MFA implementation
 * - COD-005: Secure session management
 * - CISO Design: NextAuth.js v5 + TOTP
 */

import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

// Session configuration following CISO design
export const SESSION_POLICY = {
  idleTimeout: 30 * 60, // 30 minutes in seconds
  absoluteTimeout: 8 * 60 * 60, // 8 hours in seconds
  maxConcurrentSessions: 3,
  requireMfaForSensitiveOps: true,
  regenerateOnEscalation: true,
};

// Role definitions following CISO design
export enum Role {
  USER = 'user',
  FAMILY_MEMBER = 'family_member',
  SUPPORT = 'support',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

// Login schema validation
const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上必要です'),
});

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_POLICY.absoluteTimeout,
    updateAge: SESSION_POLICY.idleTimeout,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: { auth: any; request: { nextUrl: URL } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnSettings = nextUrl.pathname.startsWith('/settings');
      const isOnBenefits = nextUrl.pathname.startsWith('/benefits');
      const isOnOnboarding = nextUrl.pathname.startsWith('/onboarding');
      const protectedRoutes = isOnDashboard || isOnSettings || isOnBenefits || isOnOnboarding;

      if (protectedRoutes) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      // Redirect logged-in users from login page
      if (isLoggedIn && nextUrl.pathname === '/login') {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
    jwt({ token, user, trigger, session }: { token: any; user?: any; trigger?: string; session?: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role || Role.USER;
        token.mfaEnabled = (user as any).mfaEnabled || false;
        token.mfaVerified = (user as any).mfaVerified || false;
      }

      // Handle session update (e.g., after MFA verification)
      if (trigger === 'update' && session) {
        token.mfaVerified = session.mfaVerified ?? token.mfaVerified;
      }

      return token;
    },
    session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id ?? '';
        session.user.role = token.role as Role;
        session.user.mfaEnabled = token.mfaEnabled as boolean;
        session.user.mfaVerified = token.mfaVerified as boolean;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: Record<string, unknown> | undefined) {
        // Validate input
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error('Invalid credentials format');
        }

        const { email, password } = parsed.data;

        // Import user service dynamically to avoid circular dependencies
        const { authenticateUser } = await import('./user-service');

        try {
          const user = await authenticateUser(email, password);

          if (!user) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            mfaEnabled: user.mfaEnabled,
            mfaVerified: false, // Will be set after MFA verification
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
};
