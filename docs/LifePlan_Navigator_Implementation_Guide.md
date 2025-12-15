# LifePlan Navigator セキュア実装ガイド

**対象者**: CTO, App Engineer
**バージョン**: 1.0
**作成日**: 2025-12-11

---

## 1. アーキテクチャ概要

### 1.1 推奨技術スタック

| レイヤー | 技術 | 理由 |
|----------|------|------|
| Frontend | React/Next.js + TypeScript | 型安全性、XSS対策の組み込みサポート |
| Backend | Node.js/NestJS または Go | セキュリティミドルウェアの充実 |
| Database | PostgreSQL | 暗号化、RLSサポート |
| Cache | Redis | セッション管理、レート制限 |
| Infrastructure | AWS/GCP | マネージドセキュリティサービス |

### 1.2 セキュリティアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│  [1] Edge Security      : Cloudflare WAF, DDoS Protection   │
│  [2] Network Security   : VPC, Security Groups, NACLs       │
│  [3] Application Security: Auth, Input Validation, CSRF     │
│  [4] Data Security      : Encryption, Masking, Access Control│
│  [5] Monitoring         : SIEM, Logging, Alerting           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 認証実装

### 2.1 パスワード認証

```typescript
// password.service.ts
import * as argon2 from 'argon2';

export class PasswordService {
  private static readonly ARGON2_OPTIONS: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 65536,  // 64 MB
    timeCost: 3,
    parallelism: 4,
  };

  async hash(password: string): Promise<string> {
    return argon2.hash(password, PasswordService.ARGON2_OPTIONS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
```

### 2.2 パスワードポリシー検証

```typescript
// password-policy.validator.ts
import { zxcvbn } from 'zxcvbn';

export class PasswordPolicyValidator {
  private static readonly MIN_LENGTH = 12;
  private static readonly MIN_STRENGTH = 3; // zxcvbn score (0-4)

  validate(password: string): ValidationResult {
    const errors: string[] = [];

    // 長さチェック
    if (password.length < PasswordPolicyValidator.MIN_LENGTH) {
      errors.push(`パスワードは${PasswordPolicyValidator.MIN_LENGTH}文字以上必要です`);
    }

    // 複雑性チェック
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const complexity = [hasUpper, hasLower, hasNumber, hasSpecial]
      .filter(Boolean).length;

    if (complexity < 3) {
      errors.push('大文字、小文字、数字、記号のうち3種類以上を含めてください');
    }

    // 強度チェック (zxcvbn)
    const strength = zxcvbn(password);
    if (strength.score < PasswordPolicyValidator.MIN_STRENGTH) {
      errors.push('パスワードが推測されやすいです。より複雑なパスワードを設定してください');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: strength.score,
    };
  }
}
```

### 2.3 MFA (TOTP) 実装

```typescript
// mfa.service.ts
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export class MfaService {
  generateSecret(userEmail: string): MfaSecret {
    const secret = speakeasy.generateSecret({
      name: `LifePlan Navigator (${userEmail})`,
      issuer: 'LifePlan Navigator',
      length: 32,
    });

    return {
      base32: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1, // 30秒の前後1ウィンドウを許容
    });
  }

  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}
```

### 2.4 セッション管理

```typescript
// session.service.ts
import { Redis } from 'ioredis';
import * as crypto from 'crypto';

export class SessionService {
  private redis: Redis;
  private static readonly SESSION_TTL = 1800; // 30分
  private static readonly ABSOLUTE_TTL = 28800; // 8時間

  generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async createSession(userId: string, metadata: SessionMetadata): Promise<string> {
    const sessionId = this.generateSessionId();
    const session: Session = {
      userId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      metadata,
    };

    await this.redis.setex(
      `session:${sessionId}`,
      SessionService.SESSION_TTL,
      JSON.stringify(session)
    );

    return sessionId;
  }

  async validateSession(sessionId: string): Promise<Session | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    if (!data) return null;

    const session: Session = JSON.parse(data);

    // 絶対タイムアウトチェック
    if (Date.now() - session.createdAt > SessionService.ABSOLUTE_TTL * 1000) {
      await this.destroySession(sessionId);
      return null;
    }

    // アイドルタイムアウト更新
    session.lastAccessedAt = Date.now();
    await this.redis.setex(
      `session:${sessionId}`,
      SessionService.SESSION_TTL,
      JSON.stringify(session)
    );

    return session;
  }

  async destroySession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }

  async regenerateSession(oldSessionId: string): Promise<string> {
    const session = await this.validateSession(oldSessionId);
    if (!session) throw new Error('Invalid session');

    await this.destroySession(oldSessionId);
    return this.createSession(session.userId, session.metadata);
  }
}
```

