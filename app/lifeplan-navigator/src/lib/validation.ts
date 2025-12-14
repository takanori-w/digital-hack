/**
 * Validation utilities for form inputs
 * Security-focused input validation
 */

import { PasswordStrength } from '@/types';

// Email validation regex (RFC 5322 compliant, simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Common weak passwords to reject
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', '123456789', 'qwerty123',
  'abc12345', 'password1', 'iloveyou', 'admin123', 'welcome1',
  'letmein', 'monkey', 'dragon', 'master', 'qwertyuiop',
]);

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { isValid: false, error: 'メールアドレスを入力してください' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'メールアドレスが長すぎます' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: '有効なメールアドレスを入力してください' };
  }

  return { isValid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 12) {
    score += 1;
  } else {
    feedback.push('12文字以上にしてください');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('大文字を含めてください');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('小文字を含めてください');
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('数字を含めてください');
  }

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>[\]\\;'`~_+=-]/.test(password)) {
    score += 1;
  } else {
    feedback.push('記号を含めてください');
  }

  // Common password check
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    score = Math.max(0, score - 2);
    feedback.push('よく使われるパスワードは避けてください');
  }

  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('同じ文字の連続を避けてください');
  }

  // Normalize score to 0-4 range
  const normalizedScore = Math.min(4, Math.floor(score * 0.8));

  return {
    score: normalizedScore,
    feedback,
    isValid: normalizedScore >= 3 && password.length >= 12,
  };
}

/**
 * Validate name input
 */
export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, error: '名前を入力してください' };
  }

  if (trimmed.length < 1) {
    return { isValid: false, error: '名前を入力してください' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: '名前が長すぎます' };
  }

  // Allow letters, numbers, spaces, hyphens, and Japanese characters
  const validNameRegex = new RegExp('^[\\p{L}\\p{N}\\s\\-\']+$', 'u');
  if (!validNameRegex.test(trimmed)) {
    return { isValid: false, error: '使用できない文字が含まれています' };
  }

  return { isValid: true };
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Password strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  const labels = ['非常に弱い', '弱い', '普通', '強い', '非常に強い'];
  return labels[Math.min(score, 4)];
}

/**
 * Password strength color
 */
export function getPasswordStrengthColor(score: number): string {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
  return colors[Math.min(score, 4)];
}
