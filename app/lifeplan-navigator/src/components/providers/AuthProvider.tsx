/**
 * Authentication Provider Component
 *
 * Provides session context to the application using NextAuth.js SessionProvider.
 * Wraps the application to enable:
 * - useSession hook access
 * - Automatic session refresh
 * - Client-side authentication state
 *
 * Usage:
 * Wrap your layout with <AuthProvider> in src/app/layout.tsx
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      // Refresh session every 5 minutes while window is focused
      refetchInterval={5 * 60}
      // Disable refetch on window focus for better performance
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}

export default AuthProvider;