### 2.5 Cookie設定

```typescript
// cookie.config.ts
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true, // HTTPS必須
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 1800 * 1000, // 30分
  domain: '.lifeplan-navigator.example.com',
};
```

---

## 3. 認可実装

### 3.1 RBAC実装

```typescript
// authorization.service.ts
export enum Role {
  USER = 'user',
  FAMILY_MEMBER = 'family_member',
  SUPPORT = 'support',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum Permission {
  READ_OWN_DATA = 'read:own_data',
  WRITE_OWN_DATA = 'write:own_data',
  READ_SHARED_DATA = 'read:shared_data',
  READ_USER_DATA = 'read:user_data',
  MANAGE_SYSTEM = 'manage:system',
  MANAGE_ALL = 'manage:all',
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [Permission.READ_OWN_DATA, Permission.WRITE_OWN_DATA],
  [Role.FAMILY_MEMBER]: [Permission.READ_SHARED_DATA],
  [Role.SUPPORT]: [Permission.READ_USER_DATA],
  [Role.ADMIN]: [Permission.MANAGE_SYSTEM],
  [Role.SUPER_ADMIN]: [Permission.MANAGE_ALL],
};

export class AuthorizationService {
  hasPermission(userRole: Role, requiredPermission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(requiredPermission);
  }

  // オブジェクトレベル認可（IDOR対策）
  async canAccessResource(
    userId: string,
    resourceOwnerId: string,
    userRole: Role
  ): Promise<boolean> {
    // 自分のリソースへのアクセス
    if (userId === resourceOwnerId) return true;

    // 管理者権限
    if (userRole === Role.SUPER_ADMIN) return true;

    // 共有設定の確認
    const sharing = await this.checkSharingPermission(userId, resourceOwnerId);
    return sharing;
  }
}
```

### 3.2 認可ミドルウェア

```typescript
// authorization.middleware.ts
import { Request, Response, NextFunction } from 'express';

export function authorize(requiredPermission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authService = new AuthorizationService();

    if (!authService.hasPermission(user.role, requiredPermission)) {
      // 監査ログ記録
      await auditLog.record({
        event: 'AUTHORIZATION_DENIED',
        userId: user.id,
        requiredPermission,
        userRole: user.role,
        resource: req.path,
      });

      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

// リソースオーナーチェック
export function authorizeResourceOwner(resourceIdParam: string = 'id') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const resourceId = req.params[resourceIdParam];

    const resource = await resourceService.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: 'Not found' });
    }

    const authService = new AuthorizationService();
    const canAccess = await authService.canAccessResource(
      user.id,
      resource.ownerId,
      user.role
    );

    if (!canAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.resource = resource;
    next();
  };
}
```

---

## 4. データ暗号化

### 4.1 アプリケーションレベル暗号化

```typescript
// encryption.service.ts
import * as crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;

  constructor(private kmsService: KmsService) {}

  async encrypt(plaintext: string, context: string): Promise<EncryptedData> {
    // KMSからデータキーを取得
    const { dataKey, encryptedDataKey } = await this.kmsService.generateDataKey(context);

    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, dataKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const tag = cipher.getAuthTag();

    // データキーをメモリから消去
    dataKey.fill(0);

    return {
      ciphertext: encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      encryptedDataKey: encryptedDataKey.toString('base64'),
    };
  }

  async decrypt(encryptedData: EncryptedData, context: string): Promise<string> {
    // KMSでデータキーを復号
    const dataKey = await this.kmsService.decryptDataKey(
      Buffer.from(encryptedData.encryptedDataKey, 'base64'),
      context
    );

    const iv = Buffer.from(encryptedData.iv, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');

    const decipher = crypto.createDecipheriv(this.algorithm, dataKey, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData.ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    // データキーをメモリから消去
    dataKey.fill(0);

    return decrypted;
  }
}
```

### 4.2 機密フィールドの自動暗号化

```typescript
// encrypted-column.decorator.ts
import { EncryptionService } from './encryption.service';

export function EncryptedColumn(options?: { context?: string }) {
  return function (target: any, propertyKey: string) {
    const encryptionService = new EncryptionService(kmsService);

    let value: any;

    Object.defineProperty(target, propertyKey, {
      get() {
        return value;
      },
      async set(newValue: any) {
        if (newValue && typeof newValue === 'string') {
          value = await encryptionService.encrypt(
            newValue,
            options?.context || propertyKey
          );
        } else {
          value = newValue;
        }
      },
    });
  };
}

// 使用例
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @EncryptedColumn({ context: 'financial_data' })
  annualIncome: string;

  @EncryptedColumn({ context: 'financial_data' })
  totalAssets: string;
}
```

---

