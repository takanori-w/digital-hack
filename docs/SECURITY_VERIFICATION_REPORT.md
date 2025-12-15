# LifePlan Navigator - セキュリティ実装検証レポート

**検証日**: 2025-12-11
**検証担当**: White Hacker (Security Assessment Team)
**対象**: App Engineerによるセキュリティ実装

---

## 1. 検証サマリ

| 項目 | 結果 | 詳細 |
|------|------|------|
| **CSRF対策** | 要修正 | 設計上の矛盾あり |
| **セキュリティヘッダー** | 良好 | 一部改善推奨 |
| **XSS対策（CSP）** | 良好 | 開発用設定の本番除外が必要 |

### 総合評価: 条件付き合格（修正後再検証必要）

---

## 2. CSRF対策の検証

### 2.1 実装内容の確認

| ファイル | 内容 |
|----------|------|
| `src/lib/csrf.ts` | トークン生成・検証ロジック |
| `middleware.ts` | Double Submit Cookie方式の実装 |
| `src/lib/api-client.ts` | クライアント側のトークン付与 |

### 2.2 良好な点

#### トークン生成 (`csrf.ts:11-13`)
```typescript
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
```
- 暗号論的に安全な乱数生成器を使用
- 256ビット（32バイト）の十分なエントロピー
- 64文字のHex文字列として出力

#### タイミング攻撃対策 (`csrf.ts:30-43`)
```typescript
export function validateCsrfToken(token1: string, token2: string): boolean {
  // ...length check...
  return crypto.timingSafeEqual(
    Buffer.from(token1, 'utf8'),
    Buffer.from(token2, 'utf8')
  )
}
```
- `crypto.timingSafeEqual()`による定数時間比較
- タイミング攻撃を防止

#### Cookie設定 (`middleware.ts:13-19`)
```typescript
response.cookies.set(CSRF_COOKIE_NAME, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24,
})
```
- `__Host-`プレフィックスの使用
- `sameSite: 'strict'`による追加保護
- 本番環境での`secure`フラグ

### 2.3 重大な問題: httpOnlyとDouble Submit Cookieの矛盾

**問題箇所**: `middleware.ts:14` と `api-client.ts:14-20`

```typescript
// middleware.ts - Cookie設定
httpOnly: true,  // JavaScriptからアクセス不可

// api-client.ts - トークン取得
function getCsrfTokenFromCookie(): string | null {
  const match = document.cookie.match(...)  // httpOnlyなのでアクセス不可！
  return match ? match[1] : null
}
```

**問題の説明**:
- `httpOnly: true`に設定されたCookieはJavaScriptからアクセスできない
- `api-client.ts`の`getCsrfTokenFromCookie()`は常に`null`を返す
- CSRFトークンがリクエストヘッダーに付与されず、CSRF対策が機能しない

**影響度**: **Critical** - CSRF対策が実質的に無効

### 2.4 推奨修正案

#### 方式A: Synchronizer Token Pattern（推奨）

サーバーサイドでトークンを生成し、HTMLまたはAPIレスポンスでクライアントに渡す。

```typescript
// pages/api/csrf-token.ts
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = generateCsrfToken()

  // セッションにトークンを保存
  req.session.csrfToken = token

  // クライアントに返却
  res.json({ csrfToken: token })
}
```

#### 方式B: Double Submit Cookieの修正

httpOnlyを無効化し、別のCookieをトークン用に使用。

```typescript
// middleware.ts
response.cookies.set(CSRF_COOKIE_NAME, token, {
  httpOnly: false,  // クライアントからの読み取りを許可
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24,
})
```

**注意**: 方式Bの場合、XSS脆弱性があるとトークンが窃取されるリスクがあります。CSPの強化が必須です。

---

## 3. セキュリティヘッダーの検証

### 3.1 実装されたヘッダー一覧

| ヘッダー | 値 | 評価 |
|----------|-----|------|
| Content-Security-Policy | 複合設定 | 良好 |
| X-Frame-Options | DENY | 良好 |
| X-Content-Type-Options | nosniff | 良好 |
| Referrer-Policy | strict-origin-when-cross-origin | 良好 |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | 良好 |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | 良好 |
| X-DNS-Prefetch-Control | on | 良好 |
| X-XSS-Protection | 1; mode=block | 良好 |

