import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateCsrfToken, validateCsrfToken, CSRF_COOKIE_NAME } from '../csrf'

describe('generateCsrfToken', () => {
  it('generates a 64 character hex string', () => {
    const token = generateCsrfToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[a-f0-9]+$/)
  })

  it('generates unique tokens', () => {
    const token1 = generateCsrfToken()
    const token2 = generateCsrfToken()
    expect(token1).not.toBe(token2)
  })

  it('generates cryptographically random tokens', () => {
    // Generate multiple tokens and check they're all different
    const tokens = new Set<string>()
    for (let i = 0; i < 100; i++) {
      tokens.add(generateCsrfToken())
    }
    expect(tokens.size).toBe(100)
  })
})

describe('validateCsrfToken', () => {
  it('returns true for matching tokens', () => {
    const token = generateCsrfToken()
    expect(validateCsrfToken(token, token)).toBe(true)
  })

  it('returns false for non-matching tokens', () => {
    const token1 = generateCsrfToken()
    const token2 = generateCsrfToken()
    expect(validateCsrfToken(token1, token2)).toBe(false)
  })

  it('returns false when first token is empty', () => {
    const token = generateCsrfToken()
    expect(validateCsrfToken('', token)).toBe(false)
  })

  it('returns false when second token is empty', () => {
    const token = generateCsrfToken()
    expect(validateCsrfToken(token, '')).toBe(false)
  })

  it('returns false when both tokens are empty', () => {
    expect(validateCsrfToken('', '')).toBe(false)
  })

  it('returns false for tokens of different lengths', () => {
    const token1 = 'abc123'
    const token2 = 'abc1234567'
    expect(validateCsrfToken(token1, token2)).toBe(false)
  })

  it('handles unicode characters', () => {
    const token = 'テスト日本語'
    expect(validateCsrfToken(token, token)).toBe(true)
  })

  it('is case sensitive', () => {
    const token = 'AbCdEf123456'
    expect(validateCsrfToken(token.toLowerCase(), token)).toBe(false)
  })
})

describe('CSRF_COOKIE_NAME', () => {
  it('exports a consistent cookie name', () => {
    expect(CSRF_COOKIE_NAME).toBe('__Host-csrf-token')
  })
})

describe('Synchronizer Token Pattern', () => {
  it('validates matching cookie and header tokens', () => {
    // Simulates the pattern: cookie token matches header token
    const serverToken = generateCsrfToken()
    const clientToken = serverToken // Client gets this from /api/csrf-token

    expect(validateCsrfToken(serverToken, clientToken)).toBe(true)
  })

  it('rejects requests when header token differs from cookie token', () => {
    const serverToken = generateCsrfToken()
    const maliciousToken = generateCsrfToken() // Attacker cannot guess the token

    expect(validateCsrfToken(serverToken, maliciousToken)).toBe(false)
  })

  it('rejects requests when no header token is provided', () => {
    const serverToken = generateCsrfToken()

    expect(validateCsrfToken(serverToken, '')).toBe(false)
  })
})
