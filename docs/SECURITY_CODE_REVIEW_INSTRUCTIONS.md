# LifePlan Navigator - セキュリティコードレビュー指示書

**発行日**: 2025-12-11
**発行者**: CISO (Chief Information Security Officer)
**対象者**: White Hacker, App Engineer, CSIRT Engineer
**分類**: 内部機密

---

## 1. レビュー概要

### 1.1 目的
本ドキュメントは、LifePlan Navigator Webアプリケーションのセキュリティコードレビューを実施するための指示書です。OWASP ASVS v4.0、NIST CSF 2.0に準拠したレビューを行います。

### 1.2 対象範囲
```
app/lifeplan-navigator/
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # Reactコンポーネント
│   ├── lib/            # ユーティリティ・ビジネスロジック
│   ├── data/           # モックデータ
│   └── types/          # TypeScript型定義
├── middleware.ts       # Next.js ミドルウェア
└── next.config.mjs     # Next.js設定
```

### 1.3 レビュー優先度
| 優先度 | 対象 | 理由 |
|--------|------|------|
| P0 (Critical) | CSRF実装の修正 | VER-001で指摘済み、機能しない状態 |
| P0 (Critical) | LocalStorage機密情報 | VULN-001で指摘済み |
| P1 (High) | 入力検証 | ランタイムバリデーション未実装 |
| P1 (High) | XSS対策 | サニタイゼーション未実装 |
| P2 (Medium) | CSP本番設定 | unsafe-inline/unsafe-eval除去 |

---

## 2. 重点レビュー項目

### 2.1 CSRF対策の修正（P0 - 即時対応）

**問題**: `middleware.ts:14` で `httpOnly: true` が設定されているが、`api-client.ts:14-20` で `document.cookie` からトークン取得を試みている。httpOnlyなCookieはJavaScriptからアクセス不可。

**レビュー対象ファイル**:
- `middleware.ts`
- `src/lib/csrf.ts`
- `src/lib/api-client.ts`

**修正方針選択（White Hacker判断）**:

#### 方式A: Synchronizer Token Pattern（推奨）
```typescript
// 新規ファイル: src/app/api/csrf-token/route.ts
import { NextResponse } from 'next/server'
import { generateCsrfToken } from '@/lib/csrf'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  let token = cookieStore.get('csrf-token')?.value

  if (!token) {
    token = generateCsrfToken()
    // サーバーサイドでセッションに保存
  }

  return NextResponse.json({ csrfToken: token })
}
```

#### 方式B: Double Submit Cookie修正
```typescript
// middleware.ts
response.cookies.set(CSRF_COOKIE_NAME, token, {
  httpOnly: false,  // 変更: クライアントからの読み取りを許可
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24,
})
```

**検証項目**:
- [ ] CSRFトークンがリクエストヘッダーに正しく付与される
- [ ] 不正なトークンで403が返る
- [ ] トークンなしで403が返る
- [ ] トークンがCORSで漏洩しない

---

### 2.2 LocalStorage機密情報保護（P0）

**問題**: `src/lib/store.ts:116-119` で個人情報が平文でLocalStorageに保存されている。

**レビュー対象ファイル**:
- `src/lib/store.ts`

**修正方針**:

```typescript
// src/lib/store.ts - 修正案
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 機密データは永続化から除外
const NON_SENSITIVE_KEYS = [
  'onboardingCompleted',
  'currentLifeStage',
] as const;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ... existing code
    }),
    {
      name: 'lifeplan-storage',
      storage: createJSONStorage(() => sessionStorage), // LocalStorage → SessionStorage
      partialize: (state) => ({
        // 機密情報を除外
        onboardingCompleted: state.onboardingCompleted,
        currentLifeStage: state.currentLifeStage,
        // user, notifications, nextActions は保存しない
      }),
    }
  )
);
```

**検証項目**:
- [ ] SessionStorageに機密データが保存されない
- [ ] タブ閉じ時にデータがクリアされる
- [ ] 必要な状態は維持される

---

### 2.3 入力検証の実装（P1）

**問題**: TypeScript型定義はあるが、ランタイムバリデーションがない。

**実装対象ファイル**:
- `src/lib/validation.ts` (新規作成)
- `src/lib/store.ts` (updateUser関数の修正)

**Zodスキーマ実装例**:
```typescript
// src/lib/validation.ts
import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['male', 'female', 'other']),
  prefecture: z.string().min(1).max(50),
  city: z.string().min(1).max(100),
  occupation: z.string().max(100).optional(),
  annualIncome: z.number().int().min(0).max(9999999999),
  householdSize: z.number().int().min(1).max(20),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
  hasChildren: z.boolean(),
  numberOfChildren: z.number().int().min(0).max(20),
  childrenAges: z.array(z.number().int().min(0).max(100)),
  housingType: z.enum(['rent', 'own', 'with_parents']),
});

export type ValidatedUserProfile = z.infer<typeof UserProfileSchema>;

export function validateUserUpdate(data: unknown): z.SafeParseReturnType<unknown, Partial<ValidatedUserProfile>> {
  return UserProfileSchema.partial().safeParse(data);
}
```

**検証項目**:
- [ ] 不正な型でエラーになる
- [ ] 境界値テスト（最大長、最小値等）
- [ ] SQLインジェクション文字列の無害化確認

---

### 2.4 XSS対策（P1）

**問題**: ユーザー入力が直接レンダリングされている箇所がある。

