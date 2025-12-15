# LifePlan Navigator - 認証・認可機能 実装ガイダンス

**バージョン**: 1.0
**作成日**: 2025-12-11
**対象者**: App Engineer, CTO
**承認**: CISO

---

## 1. 概要

### 1.1 目的
本ドキュメントは、LifePlan Navigator に認証・認可機能を実装するための技術ガイダンスです。
セキュリティ要件定義書（LifePlan_Navigator_Security_Requirements.md）に準拠した実装を行います。

### 1.2 技術選定

| 機能 | 推奨技術 | 理由 |
|------|----------|------|
| 認証フレームワーク | NextAuth.js v5 | Next.js統合、OAuth対応 |
| パスワードハッシュ | Argon2id | OWASP推奨、メモリハード |
| MFA | speakeasy (TOTP) | RFC 6238準拠 |
| セッション管理 | Redis | 高速、TTL自動管理 |
| バリデーション | Zod | TypeScript統合 |

---

## 2. ディレクトリ構造

```
app/lifeplan-navigator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts    # NextAuth.js エンドポイント
│   │   │   │   ├── register/route.ts         # ユーザー登録
│   │   │   │   ├── mfa/
│   │   │   │   │   ├── setup/route.ts        # MFAセットアップ
│   │   │   │   │   └── verify/route.ts       # MFA検証
│   │   │   │   └── password/
│   │   │   │       ├── reset/route.ts        # パスワードリセット
│   │   │   │       └── change/route.ts       # パスワード変更
│   │   │   └── csrf-token/route.ts           # CSRFトークン取得
│   │   ├── (auth)/                           # 認証関連ページ
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── mfa/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   └── (protected)/                      # 認証必須ページ
│   │       ├── dashboard/page.tsx
│   │       └── settings/page.tsx
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── index.ts                      # NextAuth設定
│   │   │   ├── providers.ts                  # 認証プロバイダー
│   │   │   ├── callbacks.ts                  # コールバック設定
│   │   │   └── adapter.ts                    # データベースアダプター
│   │   ├── password/
│   │   │   ├── hash.ts                       # Argon2ハッシュ
│   │   │   └── policy.ts                     # パスワードポリシー
│   │   ├── mfa/
│   │   │   ├── totp.ts                       # TOTP生成・検証
│   │   │   └── backup-codes.ts               # バックアップコード
│   │   ├── session/
│   │   │   ├── manager.ts                    # セッション管理
│   │   │   └── redis.ts                      # Redis接続
│   │   └── authorization/
│   │       ├── rbac.ts                       # ロールベースアクセス制御
│   │       └── middleware.ts                 # 認可ミドルウェア
│   ├── components/
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       ├── RegisterForm.tsx
│   │       ├── MfaSetup.tsx
│   │       └── PasswordInput.tsx
│   └── types/
│       └── auth.ts                           # 認証関連型定義
├── prisma/
│   └── schema.prisma                         # データベーススキーマ
└── .env.local                                # 環境変数
```

---

## 3. NextAuth.js 設定

### 3.1 基本設定

```typescript
// src/lib/auth/index.ts
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { providers } from './providers';
import { callbacks } from './callbacks';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks,
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30分（アイドルタイムアウト）
    updateAge: 5 * 60, // 5分ごとに更新
  },
  cookies: {
    sessionToken: {
      name: '__Host-next-auth.session-token',
      options: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
      },
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

### 3.2 認証プロバイダー

```typescript
// src/lib/auth/providers.ts
import type { Provider } from 'next-auth/providers';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password/hash';
import { verifyTotp } from '@/lib/mfa/totp';

