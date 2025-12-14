# Authentication & Authorization Implementation Report

**Date**: 2025-12-14
**Status**: Completed
**Security Compliance**: SEC-001, SEC-002, SEC-003

## Executive Summary

NextAuth.js v5による認証基盤とCASLによるRBAC認可基盤の実装が完了しました。
これにより、LifePlan Navigatorは以下のセキュリティ要件を満たします：

- ✅ セッションベースの認証（localStorage不使用）
- ✅ TOTP MFA（二要素認証）
- ✅ PBKDF2-SHA512によるパスワードハッシュ（600,000 iterations）
- ✅ オブジェクトレベル認可（IDOR防止）
- ✅ ロールベースアクセス制御（RBAC）

## Implementation Details

### 1. Authentication Infrastructure (NextAuth.js v5)

#### Core Configuration
- **File**: `src/lib/auth/config.ts`
- **Session Policy**:
  - Idle Timeout: 30分
  - Absolute Timeout: 8時間
  - Max Concurrent Sessions: 3
  - MFA Required for Sensitive Ops: Yes

#### Password Hashing
- **File**: `src/lib/auth/user-service.ts`
- **Algorithm**: PBKDF2-SHA512
- **Iterations**: 600,000 (OWASP 2023 recommendation)
- **Salt**: 32 bytes (crypto.randomBytes)
- **Features**:
  - Constant-time comparison
  - Account lockout (5 failed attempts → 15分 lockout)

#### MFA Implementation
- **File**: `src/lib/auth/mfa-service.ts`
- **Standard**: RFC 6238 (TOTP)
- **Parameters**:
  - Period: 30 seconds
  - Digits: 6
  - Algorithm: SHA-1 (compatible with Google Authenticator)
- **Backup Codes**: 10 codes, 8 characters each

### 2. Role-Based Access Control (CASL)

#### Role Hierarchy
| Role | Description | Capabilities |
|------|-------------|--------------|
| USER | 一般ユーザー | Own data CRUD |
| FAMILY_MEMBER | 家族共有 | Shared data read-only |
| SUPPORT | サポート | Profiles read (PII masked) |
| ADMIN | 管理者 | Read all + audit logs |
| SUPER_ADMIN | 特権管理者 | Manage all (except delete audit) |

#### Object-Level Authorization
- **File**: `src/lib/authorization/abilities.ts`
- **Resources**: Profile, FinancialData, Settings, AuditLog, Notification
- **Ownership Check**: userId field matching

### 3. Middleware Integration

#### Route Protection
- **File**: `middleware.ts`
- **Protected Routes**: /dashboard, /profile, /settings, /financial, /benefits, /onboarding
- **Auth Routes**: /login, /register (redirect if authenticated)

#### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: strict
- HSTS: Enabled in production

### 4. API Security

#### Authorization Middleware
- **File**: `src/lib/authorization/api-middleware.ts`
- **Functions**:
  - `withAuthorization()`: Basic auth check HOF
  - `withResourceAccess()`: Resource-level auth HOF
  - `requireMfaVerification()`: MFA enforcement

## File Structure

```
src/
├── lib/
│   ├── auth/
│   │   ├── config.ts           # NextAuth configuration
│   │   ├── user-service.ts     # User CRUD + password hashing
│   │   ├── mfa-service.ts      # TOTP MFA implementation
│   │   └── index.ts            # Auth exports
│   └── authorization/
│       ├── abilities.ts        # CASL ability definitions
│       ├── context.tsx         # React context + Can component
│       ├── api-middleware.ts   # API route authorization
│       └── index.ts            # Authorization exports
├── app/
│   ├── api/auth/
│   │   ├── [...nextauth]/route.ts    # NextAuth handler
│   │   └── mfa/
│   │       ├── setup/route.ts        # MFA setup endpoint
│   │       └── verify/route.ts       # MFA verify endpoint
│   ├── auth/mfa-verify/page.tsx      # MFA verification page
│   └── login/page.tsx                # Updated login page
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx       # Updated for NextAuth
│   │   └── ProtectedRoute.tsx  # Client-side protection
│   └── providers/
│       └── AuthProvider.tsx    # SessionProvider wrapper
├── hooks/
│   └── useAuth.ts              # Auth convenience hook
└── types/
    └── next-auth.d.ts          # Extended NextAuth types
```

## Usage Examples

### Protecting API Routes

```typescript
// Basic authorization
export const GET = withAuthorization(async (request, user) => {
  // user is guaranteed to be authenticated
  return NextResponse.json({ data });
});

// Resource-level authorization
export const GET = withResourceAccess(
  'read',
  async (request, user) => ({
    kind: 'FinancialData',
    id: params.id,
    userId: resource.userId
  }),
  async (request, user, resource) => {
    return NextResponse.json(resource);
  }
);
```

### Client-Side Authorization

```tsx
// Using Can component
<Can I="update" this={{ kind: 'Profile', userId: user.id }}>
  <EditButton />
</Can>

// Using hook
const canEdit = useCanPerform('update', { kind: 'Profile', userId });
```

### Protected Routes

```tsx
<ProtectedRoute requireMfa={true}>
  <SensitiveDataPage />
</ProtectedRoute>
```

## Remaining Tasks

1. **Redisセッション移行 (P0)**: Server-side session storage
2. **フィールドレベル暗号化 (P0)**: Sensitive data encryption
3. **監査ログ実装 (P0)**: Security audit trail

## Testing Requirements

- [ ] Unit tests for auth functions
- [ ] Integration tests for login/logout flow
- [ ] MFA setup and verification tests
- [ ] RBAC permission tests
- [ ] Session timeout tests
- [ ] Account lockout tests

## Security Considerations

1. **NEXTAUTH_SECRET**: Must be set in production (.env)
2. **CSRF Protection**: NextAuth handles its own CSRF
3. **Session Storage**: Currently JWT-based; Redis migration planned
4. **Rate Limiting**: Should be implemented at reverse proxy level
5. **Brute Force Protection**: Account lockout implemented

---

**Implemented By**: App Engineer (CTO指示)
**Reviewed By**: Pending CISO review
**Approved By**: Pending CEO/CISO approval for production deployment
