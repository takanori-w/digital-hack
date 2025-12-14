import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Mock user database (in production, use a real database)
const MOCK_USERS: Map<string, { id: string; email: string; name: string; passwordHash: string; createdAt: string }> = new Map();

// Initialize with a demo user
const demoPasswordHash = hashPassword('DemoPass123!');
MOCK_USERS.set('demo@example.com', {
  id: 'demo-user-001',
  email: 'demo@example.com',
  name: 'デモユーザー',
  passwordHash: demoPasswordHash,
  createdAt: new Date().toISOString(),
});

/**
 * Simple password hashing (in production, use argon2 or bcrypt)
 */
function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password + process.env.PASSWORD_SALT || 'default-salt-change-in-production')
    .digest('hex');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Rate limiting state (in production, use Redis)
 */
const loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);

  if (!attempts) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true };
  }

  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true };
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((LOCKOUT_DURATION - (now - attempts.lastAttempt)) / 1000);
    return { allowed: false, retryAfter };
  }

  attempts.count++;
  attempts.lastAttempt = now;
  return { allowed: true };
}

function resetRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Input validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'メールアドレスを入力してください', field: 'email' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'パスワードを入力してください', field: 'password' },
        { status: 400 }
      );
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase();

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `${clientIp}:${sanitizedEmail}`;
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `ログイン試行回数が上限を超えました。${rateLimit.retryAfter}秒後に再度お試しください。`,
        },
        { status: 429 }
      );
    }

    // Look up user
    const user = MOCK_USERS.get(sanitizedEmail);

    // Use constant-time comparison even when user doesn't exist
    // to prevent timing attacks that reveal valid emails
    const dummyHash = hashPassword('dummy-password-for-timing');
    const passwordToCompare = user?.passwordHash || dummyHash;
    const inputHash = hashPassword(password);

    const isValidPassword = secureCompare(passwordToCompare, inputHash);

    if (!user || !isValidPassword) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // Reset rate limit on successful login
    resetRateLimit(rateLimitKey);

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Create response with session cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: true,
        createdAt: user.createdAt,
      },
      message: 'ログインに成功しました',
    });

    // Set secure session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
}