## 5. 入力バリデーション

### 5.1 バリデーションスキーマ

```typescript
// validation.schemas.ts
import { z } from 'zod';

export const userRegistrationSchema = z.object({
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .max(254, 'メールアドレスが長すぎます'),

  password: z
    .string()
    .min(12, 'パスワードは12文字以上必要です')
    .max(128, 'パスワードが長すぎます')
    .regex(/[A-Z]/, '大文字を含めてください')
    .regex(/[a-z]/, '小文字を含めてください')
    .regex(/[0-9]/, '数字を含めてください'),

  name: z
    .string()
    .min(1, '名前を入力してください')
    .max(100, '名前が長すぎます')
    .regex(/^[\p{L}\p{N}\s\-']+$/u, '使用できない文字が含まれています'),

  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, '有効な電話番号を入力してください')
    .optional(),
});

export const financialDataSchema = z.object({
  annualIncome: z
    .number()
    .int('整数で入力してください')
    .min(0, '0以上の値を入力してください')
    .max(9999999999, '値が大きすぎます'),

  totalAssets: z
    .number()
    .int('整数で入力してください')
    .min(0, '0以上の値を入力してください')
    .max(9999999999, '値が大きすぎます'),
});
```

### 5.2 バリデーションミドルウェア

```typescript
// validation.middleware.ts
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}
```

---

## 6. XSS/CSRF対策

### 6.1 CSRFトークン実装

```typescript
// csrf.service.ts
import * as crypto from 'crypto';
import { Redis } from 'ioredis';

export class CsrfService {
  constructor(private redis: Redis) {}

  async generateToken(sessionId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');

    await this.redis.setex(
      `csrf:${sessionId}:${token}`,
      3600, // 1時間
      '1'
    );

    return token;
  }

  async validateToken(sessionId: string, token: string): Promise<boolean> {
    const key = `csrf:${sessionId}:${token}`;
    const exists = await this.redis.exists(key);

    if (exists) {
      // トークンを無効化（再利用防止）
      await this.redis.del(key);
      return true;
    }

    return false;
  }
}
```

### 6.2 セキュリティヘッダー設定

```typescript
// security-headers.middleware.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.lifeplan-navigator.example.com'],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});
```

### 6.3 出力エスケープ

```typescript
// sanitization.utils.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // HTMLタグを全て除去
    ALLOWED_ATTR: [],
  });
}

export function escapeForHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, char => map[char]);
}

export function escapeForJson(input: string): string {
  return JSON.stringify(input).slice(1, -1);
}
```

---

## 7. ログ・監査

### 7.1 監査ログ実装

```typescript
// audit-log.service.ts
export interface AuditEvent {
  timestamp: Date;
  eventType: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure';
  details?: Record<string, any>;
}

export class AuditLogService {
  async record(event: Partial<AuditEvent>): Promise<void> {
    const auditEvent: AuditEvent = {
      timestamp: new Date(),
      eventType: event.eventType || 'UNKNOWN',
      userId: this.maskPii(event.userId || 'anonymous'),
      resourceType: event.resourceType || '',
      resourceId: event.resourceId || '',
      action: event.action || '',
      ipAddress: this.hashIp(event.ipAddress || ''),
      userAgent: event.userAgent || '',
      result: event.result || 'success',
      details: this.sanitizeDetails(event.details),
    };

    // 改ざん防止のためのHMAC
    const hmac = this.generateHmac(auditEvent);

    await this.auditRepository.save({
      ...auditEvent,
      integrity: hmac,
    });
  }

  private maskPii(value: string): string {
    // PIIのマスキング
    if (value.includes('@')) {
      return value.replace(/(.{2}).*(@.*)/, '$1***$2');
    }
    return value;
  }

  private hashIp(ip: string): string {
    // IPアドレスのハッシュ化（プライバシー保護）
    return crypto.createHash('sha256').update(ip + this.salt).digest('hex').slice(0, 16);
  }

  private sanitizeDetails(details?: Record<string, any>): Record<string, any> {
    if (!details) return {};

    // 機密情報を除去
    const sensitiveKeys = ['password', 'token', 'secret', 'creditCard'];
    const sanitized = { ...details };

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
```

### 7.2 セキュリティイベント検知