**レビュー対象ファイル**:
- `src/components/Dashboard.tsx:84` - `{user?.name || 'ゲスト'}`
- `src/components/NotificationPanel.tsx` - 通知メッセージ
- `src/components/BenefitCard.tsx` - 外部データ

**実装対象**:
```typescript
// src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // すべてのHTMLタグを除去
    ALLOWED_ATTR: [],
  });
}

// Reactコンポーネントで使用
// 変更前: {user?.name || 'ゲスト'}
// 変更後: {sanitizeText(user?.name) || 'ゲスト'}
```

**検証項目**:
- [ ] `<script>alert(1)</script>` が無害化される
- [ ] `<img src=x onerror=alert(1)>` が無害化される
- [ ] 正常なテキストは影響なし

---

### 2.5 CSP本番設定（P2）

**問題**: `next.config.mjs` で `'unsafe-inline'` `'unsafe-eval'` が許可されている。

**レビュー対象ファイル**:
- `next.config.mjs`

**本番用CSP設定例**:
```javascript
// next.config.mjs (本番環境用)
const isDev = process.env.NODE_ENV === 'development';

const cspDirectives = [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self'",  // Nonceベースに移行推奨
  "style-src 'self' 'unsafe-inline'",  // Tailwind CSS用
  "img-src 'self' data: https:",
  "font-src 'self'",
  isDev
    ? "connect-src 'self' http://localhost:8000"
    : "connect-src 'self' https://api.lifeplan-navigator.jp",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
];
```

---

## 3. レビュー手順

### 3.1 静的解析（SAST）

```bash
# 依存関係の脆弱性チェック
cd app/lifeplan-navigator
npm audit

# ESLintセキュリティルール適用
npx eslint --ext .ts,.tsx src/ --config .eslintrc.security.json

# TypeScript厳格モードチェック
npx tsc --noEmit --strict
```

### 3.2 動的解析（DAST）

```bash
# ローカル環境起動
npm run dev

# OWASP ZAP自動スキャン
zap-cli quick-scan --self-contained http://localhost:3000

# 手動テスト項目
# 1. CSRF: curl -X POST -H "X-CSRF-Token: invalid" http://localhost:3000/api/...
# 2. XSS: ユーザー名に <script>alert(1)</script> を入力
# 3. 認可: 他ユーザーのリソースにアクセス試行
```

### 3.3 ペネトレーションテスト項目

| # | テスト項目 | 手法 | 期待結果 |
|---|-----------|------|----------|
| 1 | CSRF攻撃 | 外部サイトからPOSTリクエスト | 403 Forbidden |
| 2 | XSS (Reflected) | URLパラメータにスクリプト | スクリプト無効化 |
| 3 | XSS (Stored) | 入力フォームにスクリプト | スクリプト無効化 |
| 4 | LocalStorage窃取 | XSS経由でLocalStorage読み取り | 機密データなし |
| 5 | クリックジャッキング | iframe埋め込み | 表示拒否 |
| 6 | オープンリダイレクト | URLパラメータ改ざん | 許可リスト外は拒否 |

---

## 4. 修正後の検証

### 4.1 自動テスト実行

```bash
# ユニットテスト
npm run test

# E2Eテスト
npm run test:e2e

# セキュリティテスト
npm run test:security
```

### 4.2 セキュリティスキャン

```bash
# Snyk脆弱性スキャン
snyk test

# OWASP Dependency Check
dependency-check --scan ./package.json
```

### 4.3 レビュー完了条件

- [ ] 全P0項目が修正され、再検証完了
- [ ] 全P1項目が修正され、テストパス
- [ ] 自動テスト100%パス
- [ ] ペネトレーションテスト全項目パス
- [ ] 依存関係に既知の脆弱性なし

---

## 5. 担当者・期限

| 項目 | 担当 | 期限 | 状態 |
|------|------|------|------|
| CSRF修正 | App Engineer | 2025-12-12 | 未着手 |
| CSRF検証 | White Hacker | 2025-12-13 | 待機 |
| LocalStorage修正 | App Engineer | 2025-12-12 | 未着手 |
| 入力検証実装 | App Engineer | 2025-12-14 | 未着手 |
| XSS対策実装 | App Engineer | 2025-12-14 | 未着手 |
| ペネトレーションテスト | White Hacker | 2025-12-15 | 待機 |
| 最終承認 | CISO | 2025-12-16 | 待機 |

---

## 6. エスカレーション

### 6.1 問題発生時の報告先

| 深刻度 | 報告先 | 対応時間 |
|--------|--------|----------|
| Critical | CISO, CSIRT Leader | 即時 |
| High | CSIRT Leader | 4時間以内 |
| Medium | App Engineer Lead | 24時間以内 |

### 6.2 連絡コマンド

```bash
# CISOへの報告
./agent-send.sh ciso "【セキュリティ報告】[Critical/High/Medium] 件名: 詳細"

# CSIRT Leaderへの報告
./agent-send.sh csirt_leader "【コードレビュー】問題発見: 詳細"

# White Hackerへの検証依頼
./agent-send.sh white_hacker "【検証依頼】修正完了: 対象ファイル、修正内容"
```

---

**承認**

| 役職 | 署名 | 日付 |
|------|------|------|
| CISO | | 2025-12-11 |
| CTO | | |
| CSIRT Leader | | |

---
*本ドキュメントは機密情報を含みます。取り扱いには十分ご注意ください。*