export const providers: Provider[] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
      totpCode: { label: 'TOTP Code', type: 'text' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('メールアドレスとパスワードを入力してください');
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
        include: { mfaSettings: true },
      });

      if (!user || !user.passwordHash) {
        // タイミング攻撃対策: 存在しないユーザーでも同じ時間をかける
        await verifyPassword('dummy', '$argon2id$v=19$m=65536,t=3,p=4$...');
        throw new Error('認証に失敗しました');
      }

      // アカウントロックチェック
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        throw new Error('アカウントがロックされています。しばらく待ってから再試行してください');
      }

      const isValid = await verifyPassword(
        credentials.password as string,
        user.passwordHash
      );

      if (!isValid) {
        // 失敗回数をインクリメント
        await incrementFailedAttempts(user.id);
        throw new Error('認証に失敗しました');
      }

      // MFA検証
      if (user.mfaSettings?.enabled) {
        if (!credentials.totpCode) {
          throw new Error('MFA_REQUIRED');
        }

        const isMfaValid = verifyTotp(
          user.mfaSettings.secret,
          credentials.totpCode as string
        );

        if (!isMfaValid) {
          throw new Error('認証コードが無効です');
        }
      }

      // ログイン成功: 失敗回数をリセット
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    },
  }),

  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
      },
    },
  }),
];

async function incrementFailedAttempts(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: { increment: 1 } },
  });

  // 5回失敗でアカウントロック（15分）
  if (user.failedLoginAttempts >= 5) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
  }
}
```

### 3.3 コールバック設定

```typescript
// src/lib/auth/callbacks.ts
import type { CallbacksOptions } from 'next-auth';
import { prisma } from '@/lib/prisma';

export const callbacks: Partial<CallbacksOptions> = {
  async jwt({ token, user, trigger, session }) {
    if (user) {
      token.id = user.id;
      token.role = user.role;
    }

    // セッション更新時
    if (trigger === 'update' && session) {
      token.name = session.name;
    }

    return token;
  },

  async session({ session, token }) {
    if (token) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
    }
    return session;
  },

  async signIn({ user, account }) {
    // OAuthユーザーの初回ログイン時の処理
    if (account?.provider !== 'credentials') {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (!existingUser) {
        // 新規ユーザー作成
        await prisma.user.create({
          data: {
            email: user.email!,
            name: user.name,
            emailVerified: new Date(),
            role: 'user',
          },
        });
      }
    }

    // 監査ログ記録
    await prisma.auditLog.create({
      data: {
        eventType: 'LOGIN',
        userId: user.id,
        ipAddress: 'TODO: extract from request',
        result: 'success',
      },
    });

    return true;
  },
};
```

---

## 4. パスワード管理

### 4.1 Argon2ハッシュ

```typescript
// src/lib/password/hash.ts
import argon2 from 'argon2';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,  // 64 MB
  timeCost: 3,        // 3 iterations
  parallelism: 4,     // 4 parallel threads
  hashLength: 32,     // 32 bytes
};

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
```

### 4.2 パスワードポリシー

```typescript
// src/lib/password/policy.ts
import { z } from 'zod';
import zxcvbn from 'zxcvbn';

const MIN_LENGTH = 12;
const MAX_LENGTH = 128;
const MIN_STRENGTH = 3; // zxcvbn score (0-4)

export const passwordSchema = z.string()
  .min(MIN_LENGTH, `パスワードは${MIN_LENGTH}文字以上必要です`)
  .max(MAX_LENGTH, `パスワードは${MAX_LENGTH}文字以下にしてください`)
  .refine(
    (password) => /[A-Z]/.test(password),
    '大文字を含めてください'
  )
  .refine(
    (password) => /[a-z]/.test(password),
    '小文字を含めてください'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    '数字を含めてください'
  )
  .refine(
    (password) => {
      const result = zxcvbn(password);
      return result.score >= MIN_STRENGTH;
    },
    'パスワードが推測されやすいです。より複雑なパスワードを設定してください'
  );

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  strength: number;
  feedback: string[];
} {
  const result = passwordSchema.safeParse(password);
  const strengthResult = zxcvbn(password);

  return {
    isValid: result.success,
    errors: result.success ? [] : result.error.errors.map(e => e.message),
    strength: strengthResult.score,
    feedback: strengthResult.feedback.suggestions,
  };
}

