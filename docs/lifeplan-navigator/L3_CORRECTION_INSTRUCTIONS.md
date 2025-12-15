# Layer 3 実行層への修正指示書

**文書番号**: LPN-L3-INS-001
**発行日**: 2025-12-11
**発行者**: CSIRT Team Leader
**優先度**: 緊急

---

## 1. 概要

MVP リリースに向けた品質監査の結果、以下の修正が必要です。
リリースブロッカーとなる項目を最優先で対応してください。

---

## 2. App Engineer への指示

### 2.1 【必須】CSRF実装の矛盾修正（VER-001）

**優先度**: 緊急（リリースブロッカー）
**期限**: 本日中

#### 問題の詳細
`middleware.ts` で CSRF トークン Cookie に `httpOnly: true` を設定しているが、`api-client.ts` で JavaScript から Cookie を読み取ろうとしており、CSRF 対策が機能しない。

#### 該当ファイル
- `middleware.ts:14`
- `src/lib/api-client.ts:14-20`

#### 修正オプション

**Option A: Double Submit Cookie を維持（推奨）**

```typescript
// middleware.ts を修正
response.cookies.set(CSRF_COOKIE_NAME, token, {
  httpOnly: false,  // JavaScript からの読み取りを許可
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24,
})
```

**Option B: Synchronizer Token Pattern に変更**

CSRFトークンをAPIエンドポイントで提供し、クライアントは初回アクセス時にトークンを取得する方式に変更。

#### 検証項目
修正後、以下を確認してください：
- [ ] CSRFトークンがリクエストヘッダーに正しく付与されること
- [ ] 不正なトークンでのリクエストが403で拒否されること
- [ ] トークンなしのリクエストが403で拒否されること

---

### 2.2 【推奨】入力検証ライブラリの導入（REC-001）

**優先度**: 中
**期限**: 1週間以内

#### 作業内容
1. Zod ライブラリをインストール
   ```bash
   npm install zod
   ```

2. `src/types/` 配下にスキーマを定義
3. `src/lib/store.ts` の `updateUser` 等で検証を実装

#### 参考実装
```typescript
import { z } from 'zod';

const UserProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  annualIncome: z.number().min(0).max(1000000000),
  // ...
});
```

---

### 2.3 【推奨】Error Boundary の実装（REC-002）

**優先度**: 中
**期限**: 1週間以内

#### 作業内容
1. `src/components/ErrorBoundary.tsx` を作成
2. `src/app/layout.tsx` でラップ

---

### 2.4 【推奨】本番環境 CSP 設定最適化（REC-003）

**優先度**: 中
**期限**: 本番デプロイ前

#### 作業内容
`next.config.mjs` の CSP 設定を環境変数で分岐し、本番環境では `unsafe-inline`、`unsafe-eval` を除去。

```javascript
const isDevelopment = process.env.NODE_ENV === 'development'

const scriptSrc = isDevelopment
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self'"
```

---

## 3. White Hacker への指示

### 3.1 【必須】CSRF修正後の再検証

**優先度**: 緊急
**期限**: App Engineer の修正完了後、速やかに

#### 検証項目
1. CSRFトークンがリクエストヘッダーに正しく付与されることの確認
2. 不正なトークンでのリクエストが403で拒否されることの確認
3. トークンなしのリクエストが403で拒否されることの確認
4. 検証結果を `SECURITY_VERIFICATION_REPORT.md` に追記

---

## 4. SOC Analyst への指示

### 4.1 【推奨】監視設定の検証準備

**優先度**: 低
**期限**: 本番デプロイ前

#### 作業内容
1. 検知ルールの動作確認手順を準備
2. テスト用アラート発報シナリオを作成

---

## 5. Network Engineer への指示

### 5.1 【情報】現時点で追加対応なし

ネットワーク設計・ファイアウォールポリシーは完成しています。
本番環境構築時に実装を行ってください。

---

## 6. CSIRT Engineer への指示

### 6.1 【推奨】監査ログ実装の準備

**優先度**: 低
**期限**: Phase 2

#### 作業内容
1. ログ管理設計書に基づく実装仕様の詳細化
2. バックエンドAPI構築後のログ実装

---

## 7. 進捗報告要求

### 7.1 報告タイミング
- App Engineer: CSRF修正完了時に報告
- White Hacker: 再検証完了時に報告

### 7.2 報告先
- CSIRT Team Leader
- Slack #lifeplan-development

### 7.3 報告フォーマット
```
【進捗報告】
担当: [担当者名]
タスク: [タスク名]
状態: [完了/進行中/ブロック]
詳細: [作業内容の詳細]
次のアクション: [次に行うこと]
```

---

## 8. エスカレーション

問題が発生した場合は、速やかに CSIRT Team Leader にエスカレーションしてください。

### エスカレーション条件
- 技術的な問題で修正が困難な場合
- 期限内の完了が困難な場合
- 追加のリソースが必要な場合

---

## 9. 完了条件

本フェーズの完了条件は以下の通りです：

1. [ ] CSRF実装の矛盾が解消されている
2. [ ] White Hackerによる再検証が完了している
3. [ ] Auditorによる最終監査が完了している
4. [ ] 全テストがパスしている
5. [ ] ビルドが成功している

---

**発行者署名**: CSIRT Team Leader
**日付**: 2025-12-11

---

*本文書は開発チーム内部向けです。*
