# LifePlan Navigator - セキュリティテストケース

**バージョン**: 1.0
**作成日**: 2025-12-11
**対象者**: White Hacker, QA Engineer, App Engineer
**承認**: CISO

---

## 1. 概要

本ドキュメントは、LifePlan Navigator のセキュリティテストケースを定義します。
OWASP Testing Guide v4.0、OWASP ASVS v4.0に準拠したテストを実施します。

---

## 2. テストカテゴリ

| カテゴリ | OWASP参照 | 優先度 |
|----------|-----------|--------|
| 認証テスト | WSTG-ATHN | P0 |
| 認可テスト | WSTG-ATHZ | P0 |
| セッション管理 | WSTG-SESS | P0 |
| 入力検証 | WSTG-INPV | P1 |
| エラー処理 | WSTG-ERRH | P1 |
| 暗号化 | WSTG-CRYP | P1 |
| クライアント側 | WSTG-CLNT | P1 |
| 設定管理 | WSTG-CONF | P2 |

---

## 3. 認証テスト (WSTG-ATHN)

### 3.1 パスワードポリシーテスト

```typescript
// __tests__/security/auth/password-policy.test.ts
describe('Password Policy', () => {
  describe('Minimum Length', () => {
    it('should reject passwords shorter than 12 characters', async () => {
      const result = await register({
        email: 'test@example.com',
        password: 'Short1!Aa', // 9文字
      });
      expect(result.status).toBe(400);
      expect(result.body.error).toContain('12文字以上');
    });

    it('should accept passwords with 12 characters', async () => {
      const result = await register({
        email: 'test@example.com',
        password: 'ValidPass12!',
      });
      expect(result.status).toBe(201);
    });
  });

  describe('Complexity Requirements', () => {
    it('should reject passwords without uppercase', async () => {
      const result = await register({
        email: 'test@example.com',
        password: 'lowercase123!',
      });
      expect(result.status).toBe(400);
      expect(result.body.error).toContain('大文字');
    });

    it('should reject passwords without lowercase', async () => {
      const result = await register({
        email: 'test@example.com',
        password: 'UPPERCASE123!',
      });
      expect(result.status).toBe(400);
      expect(result.body.error).toContain('小文字');
    });

    it('should reject passwords without numbers', async () => {
      const result = await register({
        email: 'test@example.com',
        password: 'NoNumbersHere!',
      });
      expect(result.status).toBe(400);
      expect(result.body.error).toContain('数字');
    });
  });

  describe('Password Strength (zxcvbn)', () => {
    it('should reject weak passwords like "password123!"', async () => {
      const result = await register({
        email: 'test@example.com',
        password: 'Password123!',
      });
      expect(result.status).toBe(400);
      expect(result.body.error).toContain('推測されやすい');
    });

    it('should reject passwords containing username', async () => {
      const result = await register({
        email: 'yamada@example.com',
        password: 'YamadaTaro123!',
      });
      expect(result.status).toBe(400);
    });
  });

  describe('Pwned Password Check', () => {
    it('should reject known breached passwords', async () => {
      const result = await register({
        email: 'test@example.com',
        password: 'P@ssw0rd123!', // 既知の漏洩パスワード
      });
      expect(result.status).toBe(400);
      expect(result.body.error).toContain('漏洩');
    });
  });
});
```

### 3.2 アカウントロックアウトテスト