// 漏洩パスワードチェック (Have I Been Pwned API)
export async function checkPwnedPassword(password: string): Promise<boolean> {
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();
    return text.includes(suffix);
  } catch {
    // APIエラー時は安全側に倒す（パスワードを許可）
    console.error('HIBP API check failed');
    return false;
  }
}
```

---

## 5. MFA (TOTP) 実装

### 5.1 TOTPセットアップ

```typescript
// src/lib/mfa/totp.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const ISSUER = 'LifePlan Navigator';

export function generateSecret(userEmail: string): {
  secret: string;
  otpauthUrl: string;
} {
  const secret = speakeasy.generateSecret({
    name: `${ISSUER} (${userEmail})`,
    issuer: ISSUER,
    length: 32,
  });

  return {
    secret: secret.base32!,
    otpauthUrl: secret.otpauth_url!,
  };
}

export async function generateQRCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'M',
    width: 256,
  });
}

export function verifyTotp(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // 前後30秒を許容
  });
}

// MFAセットアップAPIエンドポイント
// src/app/api/auth/mfa/setup/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSecret, generateQRCode } from '@/lib/mfa/totp';
import { generateBackupCodes } from '@/lib/mfa/backup-codes';

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { secret, otpauthUrl } = generateSecret(session.user.email!);
  const qrCode = await generateQRCode(otpauthUrl);
  const backupCodes = generateBackupCodes(10);

  // 一時保存（検証完了まで）
  await prisma.mfaPendingSetup.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      secret,
      backupCodes: await hashBackupCodes(backupCodes),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10分
    },
    update: {
      secret,
      backupCodes: await hashBackupCodes(backupCodes),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  return NextResponse.json({
    qrCode,
    secret, // 手動入力用
    backupCodes,
  });
}
```

### 5.2 バックアップコード

```typescript
// src/lib/mfa/backup-codes.ts
import crypto from 'crypto';
import argon2 from 'argon2';

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(code => argon2.hash(code)));
}

export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<number | null> {
  for (let i = 0; i < hashedCodes.length; i++) {
    if (await argon2.verify(hashedCodes[i], code)) {
      return i; // 使用済みコードのインデックスを返す
    }
  }
  return null;
}
```

---

## 6. 認可 (RBAC)

### 6.1 ロール定義

```typescript
// src/lib/authorization/rbac.ts
export enum Role {
  USER = 'user',
  FAMILY_MEMBER = 'family_member',
  SUPPORT = 'support',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum Permission {
  // ユーザーデータ
  READ_OWN_DATA = 'read:own_data',
  WRITE_OWN_DATA = 'write:own_data',
  READ_SHARED_DATA = 'read:shared_data',

  // 管理機能
  READ_USER_DATA = 'read:user_data',
  MANAGE_SYSTEM = 'manage:system',
  MANAGE_ALL = 'manage:all',

  // 金融情報（追加のMFA必要）
  ACCESS_FINANCIAL_DATA = 'access:financial_data',
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.READ_OWN_DATA,
    Permission.WRITE_OWN_DATA,
    Permission.ACCESS_FINANCIAL_DATA,
  ],
  [Role.FAMILY_MEMBER]: [
    Permission.READ_SHARED_DATA,
  ],
  [Role.SUPPORT]: [
    Permission.READ_USER_DATA,
  ],
  [Role.ADMIN]: [
    Permission.MANAGE_SYSTEM,
  ],
  [Role.SUPER_ADMIN]: [
    Permission.MANAGE_ALL,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];

  // SUPER_ADMIN は全権限
  if (role === Role.SUPER_ADMIN) return true;

