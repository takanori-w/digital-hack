/**
 * MFA Service - Time-based One-Time Password (TOTP)
 *
 * Implements:
 * - TOTP generation and verification (RFC 6238)
 * - QR code generation for authenticator apps
 * - Backup codes for recovery
 *
 * Security Compliance:
 * - SEC-010: MFA implementation requirement
 * - CISO Design: speakeasy TOTP support
 *
 * Compatible authenticator apps:
 * - Google Authenticator
 * - Microsoft Authenticator
 * - Authy
 */

import crypto from 'crypto';

// TOTP configuration
const TOTP_CONFIG = {
  issuer: 'LifePlan Navigator',
  algorithm: 'sha1', // Standard for compatibility
  digits: 6,
  period: 30, // seconds
  window: 1, // Allow 1 period before/after for clock drift
};

// Base32 alphabet for secret encoding
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generate a cryptographically secure secret for TOTP
 */
export function generateSecret(): string {
  const buffer = crypto.randomBytes(20);
  let secret = '';

  for (let i = 0; i < buffer.length; i++) {
    const index = buffer[i] % 32;
    secret += BASE32_ALPHABET[index];
  }

  return secret;
}

/**
 * Decode Base32 string to buffer
 */
function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bits = cleaned
    .split('')
    .map((char) => {
      const index = BASE32_ALPHABET.indexOf(char);
      return index.toString(2).padStart(5, '0');
    })
    .join('');

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

/**
 * Generate TOTP code for a given time
 */
function generateTOTP(secret: string, time: number): string {
  const secretBuffer = base32Decode(secret);

  // Calculate counter (number of 30-second periods since epoch)
  const counter = Math.floor(time / TOTP_CONFIG.period);

  // Convert counter to 8-byte buffer (big endian)
  const counterBuffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = counter & 0xff;
    // eslint-disable-next-line no-param-reassign
    time = Math.floor(counter / 256);
  }

  // Create HMAC-SHA1
  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  // Get last 6 digits
  const otp = binary % Math.pow(10, TOTP_CONFIG.digits);

  return otp.toString().padStart(TOTP_CONFIG.digits, '0');
}

/**
 * Verify TOTP code with time window tolerance
 */
export function verifyTOTP(secret: string, token: string): boolean {
  if (!token || token.length !== TOTP_CONFIG.digits) {
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);

  // Check current time and allowed window
  for (let i = -TOTP_CONFIG.window; i <= TOTP_CONFIG.window; i++) {
    const checkTime = currentTime + i * TOTP_CONFIG.period;
    const expectedToken = generateTOTP(secret, checkTime);

    // Constant-time comparison
    if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
      return true;
    }
  }

  return false;
}

/**
 * Generate current TOTP code (for testing)
 */
export function getCurrentTOTP(secret: string): string {
  const currentTime = Math.floor(Date.now() / 1000);
  return generateTOTP(secret, currentTime);
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX for readability
    codes.push(`${code.substring(0, 4)}-${code.substring(4)}`);
  }

  return codes;
}

/**
 * Hash backup codes for storage
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map((code) => {
    const normalized = code.replace(/-/g, '').toUpperCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  });
}

/**
 * Verify backup code
 */
export function verifyBackupCode(inputCode: string, hashedCodes: string[]): number {
  const normalized = inputCode.replace(/-/g, '').toUpperCase();
  const inputHash = crypto.createHash('sha256').update(normalized).digest('hex');

  for (let i = 0; i < hashedCodes.length; i++) {
    if (crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hashedCodes[i]))) {
      return i; // Return index of matched code
    }
  }

  return -1; // Not found
}

/**
 * Generate otpauth:// URL for authenticator app setup
 */
export function generateOtpauthUrl(
  secret: string,
  userEmail: string,
  issuer: string = TOTP_CONFIG.issuer
): string {
  const label = encodeURIComponent(`${issuer}:${userEmail}`);
  const params = new URLSearchParams({
    secret,
    issuer: encodeURIComponent(issuer),
    algorithm: TOTP_CONFIG.algorithm.toUpperCase(),
    digits: TOTP_CONFIG.digits.toString(),
    period: TOTP_CONFIG.period.toString(),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * MFA setup response for client
 */
export interface MfaSetupResponse {
  secret: string;
  otpauthUrl: string;
  backupCodes: string[];
}

/**
 * Setup MFA for a user
 */
export function setupMfa(userEmail: string): MfaSetupResponse {
  const secret = generateSecret();
  const otpauthUrl = generateOtpauthUrl(secret, userEmail);
  const backupCodes = generateBackupCodes(10);

  return {
    secret,
    otpauthUrl,
    backupCodes,
  };
}