```typescript
// __tests__/security/auth/lockout.test.ts
describe('Account Lockout', () => {
  const testUser = {
    email: 'locktest@example.com',
    password: 'CorrectPassword123!',
  };

  beforeAll(async () => {
    await createTestUser(testUser);
  });

  it('should allow 4 failed attempts without lockout', async () => {
    for (let i = 0; i < 4; i++) {
      const result = await login({
        email: testUser.email,
        password: 'WrongPassword123!',
      });
      expect(result.status).toBe(401);
    }

    // 正しいパスワードでログイン可能
    const result = await login(testUser);
    expect(result.status).toBe(200);
  });

  it('should lock account after 5 failed attempts', async () => {
    // リセット
    await resetFailedAttempts(testUser.email);

    for (let i = 0; i < 5; i++) {
      await login({
        email: testUser.email,
        password: 'WrongPassword123!',
      });
    }

    // ロック後は正しいパスワードでも拒否
    const result = await login(testUser);
    expect(result.status).toBe(423);
    expect(result.body.error).toContain('ロック');
  });

  it('should unlock account after 15 minutes', async () => {
    // 時間を進める（テスト環境）
    await advanceTime(16 * 60 * 1000);

    const result = await login(testUser);
    expect(result.status).toBe(200);
  });

  it('should reset failed attempts after successful login', async () => {
    await resetFailedAttempts(testUser.email);

    // 3回失敗
    for (let i = 0; i < 3; i++) {
      await login({
        email: testUser.email,
        password: 'WrongPassword123!',
      });
    }

    // 成功
    await login(testUser);

    // 再度3回失敗してもロックされない
    for (let i = 0; i < 3; i++) {
      await login({
        email: testUser.email,
        password: 'WrongPassword123!',
      });
    }

    const result = await login(testUser);
    expect(result.status).toBe(200);
  });
});
```

### 3.3 MFAテスト

```typescript
// __tests__/security/auth/mfa.test.ts
describe('MFA (TOTP)', () => {
  let user: TestUser;
  let mfaSecret: string;

  beforeAll(async () => {
    user = await createTestUserWithMFA();
    mfaSecret = user.mfaSecret;
  });

  describe('MFA Setup', () => {
    it('should generate valid TOTP secret', async () => {
      const result = await setupMFA(user.token);
      expect(result.status).toBe(200);
      expect(result.body.secret).toHaveLength(32);
      expect(result.body.qrCode).toMatch(/^data:image\/png;base64/);
      expect(result.body.backupCodes).toHaveLength(10);
    });

    it('should require verification to enable MFA', async () => {
      const result = await enableMFA(user.token, {
        code: 'invalid',
      });
      expect(result.status).toBe(400);
    });
  });

  describe('MFA Verification', () => {
    it('should accept valid TOTP code', async () => {
      const validCode = generateTOTP(mfaSecret);
      const result = await login({
        email: user.email,
        password: user.password,
        totpCode: validCode,
      });
      expect(result.status).toBe(200);
    });

    it('should reject invalid TOTP code', async () => {
      const result = await login({
        email: user.email,
        password: user.password,
        totpCode: '000000',
      });
      expect(result.status).toBe(401);
    });

    it('should reject expired TOTP code', async () => {
      const oldCode = generateTOTP(mfaSecret);
      await advanceTime(60 * 1000); // 60秒進める

      const result = await login({
        email: user.email,
        password: user.password,
        totpCode: oldCode,
      });
      expect(result.status).toBe(401);
    });

    it('should accept code within 30-second window', async () => {
      const code = generateTOTP(mfaSecret);
      await advanceTime(25 * 1000); // 25秒進める

      const result = await login({
        email: user.email,
        password: user.password,
        totpCode: code,
      });
      expect(result.status).toBe(200);
    });
  });

  describe('Backup Codes', () => {
    it('should accept valid backup code', async () => {
      const backupCode = user.backupCodes[0];
      const result = await login({
        email: user.email,
        password: user.password,
        backupCode,
      });
      expect(result.status).toBe(200);
    });

    it('should invalidate used backup code', async () => {
      const backupCode = user.backupCodes[1];

      // 1回目: 成功
      await login({
        email: user.email,
        password: user.password,
        backupCode,
      });

      // 2回目: 失敗
      const result = await login({
        email: user.email,
        password: user.password,
        backupCode,
      });
      expect(result.status).toBe(401);
    });
  });
});
```

---

## 4. 認可テスト (WSTG-ATHZ)

### 4.1 RBACテスト