```typescript
// security-monitor.service.ts
export class SecurityMonitorService {
  private readonly FAILED_LOGIN_THRESHOLD = 5;
  private readonly FAILED_LOGIN_WINDOW = 900; // 15分

  async checkFailedLogins(userId: string, ipAddress: string): Promise<void> {
    const key = `failed_login:${userId}`;
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, this.FAILED_LOGIN_WINDOW);
    }

    if (count >= this.FAILED_LOGIN_THRESHOLD) {
      // アカウントロック
      await this.lockAccount(userId);

      // アラート発報
      await this.alertService.send({
        severity: 'HIGH',
        type: 'BRUTE_FORCE_DETECTED',
        userId,
        ipAddress,
        details: { failedAttempts: count },
      });
    }
  }

  async detectAnomalousAccess(userId: string, context: AccessContext): Promise<void> {
    // 異常検知ロジック
    const userProfile = await this.getUserAccessProfile(userId);

    // 新しいIPからのアクセス
    if (!userProfile.knownIps.includes(context.ipAddress)) {
      await this.alertService.send({
        severity: 'MEDIUM',
        type: 'NEW_IP_ACCESS',
        userId,
        details: { newIp: context.ipAddress },
      });
    }

    // 異常な時間帯のアクセス
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 5 && !userProfile.allowsNightAccess) {
      await this.alertService.send({
        severity: 'MEDIUM',
        type: 'UNUSUAL_TIME_ACCESS',
        userId,
        details: { accessTime: new Date().toISOString() },
      });
    }
  }
}
```

---

## 8. レートリミット

```typescript
// rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// 一般APIエンドポイント
export const apiRateLimiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 60 * 1000, // 1分
  max: 100, // 100リクエスト/分
  message: {
    error: 'Too many requests',
    retryAfter: 60,
  },
  keyGenerator: (req) => req.user?.id || req.ip,
});

// ログインエンドポイント
export const loginRateLimiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 5回/15分
  message: {
    error: 'Too many login attempts',
    retryAfter: 900,
  },
  keyGenerator: (req) => `${req.ip}:${req.body.email}`,
});

// 機密データアクセス
export const sensitiveDataRateLimiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 60 * 60 * 1000, // 1時間
  max: 10, // 10回/時間
  message: {
    error: 'Too many requests for sensitive data',
    retryAfter: 3600,
  },
  keyGenerator: (req) => req.user?.id,
});
```

---

## 9. エラーハンドリング

```typescript
// error-handler.middleware.ts
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // エラーログ記録（機密情報なし）
  logger.error({
    message: error.message,
    stack: error.stack,
    requestId: req.id,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // クライアントへのレスポンス（詳細を隠蔽）
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
    });
  }

  if (error instanceof AuthenticationError) {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Invalid credentials',
    });
  }

  if (error instanceof AuthorizationError) {
    return res.status(403).json({
      error: 'Authorization Error',
      message: 'Access denied',
    });
  }

  // 予期しないエラー（詳細を隠蔽）
  return res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    requestId: req.id, // サポート用
  });
}
```

---

## 10. セキュリティテスト

### 10.1 テストケース例

```typescript
// auth.security.spec.ts
describe('Authentication Security', () => {
  describe('Password Policy', () => {
    it('should reject passwords shorter than 12 characters', async () => {
      const result = await register({ password: 'Short1!' });
      expect(result.status).toBe(400);
    });

    it('should reject passwords without complexity', async () => {
      const result = await register({ password: 'onlylowercase123' });
      expect(result.status).toBe(400);
    });

    it('should reject compromised passwords', async () => {
      const result = await register({ password: 'Password123!' }); // 既知の漏洩パスワード
      expect(result.status).toBe(400);
    });
  });

  describe('Session Management', () => {
    it('should regenerate session ID after login', async () => {
      const preLoginSession = await getSession();
      await login(validCredentials);
      const postLoginSession = await getSession();
      expect(postLoginSession.id).not.toBe(preLoginSession.id);
    });

    it('should timeout idle sessions after 30 minutes', async () => {
      await login(validCredentials);
      await advanceTime(31 * 60 * 1000);
      const result = await getProtectedResource();
      expect(result.status).toBe(401);
    });
  });

  describe('Brute Force Protection', () => {
    it('should lock account after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await login({ ...validCredentials, password: 'wrong' });
      }
      const result = await login(validCredentials);
      expect(result.status).toBe(423); // Locked
    });
  });
});
```

---

## 11. デプロイメントチェックリスト

### 本番環境デプロイ前

- [ ] 全てのシークレットが環境変数/シークレットマネージャーで管理されている
- [ ] デバッグモードが無効化されている
- [ ] エラーメッセージがスタックトレースを含まない
- [ ] TLS 1.3が有効化されている
- [ ] セキュリティヘッダーが設定されている
- [ ] レートリミットが設定されている
- [ ] ログがPIIをマスキングしている
- [ ] バックアップが暗号化されている
- [ ] 脆弱性スキャンをパスしている
- [ ] ペネトレーションテストをパスしている

---

**作成**: CISO
**レビュー**: CTO, App Engineer
**承認日**: 2025-12-11
