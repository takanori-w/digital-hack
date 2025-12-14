/**
 * NextAuth.js Type Definitions
 *
 * Extends default NextAuth types with custom fields:
 * - Role-based access control
 * - MFA status
 *
 * Reference: https://next-auth.js.org/getting-started/typescript
 */

import { Role } from '@/lib/auth/config';
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extended Session interface
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
      mfaEnabled: boolean;
      mfaVerified: boolean;
    } & DefaultSession['user'];
  }

  /**
   * Extended User interface
   */
  interface User extends DefaultUser {
    role: Role;
    mfaEnabled: boolean;
    mfaVerified: boolean;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT interface
   */
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
    mfaEnabled: boolean;
    mfaVerified: boolean;
  }
}
