import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Mock user database (shared with login route in production, use a real database)
const REGISTERED_USERS: Map<string, { id: string; email: string; name: string; passwordHash: string; createdAt: string }> = new Map();

// Initialize with demo user
const demoPasswordHash = hashPassword('DemoPass123!');
REGISTERED_USERS.set('demo@example.com', {
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
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 12) {
    return { valid: false, error: 'パスワードは12文字以上必要です' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'パスワードが長すぎます' };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>[\]\\;'`~_+=-]/.test(password);

  const complexity = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (complexity < 3) {
    return {
      valid: false,
      error: '大文字、小文字、数字、記号のうち3種類以上を含めてください',
    };
  }

  // Check for common passwords
  const commonPasswords = ['password', 'password123', '12345678', 'qwerty123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return { valid: false, error: 'よく使われるパスワードは避けてください' };
  }

  return { valid: true };
}

/**
 * Validate name
 */
function isValidName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: '名前を入力してください' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: '名前が長すぎます' };
  }

  // Allow letters, numbers, spaces, hyphens, and Japanese characters
  // eslint-disable-next-line no-useless-escape
  const validNameRegex = new RegExp('^[\\p{L}\\p{N}\\s\\-\']+$', 'u');
  if (!validNameRegex.test(trimmed)) {
    return { valid: false, error: '使用できない文字が含まれています' };
  }

  return { valid: true };
}

/**
 * Rate limiting for registration
 */
const registrationAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
const MAX_REGISTRATIONS_PER_IP = 3;
const REGISTRATION_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRegistrationLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = registrationAttempts.get(ip);

  if (!attempts || now - attempts.lastAttempt > REGISTRATION_WINDOW) {
    registrationAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  if (attempts.count >= MAX_REGISTRATIONS_PER_IP) {
    return false;
  }

  attempts.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRegistrationLimit(clientIp)) {
      return NextResponse.json(
        { error: '登録制限に達しました。しばらく経ってから再度お試しください。' },
        { status: 429 }
      );
    }

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'メールアドレスを入力してください', field: 'email' },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください', field: 'email' },
        { status: 400 }
      );
    }

    // Check if email already exists
    if (REGISTERED_USERS.has(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています', field: 'email' },
        { status: 409 }
      );
    }

    // Validate name
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: '名前を入力してください', field: 'name' },
        { status: 400 }
      );
    }

    const nameValidation = isValidName(name);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error, field: 'name' },
        { status: 400 }
      );
    }

    // Validate password
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'パスワードを入力してください', field: 'password' },
        { status: 400 }
      );
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error, field: 'password' },
        { status: 400 }
      );
    }

    // Create user
    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);
    const createdAt = new Date().toISOString();

    const newUser = {
      id: userId,
      email: sanitizedEmail,
      name: name.trim(),
      passwordHash,
      createdAt,
    };

    REGISTERED_USERS.set(sanitizedEmail, newUser);

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Create response
    const response = NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        emailVerified: false,
        createdAt: newUser.createdAt,
      },
      message: '登録が完了しました',
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
}