```typescript
// __tests__/security/authz/rbac.test.ts
describe('Role-Based Access Control', () => {
  describe('User Role', () => {
    it('should allow user to read own data', async () => {
      const result = await api.get(`/users/${user.id}/profile`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      expect(result.status).toBe(200);
    });

    it('should allow user to update own data', async () => {
      const result = await api.patch(`/users/${user.id}/profile`, {
        headers: { Authorization: `Bearer ${user.token}` },
        body: { name: 'New Name' },
      });
      expect(result.status).toBe(200);
    });

    it('should deny user access to admin endpoints', async () => {
      const result = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      expect(result.status).toBe(403);
    });
  });

  describe('Admin Role', () => {
    it('should allow admin to access system settings', async () => {
      const result = await api.get('/admin/settings', {
        headers: { Authorization: `Bearer ${admin.token}` },
      });
      expect(result.status).toBe(200);
    });

    it('should deny admin access to user PII', async () => {
      const result = await api.get(`/users/${user.id}/financial-data`, {
        headers: { Authorization: `Bearer ${admin.token}` },
      });
      expect(result.status).toBe(403);
    });
  });
});
```

### 4.2 IDOR (Insecure Direct Object Reference) テスト

```typescript
// __tests__/security/authz/idor.test.ts
describe('IDOR Protection', () => {
  let userA: TestUser;
  let userB: TestUser;

  beforeAll(async () => {
    userA = await createTestUser({ email: 'usera@test.com' });
    userB = await createTestUser({ email: 'userb@test.com' });
  });

  it('should prevent user from accessing another user profile', async () => {
    const result = await api.get(`/users/${userB.id}/profile`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    expect(result.status).toBe(403);
  });

  it('should prevent user from updating another user data', async () => {
    const result = await api.patch(`/users/${userB.id}/profile`, {
      headers: { Authorization: `Bearer ${userA.token}` },
      body: { name: 'Hacked' },
    });
    expect(result.status).toBe(403);
  });

  it('should prevent user from deleting another user data', async () => {
    const result = await api.delete(`/users/${userB.id}/actions/1`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    expect(result.status).toBe(403);
  });

  it('should prevent enumeration via ID manipulation', async () => {
    // 連続IDを試行
    const results = await Promise.all(
      ['1', '2', '3', '999'].map(id =>
        api.get(`/users/${id}/profile`, {
          headers: { Authorization: `Bearer ${userA.token}` },
        })
      )
    );

    // 自分以外は全て403
    results.forEach((result, index) => {
      if (results[index].body.id !== userA.id) {
        expect(result.status).toBe(403);
      }
    });
  });
});
```

---

## 5. セッション管理テスト (WSTG-SESS)

### 5.1 セッションテスト

```typescript
// __tests__/security/session/session.test.ts
describe('Session Management', () => {
  describe('Session Token', () => {
    it('should generate cryptographically secure session ID', async () => {
      const sessions: string[] = [];

      for (let i = 0; i < 100; i++) {
        const result = await login(testUser);
        sessions.push(result.cookies.sessionToken);
      }

      // 全て一意
      const unique = new Set(sessions);
      expect(unique.size).toBe(100);

      // 十分な長さ
      sessions.forEach(token => {
        expect(token.length).toBeGreaterThanOrEqual(64);
      });
    });

    it('should regenerate session ID after login', async () => {
      // ログイン前のセッション
      const preLogin = await api.get('/');
      const preSessionId = preLogin.cookies.sessionToken;

      // ログイン
      const loginResult = await login(testUser);
      const postSessionId = loginResult.cookies.sessionToken;

      expect(postSessionId).not.toBe(preSessionId);
    });
  });

  describe('Session Timeout', () => {
    it('should expire session after 30 minutes of inactivity', async () => {
      const { token } = await login(testUser);

      // 30分経過
      await advanceTime(31 * 60 * 1000);

      const result = await api.get('/protected-resource', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(result.status).toBe(401);
    });

    it('should extend session on activity', async () => {
      const { token } = await login(testUser);

      // 25分経過
      await advanceTime(25 * 60 * 1000);

      // アクティビティ
      await api.get('/protected-resource', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // さらに25分経過（合計50分だがリセットされている）
      await advanceTime(25 * 60 * 1000);

      const result = await api.get('/protected-resource', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(result.status).toBe(200);
    });

    it('should enforce absolute timeout of 8 hours', async () => {
      const { token } = await login(testUser);

      // 8時間経過（途中でアクティビティあり）
      for (let i = 0; i < 16; i++) {
        await advanceTime(25 * 60 * 1000);
        await api.get('/protected-resource', {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // 絶対タイムアウト
      await advanceTime(30 * 60 * 1000);
      const result = await api.get('/protected-resource', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(result.status).toBe(401);
    });
  });

  describe('Cookie Security', () => {
    it('should set HttpOnly flag', async () => {
      const result = await login(testUser);
      expect(result.headers['set-cookie']).toContain('HttpOnly');
    });

    it('should set Secure flag in production', async () => {
      const result = await login(testUser);
      expect(result.headers['set-cookie']).toContain('Secure');
    });

    it('should set SameSite=Strict', async () => {
      const result = await login(testUser);
      expect(result.headers['set-cookie']).toContain('SameSite=Strict');
    });

    it('should use __Host- prefix', async () => {
      const result = await login(testUser);
      expect(result.headers['set-cookie']).toContain('__Host-');
    });
  });
});
```