  return permissions.includes(permission);
}
```

### 6.2 認可ミドルウェア

```typescript
// src/lib/authorization/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission, Permission, Role } from './rbac';
import { prisma } from '@/lib/prisma';

export function withAuthorization(
  requiredPermission: Permission,
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = session.user.role as Role;

    if (!hasPermission(userRole, requiredPermission)) {
      // 監査ログ記録
      await prisma.auditLog.create({
        data: {
          eventType: 'AUTHORIZATION_DENIED',
          userId: session.user.id,
          details: {
            requiredPermission,
            userRole,
            path: request.nextUrl.pathname,
          },
          result: 'failure',
        },
      });

      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

// オブジェクトレベル認可（IDOR対策）
export async function canAccessResource(
  userId: string,
  resourceOwnerId: string,
  userRole: Role
): Promise<boolean> {
  // 自分のリソース
  if (userId === resourceOwnerId) return true;

  // 管理者
  if (userRole === Role.SUPER_ADMIN) return true;

  // 共有設定チェック
  const sharing = await prisma.resourceSharing.findFirst({
    where: {
      resourceOwnerId,
      sharedWithUserId: userId,
      expiresAt: { gt: new Date() },
    },
  });

  return !!sharing;
}
```

---

## 7. データベーススキーマ

```prisma
// prisma/schema.prisma
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  emailVerified       DateTime?
  name                String?
  passwordHash        String?
  role                String    @default("user")

  // セキュリティ関連
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  passwordChangedAt   DateTime?

  // MFA
  mfaSettings         MfaSettings?

  // リレーション
  accounts            Account[]
  sessions            Session[]
  auditLogs           AuditLog[]

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([email])
}

model MfaSettings {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  enabled     Boolean  @default(false)
  secret      String   // 暗号化して保存
  backupCodes String[] // ハッシュ化して保存
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AuditLog {
  id          String   @id @default(cuid())
  eventType   String
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  ipAddress   String?
  userAgent   String?
  details     Json?
  result      String   // success, failure
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([eventType])
  @@index([createdAt])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expires      DateTime
  createdAt    DateTime @default(now())

  @@index([userId])
}
```

---

## 8. 環境変数

```bash
# .env.local
# NextAuth
NEXTAUTH_URL=https://lifeplan-navigator.jp
NEXTAUTH_SECRET=your-secret-key-here-32-chars-min

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lifeplan

# Redis
REDIS_URL=redis://localhost:6379

# Encryption (for MFA secrets)
ENCRYPTION_KEY=your-32-byte-encryption-key
```

---

## 9. セキュリティチェックリスト

### 9.1 実装完了チェック

- [ ] NextAuth.js設定完了
- [ ] Credentialsプロバイダー実装
- [ ] OAuth (Google) 設定
- [ ] Argon2idパスワードハッシュ
- [ ] パスワードポリシー検証
- [ ] 漏洩パスワードチェック (HIBP)
- [ ] アカウントロック機能
- [ ] MFA (TOTP) セットアップ
- [ ] MFAバックアップコード
- [ ] RBAC実装
- [ ] オブジェクトレベル認可
- [ ] 監査ログ記録
- [ ] セッション管理 (JWT + Redis)

### 9.2 テスト項目

- [ ] 正常ログインフロー
- [ ] パスワード検証（弱いパスワード拒否）
- [ ] アカウントロック（5回失敗後）
- [ ] MFA必須フロー
- [ ] バックアップコード使用
- [ ] OAuth ログイン
- [ ] セッションタイムアウト
- [ ] 認可チェック（権限なしで403）
- [ ] IDOR対策（他ユーザーデータアクセス拒否）

---

## 10. 参考資料

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [NIST SP 800-63B - Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

**承認**

| 役職 | 署名 | 日付 |
|------|------|------|
| CISO | | 2025-12-11 |
| CTO | | |

---
*本ドキュメントは機密情報を含みます。取り扱いには十分ご注意ください。*
