/**
 * NextAuth.js v5 Authentication Module
 *
 * Main export file for authentication functionality.
 * Provides:
 * - Auth handlers for API routes
 * - Session helpers for server/client
 * - Type definitions
 */

import NextAuth from 'next-auth';
import { authConfig } from './config';

// Create NextAuth instance
const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Export handlers for API routes
export { handlers, auth, signIn, signOut };

// Re-export types and utilities
export { Role, SESSION_POLICY } from './config';
export type { User } from './user-service';
export {
  authenticateUser,
  createUser,
  getUserById,
  getUserByEmail,
  updateUserMfa,
  updateUserPassword,
} from './user-service';
export {
  generateSecret,
  verifyTOTP,
  getCurrentTOTP,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  generateOtpauthUrl,
  setupMfa,
} from './mfa-service';
export type { MfaSetupResponse } from './mfa-service';