---

## 6. 入力検証テスト (WSTG-INPV)

### 6.1 XSSテスト

```typescript
// __tests__/security/input/xss.test.ts
describe('XSS Prevention', () => {
  const xssPayloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    'javascript:alert(1)',
    '<iframe src="javascript:alert(1)">',
    '"><script>alert(1)</script>',
    "'-alert(1)-'",
    '<body onload=alert(1)>',
  ];

  describe('Stored XSS', () => {
    xssPayloads.forEach(payload => {
      it(`should sanitize: ${payload.substring(0, 30)}...`, async () => {
        // ユーザー名に入力
        await api.patch(`/users/${user.id}/profile`, {
          headers: { Authorization: `Bearer ${user.token}` },
          body: { name: payload },
        });

        // 取得して確認
        const result = await api.get(`/users/${user.id}/profile`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        expect(result.body.name).not.toContain('<script');
        expect(result.body.name).not.toContain('onerror');
        expect(result.body.name).not.toContain('javascript:');
      });
    });
  });

  describe('Reflected XSS', () => {
    xssPayloads.forEach(payload => {
      it(`should escape in response: ${payload.substring(0, 30)}...`, async () => {
        const encodedPayload = encodeURIComponent(payload);
        const result = await api.get(`/search?q=${encodedPayload}`);

        expect(result.body).not.toContain('<script');
        expect(result.headers['content-type']).toContain('application/json');
      });
    });
  });

  describe('DOM XSS', () => {
    it('should not execute script from LocalStorage', async () => {
      // Playwrightを使用
      await page.evaluate(() => {
        localStorage.setItem('lifeplan-storage', JSON.stringify({
          user: { name: '<script>window.xssExecuted=true</script>' }
        }));
      });

      await page.reload();
      const xssExecuted = await page.evaluate(() => window.xssExecuted);
      expect(xssExecuted).toBeUndefined();
    });
  });
});
```

### 6.2 CSRFテスト

