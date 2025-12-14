# LifePlan Navigator - 利用ガイド

## クイックスタート

### 1. 依存関係のインストール

```bash
cd app/lifeplan-navigator
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

サーバーが起動したら、ブラウザで http://localhost:3000 にアクセスしてください。

### 3. 本番ビルド

```bash
npm run build
npm run start
```

## ページ一覧

| ページ | URL | 説明 |
|--------|-----|------|
| トップページ | http://localhost:3000 | ランディングページ |
| ログイン | http://localhost:3000/login | ログイン画面 |
| 新規登録 | http://localhost:3000/register | アカウント作成 |
| オンボーディング | http://localhost:3000/onboarding | 初期設定ウィザード（4ステップ） |
| 設定 | http://localhost:3000/settings | ユーザー設定・MFA設定 |
| 給付金情報 | http://localhost:3000/benefits | 給付金・補助金一覧 |
| MFA認証 | http://localhost:3000/auth/mfa-verify | 二要素認証 |

## テスト用アカウント

開発環境では以下のデモアカウントが利用可能です：

- **メールアドレス**: `demo@example.com`
- **パスワード**: `DemoPass123!`

## 主な機能

### 1. ユーザー認証
- メール/パスワードによるログイン
- 新規ユーザー登録
- MFA（二要素認証）対応
- CSRF対策実装済み

### 2. オンボーディング
4ステップの初期設定ウィザード：
1. **基本情報**: 年齢、職業、年収
2. **居住情報**: 都道府県、住居形態
3. **家族構成**: 配偶者、子供の情報
4. **将来の計画**: ライフプラン目標

### 3. 給付金情報
- パーソナライズされた給付金・補助金情報
- 申請期限のアラート
- カテゴリ別フィルタリング

### 4. セキュリティ設定
- パスワード変更
- MFA（TOTP）の有効化/無効化
- 通知設定

## API エンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/auth/login` | POST | ログイン |
| `/api/auth/register` | POST | ユーザー登録 |
| `/api/auth/logout` | POST | ログアウト |
| `/api/auth/mfa/setup` | POST | MFA設定 |
| `/api/auth/mfa/verify` | POST | MFA認証 |
| `/api/csrf-token` | GET | CSRFトークン取得 |
| `/api/onboarding` | GET/POST | オンボーディングデータ |
| `/api/benefits` | GET | 給付金情報取得 |
| `/api/settings` | GET/POST | ユーザー設定 |
| `/api/user/profile` | GET/PUT | プロフィール |
| `/api/user/notifications` | GET | 通知一覧 |

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **認証**: NextAuth.js v5
- **認可**: CASL (Role-Based Access Control)
- **スタイリング**: Tailwind CSS
- **アイコン**: Lucide React
- **バリデーション**: Zod

## セキュリティ機能

- CSRF対策（Synchronizer Token Pattern）
- パスワードハッシュ化（PBKDF2-SHA512, 600,000 iterations）
- MFA対応（TOTP）
- セッション管理
- レート制限
- 入力値バリデーション

## 開発者向け情報

### ディレクトリ構成

```
src/
├── app/                    # Next.js App Router ページ
│   ├── api/               # API ルート
│   ├── auth/              # 認証関連ページ
│   ├── onboarding/        # オンボーディング
│   └── ...
├── components/            # React コンポーネント
│   ├── onboarding/       # オンボーディング用
│   ├── providers/        # Context Providers
│   └── ui/               # 共通UI
└── lib/                   # ユーティリティ
    ├── auth/             # 認証ロジック
    └── authorization/    # 認可ロジック (CASL)
```

### 環境変数

本番環境では以下の環境変数を設定してください：

```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

## トラブルシューティング

### ポートが使用中の場合

```bash
# 3000番ポートを使用しているプロセスを確認
lsof -i :3000

# 別のポートで起動
PORT=3001 npm run dev
```

### キャッシュクリア

```bash
rm -rf .next
npm run dev
```

## ライセンス

Copyright (c) 2024 LifePlan Navigator. All rights reserved.