### 3.2 CSPの詳細検証

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';  // 要改善
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self' http://localhost:8000 https://api.lifeplan-navigator.jp;
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
upgrade-insecure-requests;
```

#### 良好な点
- `default-src 'self'` - デフォルトで自己オリジンのみ許可
- `frame-ancestors 'none'` - クリックジャッキング対策
- `form-action 'self'` - フォーム送信先の制限
- `base-uri 'self'` - Base URLインジェクション対策
- `upgrade-insecure-requests` - HTTPSへの自動アップグレード

#### 改善推奨事項

**1. 本番環境でのunsafe-inline/unsafe-eval除去**

```typescript
// next.config.mjs
const isDevelopment = process.env.NODE_ENV === 'development'

const scriptSrc = isDevelopment
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'nonce-${generateNonce()}'"  // Nonceベースに変更
```

**2. connect-srcからlocalhost除去（本番環境）**

```typescript
const connectSrc = isDevelopment
  ? "connect-src 'self' http://localhost:8000"
  : "connect-src 'self' https://api.lifeplan-navigator.jp"
```

### 3.3 middlewareでの追加ヘッダー

`middleware.ts:42-44`でも以下のヘッダーが設定されています：
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection

`next.config.mjs`と重複していますが、middlewareでの設定が優先される動的ルートもあるため、両方での設定は問題ありません。

---

## 4. XSS脆弱性の残存確認

### 4.1 CSPによる緩和

CSPの実装により、XSS攻撃の影響は大幅に緩和されています。

| 攻撃ベクター | 緩和状況 |
|-------------|---------|
| インラインスクリプト | 部分的緩和（unsafe-inline許可中） |
| eval() | 部分的緩和（unsafe-eval許可中） |
| 外部スクリプト読み込み | 完全緩和 |
| データ窃取（XHR） | 緩和（connect-src制限） |

### 4.2 残存リスク

現状のCSP設定では、以下の攻撃は依然として可能です：

1. **インラインスクリプト実行**: `'unsafe-inline'`が許可されているため
2. **eval()使用**: `'unsafe-eval'`が許可されているため

本番環境では、Nonceベースまたはハッシュベースのインラインスクリプト許可への移行を推奨します。

---

## 5. テストコードの検証

### 5.1 ユニットテスト (`csrf.test.ts`)

| テストケース | 結果 | 評価 |
|-------------|------|------|
| 64文字Hex生成 | 良好 |  |
| トークンの一意性 | 良好 |  |
| 暗号的ランダム性 | 良好 |  |
| トークン一致検証 | 良好 |  |
| 空トークン処理 | 良好 |  |
| 長さ不一致処理 | 良好 |  |
| 大文字小文字区別 | 良好 |  |

テストカバレッジは良好ですが、以下の追加テストを推奨：

```typescript
// 追加推奨テストケース
it('should prevent timing attacks', () => {
  // タイミング攻撃耐性の測定
})

it('should reject null/undefined tokens', () => {
  expect(validateCsrfToken(null as any, 'token')).toBe(false)
  expect(validateCsrfToken('token', undefined as any)).toBe(false)
})
```

---

## 6. 検証結果まとめ

### 6.1 修正必須項目

| ID | 項目 | 深刻度 | 対応 |
|----|------|--------|------|
| VER-001 | CSRF httpOnly/Double Submit矛盾 | Critical | 即時修正 |

### 6.2 改善推奨項目

| ID | 項目 | 深刻度 | 対応 |
|----|------|--------|------|
| VER-002 | CSP unsafe-inline/unsafe-eval | Medium | 本番前に対応 |
| VER-003 | connect-src localhost | Low | 本番前に対応 |

### 6.3 良好な実装

- セキュリティヘッダーの包括的な設定
- CSRFトークン生成ロジック
- タイミング攻撃対策
- テストカバレッジ

---

## 7. 再検証について

VER-001の修正完了後、以下の項目について再検証を実施します：

1. CSRFトークンがリクエストヘッダーに正しく付与されることの確認
2. 不正なトークンでのリクエストが403で拒否されることの確認
3. トークンなしのリクエストが403で拒否されることの確認

---

**検証担当者署名**: White Hacker
**所属**: CSIRT Security Assessment Team

---
*本レポートは機密情報を含みます。取り扱いには十分ご注意ください。*