```typescript
// __tests__/security/input/csrf.test.ts
describe('CSRF Protection', () => {
  it('should reject POST request without CSRF token', async () => {
    const result = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: 'Test' }),
    });

    expect(result.status).toBe(403);
    const body = await result.json();
    expect(body.error).toContain('CSRF');
  });

  it('should reject request with invalid CSRF token', async () => {
    const result = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'invalid-token',
      },
      credentials: 'include',
      body: JSON.stringify({ name: 'Test' }),
    });

    expect(result.status).toBe(403);
  });

  it('should accept request with valid CSRF token', async () => {
    // トークン取得
    const csrfResponse = await fetch(`${baseUrl}/api/csrf-token`, {
      credentials: 'include',
    });
    const { csrfToken } = await csrfResponse.json();

    const result = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Authorization': `Bearer ${user.token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ name: 'Test' }),
    });

    expect(result.status).toBe(200);
  });

  it('should reject cross-origin request', async () => {
    const result = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://evil.com',
      },
      body: JSON.stringify({ name: 'Hacked' }),
    });

    expect(result.status).toBe(403);
  });
});
```

### 6.3 SQLインジェクションテスト

```typescript
// __tests__/security/input/sql-injection.test.ts
describe('SQL Injection Prevention', () => {
  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' AND '1'='1",
    "admin'--",
    "' UNION SELECT * FROM users --",
    "1; SELECT * FROM users",
  ];

  sqlPayloads.forEach(payload => {
    it(`should prevent: ${payload}`, async () => {
      const result = await api.get(`/search?q=${encodeURIComponent(payload)}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // エラーにならない（入力として処理される）
      expect(result.status).not.toBe(500);

      // SQLエラーメッセージが漏洩しない
      expect(JSON.stringify(result.body)).not.toContain('SQL');
      expect(JSON.stringify(result.body)).not.toContain('syntax error');
    });
  });
});
```

---

## 7. エラー処理テスト (WSTG-ERRH)

```typescript
// __tests__/security/error/error-handling.test.ts
describe('Error Handling', () => {
  it('should not leak stack traces in production', async () => {
    const result = await api.get('/api/trigger-error');

    expect(result.body).not.toContain('at ');
    expect(result.body).not.toContain('.ts:');
    expect(result.body).not.toContain('node_modules');
  });

  it('should not leak database connection details', async () => {
    const result = await api.get('/api/db-error');

    expect(JSON.stringify(result.body)).not.toContain('postgresql://');
    expect(JSON.stringify(result.body)).not.toContain('password');
    expect(JSON.stringify(result.body)).not.toContain('localhost:5432');
  });

  it('should return generic error message for unexpected errors', async () => {
    const result = await api.get('/api/unexpected-error');

    expect(result.status).toBe(500);
    expect(result.body.message).toBe('An unexpected error occurred');
    expect(result.body.requestId).toBeDefined();
  });

  it('should log errors server-side', async () => {
    const requestId = await api.get('/api/trigger-error');

    // ログに記録されていることを確認（監視システム経由）
    const logs = await getServerLogs({ requestId: requestId.body.requestId });
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('error');
  });
});
```

---

## 8. 暗号化テスト (WSTG-CRYP)

```typescript
// __tests__/security/crypto/encryption.test.ts
describe('Encryption', () => {
  describe('Password Hashing', () => {
    it('should use Argon2id', async () => {
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    });

    it('should use sufficient memory cost', async () => {
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      // m=65536 (64MB)
      expect(user.passwordHash).toContain('m=65536');
    });
  });

  describe('Data at Rest', () => {
    it('should encrypt sensitive fields', async () => {
      // DBを直接クエリ
      const rawUser = await prisma.$queryRaw`
        SELECT annual_income FROM users WHERE id = ${testUser.id}
      `;

      // 暗号化されている（平文ではない）
      expect(rawUser[0].annual_income).not.toBe(testUser.annualIncome);
      expect(rawUser[0].annual_income).toMatch(/^encrypted:/);
    });
  });

  describe('TLS', () => {
    it('should only accept TLS 1.2 or higher', async () => {
      // TLS 1.1での接続を試行
      const result = await attemptTLS11Connection(baseUrl);
      expect(result.success).toBe(false);
    });

    it('should have valid certificate', async () => {
      const result = await checkCertificate(baseUrl);
      expect(result.valid).toBe(true);
      expect(result.expiresInDays).toBeGreaterThan(30);
    });
  });
});
```

---

## 9. クライアント側テスト (WSTG-CLNT)

### 9.1 セキュリティヘッダーテスト

```typescript
// __tests__/security/headers/security-headers.test.ts
describe('Security Headers', () => {
  let response: Response;

  beforeAll(async () => {
    response = await fetch(baseUrl);
  });

  it('should set Content-Security-Policy', () => {
    const csp = response.headers.get('content-security-policy');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('should set X-Frame-Options', () => {
    expect(response.headers.get('x-frame-options')).toBe('DENY');
  });

  it('should set X-Content-Type-Options', () => {
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('should set Strict-Transport-Security', () => {
    const hsts = response.headers.get('strict-transport-security');
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
  });

  it('should set Referrer-Policy', () => {
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
  });

  it('should set Permissions-Policy', () => {
    const pp = response.headers.get('permissions-policy');
    expect(pp).toContain('camera=()');
    expect(pp).toContain('microphone=()');
  });

  it('should not expose server information', () => {
    expect(response.headers.get('server')).toBeNull();
    expect(response.headers.get('x-powered-by')).toBeNull();
  });
});
```

### 9.2 LocalStorageセキュリティテスト

```typescript
// __tests__/security/client/localstorage.test.ts
describe('LocalStorage Security', () => {
  it('should not store sensitive data in LocalStorage', async () => {
    // Playwrightを使用
    await page.goto(baseUrl);
    await loginOnPage(page, testUser);

    const storage = await page.evaluate(() => {
      return JSON.stringify(localStorage);
    });

    expect(storage).not.toContain('password');
    expect(storage).not.toContain('annualIncome');
    expect(storage).not.toContain('email');
    expect(storage).not.toContain('birthDate');
  });

  it('should use SessionStorage for sensitive session data', async () => {
    await page.goto(baseUrl);
    await loginOnPage(page, testUser);

    // LocalStorageに機密データなし
    const localStorage = await page.evaluate(() =>
      JSON.stringify(window.localStorage)
    );
    expect(localStorage).not.toContain('token');

    // 新しいタブでセッションが継続しない
    const newPage = await browser.newPage();
    await newPage.goto(baseUrl);
    const isLoggedIn = await newPage.evaluate(() =>
      !!document.querySelector('[data-testid="user-menu"]')
    );
    expect(isLoggedIn).toBe(false);
  });
});
```

---

## 10. E2Eセキュリティテスト

```typescript
// e2e/security.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test.describe('Security E2E Tests', () => {
  test('should prevent clickjacking', async ({ page }) => {
    // iframeでの読み込みを試行
    await page.setContent(`
      <iframe src="${baseUrl}" id="target"></iframe>
    `);

    const frame = page.frame({ name: 'target' });
    expect(frame).toBeNull(); // X-Frame-Options: DENYにより読み込まれない
  });

  test('should enforce HTTPS redirect', async ({ page }) => {
    const response = await page.goto(baseUrl.replace('https://', 'http://'));
    expect(response?.url()).toMatch(/^https:/);
  });

  test('should not expose source maps in production', async ({ page }) => {
    await page.goto(baseUrl);

    // ソースマップへのアクセス
    const sourceMapUrl = `${baseUrl}/_next/static/chunks/main.js.map`;
    const response = await page.request.get(sourceMapUrl);
    expect(response.status()).toBe(404);
  });

  test('should log out on browser close (session only)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(baseUrl);
    await loginOnPage(page, testUser);

    // ブラウザを閉じる
    await context.close();

    // 新しいコンテキストで開く
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();
    await newPage.goto(baseUrl);

    // ログアウト状態
    await expect(newPage.locator('[data-testid="login-button"]')).toBeVisible();
  });
});
```

---

## 11. テスト実行手順

### 11.1 環境準備

```bash
# テスト用データベース準備
docker-compose -f docker-compose.test.yml up -d

# 依存関係インストール
npm install

# 環境変数設定
cp .env.test.example .env.test
```

### 11.2 テスト実行

```bash
# 全セキュリティテスト
npm run test:security

# カテゴリ別
npm run test:security:auth
npm run test:security:authz
npm run test:security:session
npm run test:security:input
npm run test:security:headers

# E2Eテスト
npm run test:e2e:security

# カバレッジ
npm run test:security -- --coverage
```

### 11.3 CI/CD統合

```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run test:security
      - run: npm run test:e2e:security

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 12. 合格基準

| カテゴリ | 合格条件 |
|----------|----------|
| 認証テスト | 100%パス |
| 認可テスト | 100%パス |
| セッションテスト | 100%パス |
| 入力検証テスト | 100%パス |
| エラー処理テスト | 100%パス |
| 暗号化テスト | 100%パス |
| セキュリティヘッダー | 100%パス |
| E2Eテスト | 100%パス |

---

**承認**

| 役職 | 署名 | 日付 |
|------|------|------|
| CISO | | 2025-12-11 |
| White Hacker | | |
| QA Lead | | |

---
*本ドキュメントは機密情報を含みます。取り扱いには十分ご注意ください。*
