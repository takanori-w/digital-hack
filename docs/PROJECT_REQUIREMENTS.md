# LifePlan Navigator - プロジェクト要件書

## 1. プロジェクト概要

### 1.1 プロジェクト名
LifePlan Navigator（ライフプランナビゲーター）

### 1.2 目的
市民の生活設計を支援するWebアプリケーション。補助金・税制優遇・お得情報を一元管理し、ライフステージに応じた最適なアクションを提案する。

### 1.3 ターゲットユーザー
- 20-40代の働く世代
- ライフイベント（結婚、出産、住宅購入）を控えた層
- 節約・資産形成に関心がある層

## 2. 機能要件

### 2.1 コア機能

| 機能ID | 機能名 | 説明 | 優先度 |
|--------|--------|------|--------|
| F001 | ユーザー情報管理 | ユーザープロファイルの永続的保持 | 高 |
| F002 | ライフステージ診断 | 現在のライフステージを自動判定 | 高 |
| F003 | お得情報表示 | 補助金・税制優遇・キャンペーン情報の一元表示 | 高 |
| F004 | ネクストアクション | やるべきことのリマインド機能 | 高 |
| F005 | シミュレーション | 3パターン（現状維持/成長/急成長）の将来予測 | 高 |
| F006 | 統計比較 | 同年収帯・平均との比較 | 中 |
| F007 | 法改正通知 | 税制改正等のプッシュ通知 | 中 |
| F008 | 投資効果計算 | 得した金額を投資に回した場合の効果 | 中 |

### 2.2 画面一覧

| 画面ID | 画面名 | 説明 |
|--------|--------|------|
| S001 | ランディングページ | サービス紹介・登録誘導 |
| S002 | ユーザー登録/ログイン | 認証画面 |
| S003 | オンボーディング | ライフステージ診断 |
| S004 | ダッシュボード | メイン画面（お得情報・ネクストアクション） |
| S005 | シミュレーション | 将来予測グラフ |
| S006 | 補助金・制度検索 | 制度の検索・フィルタリング |
| S007 | 設定 | プロフィール編集・通知設定 |

## 3. 非機能要件

### 3.1 パフォーマンス
- 初期表示: 3秒以内
- API応答: 1秒以内
- 同時接続: 1000ユーザー以上

### 3.2 可用性
- 稼働率: 99.9%以上
- 計画停止: 月1回、深夜帯のみ

### 3.3 セキュリティ
- HTTPS必須
- 個人情報の暗号化保存
- OWASP Top 10対策必須
- 多要素認証対応（将来）

### 3.4 スケーラビリティ
- 水平スケーリング対応
- CDN利用
- データベースレプリケーション

## 4. 技術スタック

### 4.1 フロントエンド
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- State: Zustand
- Charts: Recharts
- Icons: Lucide React

### 4.2 バックエンド
- Runtime: Node.js
- API: Next.js API Routes
- Database: PostgreSQL（本番）/ SQLite（プロトタイプ）

### 4.3 インフラ
- Hosting: Vercel / AWS
- CDN: CloudFront
- Monitoring: Datadog / CloudWatch

## 5. 外部API連携

| API名 | 用途 | URL |
|-------|------|-----|
| 統計ダッシュボードAPI | 統計データ取得 | https://dashboard.e-stat.go.jp/static/api |
| 都民のくらしむきAPI | 東京都統計データ | https://spec.api.metro.tokyo.lg.jp/ |
| 東洋経済データAPI | 経済データ | https://biz.toyokeizai.net/data/service/ |

## 6. 参考サービス

- 東京ライフデザインシミュレーター: https://life-design.metro.tokyo.lg.jp/
- 東京ライフ×キャリアシミュレーター: https://lifecareerplansim.metro.tokyo.lg.jp/
- 楽待: https://www.rakumachi.jp/
- 統計ダッシュボード: https://dashboard.e-stat.go.jp/

## 7. コンプライアンス要件

### 7.1 準拠法規
- 個人情報保護法
- 金融商品取引法
- GDPR（将来の海外展開時）

### 7.2 免責事項
- 本サービスは情報提供を目的としており、金融商品の勧誘を目的としない
- シミュレーション結果は参考値であり、実際の運用結果を保証しない

## 8. プロジェクト体制

### Layer 1: Strategic & Governance（経営層）
- CEO: プロジェクト統括
- CLO: 法務・コンプライアンス
- CISO: セキュリティ統括
- CFO: 収益モデル・財務
- CTO: 技術戦略
- CMO: マーケティング・UX

### Layer 2: Orchestration & Assurance（統括層）
- CSIRT Team Leader: インシデント対応統括
- Auditor: 監査・品質保証
- CTI Analyst: 脅威インテリジェンス

### Layer 3: Execution（実行層）
- SOC Analyst: セキュリティ監視
- White Hacker: 脆弱性診断
- CSIRT Engineer: フォレンジック・インシデント対応
- Network Engineer: インフラ・ネットワーク
- App Engineer: アプリケーション開発

## 9. 成果物一覧

| 成果物 | 担当 | 保存先 |
|--------|------|--------|
| アプリケーションコード | App Engineer | /app/lifeplan-navigator/ |
| 技術設計書 | CTO | /docs/ |
| セキュリティ要件定義書 | CISO | /docs/ |
| 法的リスク評価レポート | CLO | /docs/ |
| 収益モデル提案書 | CFO | /docs/ |
| UX設計書 | CMO | /docs/ |
| 監視設計書 | SOC Analyst | /docs/ |
| 脆弱性診断レポート | White Hacker | /docs/ |
| インシデント対応手順書 | CSIRT Team Leader | /docs/ |
| フォレンジック手順書 | CSIRT Engineer | /docs/ |
| ネットワーク設計書 | Network Engineer | /docs/ |
| 監査レポート | Auditor | /docs/ |
| 脅威分析レポート | CTI Analyst | /docs/ |

---

*Document Version: 1.0*
*Created: 2024-12-11*
*Author: Organization Unicorn Team*
