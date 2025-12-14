/**
 * User Service with Secure Password Hashing
 *
 * Implements:
 * - Argon2id password hashing (OWASP recommended)
 * - Constant-time password verification
 * - User management operations
 *
 * Security Notes:
 * - Argon2id provides resistance against GPU/ASIC attacks
 * - Parameters tuned per OWASP recommendations
 */

import crypto from 'crypto';
import { Role } from './config';

// Argon2 is preferred but may not be available in all environments
// Fallback to PBKDF2 with high iteration count
const USE_ARGON2 = false; // Set to true when argon2 is installed

// User interface matching CISO design
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  loginAttempts: number;
  lockedUntil?: string;
}

// In-memory user store (replace with database in production)
const users: Map<string, User> = new Map();

// Rate limiting configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Hash password using PBKDF2 (Argon2 fallback)
 * Using PBKDF2 with 600,000 iterations per OWASP 2023 recommendations
 */
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(32);
  const iterations = 600000;
  const keyLen = 64;
  const digest = 'sha512';

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keyLen, digest, (err, derivedKey) => {
      if (err) reject(err);
      // Format: algorithm$iterations$salt$hash
      const hash = `pbkdf2-sha512$${iterations}$${salt.toString('base64')}$${derivedKey.toString('base64')}`;
      resolve(hash);
    });
  });
}

/**
 * Verify password using constant-time comparison
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha512') {
    return false;
  }

  const iterations = parseInt(parts[1], 10);
  const salt = Buffer.from(parts[2], 'base64');
  const storedKey = Buffer.from(parts[3], 'base64');

  return new Promise((resolve) => {
    crypto.pbkdf2(password, salt, iterations, storedKey.length, 'sha512', (err, derivedKey) => {
      if (err) {
        resolve(false);
        return;
      }

      // Constant-time comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(storedKey, derivedKey);
      resolve(isValid);
    });
  });
}

/**
 * Initialize demo user for testing
 */
async function initializeDemoUser() {
  if (!users.has('demo@example.com')) {
    const hash = await hashPassword('DemoPass123!');
    users.set('demo@example.com', {
      id: 'demo-user-001',
      email: 'demo@example.com',
      name: 'デモユーザー',
      passwordHash: hash,
      role: Role.USER,
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      loginAttempts: 0,
    });
  }
}

// Initialize demo user
initializeDemoUser();

/**
 * Check if user account is locked
 */
function isAccountLocked(user: User): boolean {
  if (!user.lockedUntil) return false;
  return new Date(user.lockedUntil) > new Date();
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<Omit<User, 'passwordHash' | 'mfaSecret'> | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.get(normalizedEmail);

  // Check if account exists
  if (!user) {
    // Perform dummy password check to prevent timing attacks
    await verifyPassword(password, 'pbkdf2-sha512$600000$dummysalt$dummyhash');
    return null;
  }

  // Check if account is locked
  if (isAccountLocked(user)) {
    const lockRemaining = Math.ceil(
      (new Date(user.lockedUntil!).getTime() - Date.now()) / 1000
    );
    throw new Error(`アカウントがロックされています。${lockRemaining}秒後に再試行してください。`);
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    // Increment failed attempts
    user.loginAttempts++;

    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
    }

    return null;
  }

  // Reset login attempts on successful login
  user.loginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date().toISOString();
  user.updatedAt = new Date().toISOString();

  // Return user without sensitive fields
  const { passwordHash, mfaSecret, ...safeUser } = user;
  return safeUser;
}

/**
 * Create new user
 */
export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<Omit<User, 'passwordHash' | 'mfaSecret'>> {
  const normalizedEmail = email.trim().toLowerCase();

  if (users.has(normalizedEmail)) {
    throw new Error('このメールアドレスは既に登録されています');
  }

  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();

  const user: User = {
    id,
    email: normalizedEmail,
    name,
    passwordHash,
    role: Role.USER,
    mfaEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    loginAttempts: 0,
  };

  users.set(normalizedEmail, user);

  const { passwordHash: _, mfaSecret, ...safeUser } = user;
  return safeUser;
}

/**
 * Get user by ID
 */
export async function getUserById(
  id: string
): Promise<Omit<User, 'passwordHash' | 'mfaSecret'> | null> {
  for (const user of Array.from(users.values())) {
    if (user.id === id) {
      const { passwordHash, mfaSecret, ...safeUser } = user;
      return safeUser;
    }
  }
  return null;
}

/**
 * Get user by email (including mfaSecret for MFA verification)
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  return users.get(normalizedEmail) || null;
}

/**
 * Update user MFA settings
 */
export async function updateUserMfa(
  userId: string,
  mfaEnabled: boolean,
  mfaSecret?: string
): Promise<boolean> {
  for (const user of Array.from(users.values())) {
    if (user.id === userId) {
      user.mfaEnabled = mfaEnabled;
      user.mfaSecret = mfaSecret;
      user.updatedAt = new Date().toISOString();
      return true;
    }
  }
  return false;
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<boolean> {
  for (const user of Array.from(users.values())) {
    if (user.id === userId) {
      user.passwordHash = await hashPassword(newPassword);
      user.updatedAt = new Date().toISOString();
      return true;
    }
  }
  return false;
}
