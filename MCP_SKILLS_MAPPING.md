# 🦄 Organization Unicorn Team - MCP & Skills マッピング

各エージェントの役割に最適化されたMCP（Model Context Protocol）とSkillsの割り当て案

---

## 👑 CEO (Project Orchestrator)

### 役割
プロジェクト全体の統括、ビジョン策定、チーム間調整、要件定義

### 推奨 MCP サーバー

#### 📋 プロジェクト管理
1. **Linear** - タスク・イシュー管理
   - プロジェクト進捗の可視化
   - マイルストーン管理
   - チームタスクの割り当て

2. **Notion** - ドキュメント・ナレッジベース
   - プロジェクト文書の作成・管理
   - ビジョン文書の整理
   - チーム間の情報共有

3. **Asana** または **ClickUp** - タスク管理代替
   - プロジェクトロードマップ
   - チームワークフロー管理

#### 💬 コミュニケーション
4. **Intercom** - 顧客コミュニケーション
   - ユーザーフィードバック収集
   - カスタマーサポート状況把握

5. **Fireflies** - ミーティング記録
   - 会議の要点抽出
   - アクションアイテム管理

#### 📊 分析・レポート
6. **Memory (MCP)** - ナレッジグラフ
   - プロジェクト知識の永続化
   - 意思決定履歴の記録

### 推奨 Skills

1. **Project Vision Creator** - プロジェクトビジョン策定
   ```yaml
   name: project-vision-creator
   description: プロジェクトビジョンと成功基準を策定
   ```

2. **Stakeholder Communication** - ステークホルダー向け資料作成
   ```yaml
   name: stakeholder-communication
   description: 経営層・投資家向けレポート作成
   ```

3. **OKR Generator** - OKR策定支援
   ```yaml
   name: okr-generator
   description: プロジェクトのObjectives & Key Results策定
   ```

4. **Team Coordinator** - チーム間調整
   ```yaml
   name: team-coordinator
   description: 各エージェントへのタスク割り当てと進捗管理
   ```

---

## 💻 CTO (Technical Prophet)

### 役割
技術戦略策定、アーキテクチャ設計、技術選定、セキュリティ監督

### 推奨 MCP サーバー

#### 🔧 開発ツール
1. **GitHub** - コードレビュー・リポジトリ管理
   - プルリクエストレビュー
   - コード品質チェック
   - リポジトリ構造分析

2. **Git (MCP)** - Gitリポジトリ操作
   - コミット履歴分析
   - ブランチ戦略管理

#### 🔒 セキュリティ
3. **Socket** - 依存関係セキュリティ分析
   - 脆弱性スキャン
   - ライセンス管理
   - サプライチェーン攻撃検出

4. **Sentry** - エラー監視
   - 本番環境エラー分析
   - パフォーマンス監視

#### ☁️ インフラ
5. **AWS** - クラウドインフラ管理
   - リソース管理
   - コスト最適化

6. **Cloudflare** - CDN・セキュリティ
   - トラフィック分析
   - DDoS対策
   - パフォーマンス最適化

7. **Vercel** または **Netlify** - デプロイメント
   - CI/CDパイプライン管理
   - プレビュー環境

#### 📚 ドキュメント
8. **Atlassian (Confluence)** - 技術ドキュメント
   - アーキテクチャ文書
   - 技術仕様書

### 推奨 Skills

1. **Architecture Reviewer** - アーキテクチャレビュー
   ```yaml
   name: architecture-reviewer
   description: システムアーキテクチャの評価と改善提案
   ```

2. **Tech Stack Analyzer** - 技術スタック分析
   ```yaml
   name: tech-stack-analyzer
   description: 技術選定の評価（スケーラビリティ、保守性、コスト）
   ```

3. **Security Auditor** - セキュリティ監査
   ```yaml
   name: security-auditor
   description: コードとインフラのセキュリティ評価
   ```

4. **Performance Optimizer** - パフォーマンス最適化
   ```yaml
   name: performance-optimizer
   description: アプリケーションパフォーマンスの分析と改善
   ```

---

## 💼 VP Sales (Door Opener)

### 役割
市場開拓、営業戦略、顧客関係管理、ビジネス開発

### 推奨 MCP サーバー

#### 👥 CRM・顧客管理
1. **HubSpot** - CRM・マーケティング
   - 顧客データ管理
   - リード管理
   - メールキャンペーン

2. **Intercom** - カスタマーサポート
   - 顧客会話履歴
   - チケット管理
   - ユーザーデータ分析

#### 💰 営業・決済
3. **Stripe** - 決済データ分析
   - 売上分析
   - サブスクリプション管理
   - 顧客課金状況

4. **PayPal** または **Square** - 決済代替

#### 📊 データ分析
5. **Airtable** - データ管理・分析
   - 営業パイプライン管理
   - 顧客データベース
   - レポート生成

6. **Daloopa** - 財務データ分析
   - 市場分析
   - 競合調査

#### 📢 コミュニケーション
7. **Canva** - 営業資料作成
   - プレゼンテーション
   - 提案書デザイン

### 推奨 Skills

1. **Market Research Analyzer** - 市場調査分析
   ```yaml
   name: market-research-analyzer
   description: ターゲット市場の分析とインサイト抽出
   ```

2. **Sales Pitch Generator** - セールスピッチ作成
   ```yaml
   name: sales-pitch-generator
   description: 顧客セグメント別のセールス資料作成
   ```

3. **Customer Persona Creator** - カスタマーペルソナ作成
   ```yaml
   name: customer-persona-creator
   description: ターゲット顧客のペルソナ定義
   ```

4. **Competitive Analysis** - 競合分析
   ```yaml
   name: competitive-analysis
   description: 競合製品・サービスの分析と差別化戦略
   ```

---

## 📱 Head of Product (Translator)

### 役割
プロダクト設計、UX/UI、ユーザーストーリー、要件の具体化

### 推奨 MCP サーバー

#### 🎨 デザイン
1. **Figma** - デザイン・プロトタイプ
   - デザインファイル参照
   - コンポーネント管理
   - デザインシステム

2. **Canva** - 簡易デザイン
   - プレゼンテーション
   - マーケティング資料

#### 📋 プロダクト管理
3. **Linear** - プロダクトロードマップ
   - 機能要求管理
   - ユーザーストーリー管理
   - スプリント計画

4. **Notion** - プロダクト文書
   - PRD (Product Requirements Document)
   - 機能仕様書
   - ユーザーリサーチ記録

5. **Atlassian (Jira)** - タスク管理代替

#### 👥 ユーザーリサーチ
6. **Intercom** - ユーザーフィードバック
   - カスタマーインサイト
   - ユーザー行動分析

7. **Fireflies** - ユーザーインタビュー
   - インタビュー記録
   - インサイト抽出

#### 🎬 メディア
8. **Cloudinary** - 画像・動画管理
   - アセット管理
   - メディア最適化

### 推奨 Skills

1. **User Story Writer** - ユーザーストーリー作成
   ```yaml
   name: user-story-writer
   description: ユーザー視点の機能要求をストーリー形式で記述
   ```

2. **PRD Generator** - プロダクト要求仕様書作成
   ```yaml
   name: prd-generator
   description: 機能のPRD（Product Requirements Document）作成
   ```

3. **UX Flow Designer** - UXフロー設計
   ```yaml
   name: ux-flow-designer
   description: ユーザージャーニーとUXフローの設計
   ```

4. **A/B Test Planner** - A/Bテスト計画
   ```yaml
   name: ab-test-planner
   description: 機能改善のためのA/Bテスト設計
   ```

5. **Wireframe Generator** - ワイヤーフレーム生成
   ```yaml
   name: wireframe-generator
   description: 機能のワイヤーフレーム作成
   ```

---

## ⚡ Lead Engineer (Velocity Hacker)

### 役割
実装、アーキテクチャ構築、高速開発、コード品質

### 推奨 MCP サーバー

#### 💻 開発ツール
1. **GitHub** - コード管理・レビュー
   - プルリクエスト作成
   - コードレビュー
   - イシュー管理

2. **Git (MCP)** - Gitリポジトリ操作
   - コミット管理
   - ブランチ操作
   - マージ処理

3. **Filesystem (MCP)** - ファイルシステム操作
   - セキュアなファイル操作
   - プロジェクト構造管理

#### 🐛 デバッグ・監視
4. **Sentry** - エラー追跡
   - バグ修正
   - パフォーマンス分析

5. **Jam** - デバッグ支援
   - 録画・コンソールログ
   - ネットワークリクエスト分析

#### 🚀 デプロイ・インフラ
6. **Vercel** または **Netlify** - デプロイメント
   - 自動デプロイ
   - プレビュー環境
   - プロジェクト管理

7. **Cloudflare** - CDN・最適化
   - パフォーマンス最適化
   - キャッシュ管理

#### 🗄️ データベース
8. **PostgreSQL (MCP)** または **MySQL (MCP)** - データベース
   - クエリ実行
   - スキーマ管理
   - データ分析

#### 🤖 AI・自動化
9. **Hugging Face** - AI/ML機能
   - モデル統合
   - Gradioアプリ

10. **Zapier** または **Workato** - 自動化
    - ワークフロー自動化
    - API統合

#### 📦 パッケージ管理
11. **Socket** - 依存関係セキュリティ
    - 脆弱性チェック
    - ライセンス確認

### 推奨 Skills

1. **Code Generator** - コード生成
   ```yaml
   name: code-generator
   description: 設計書からコードの自動生成
   ```

2. **Test Writer** - テストコード作成
   ```yaml
   name: test-writer
   description: ユニット・統合テストの自動生成
   ```

3. **API Designer** - API設計
   ```yaml
   name: api-designer
   description: RESTful/GraphQL APIの設計と実装
   ```

4. **Database Schema Designer** - DB設計
   ```yaml
   name: database-schema-designer
   description: データベーススキーマの設計と最適化
   ```

5. **Code Refactorer** - リファクタリング
   ```yaml
   name: code-refactorer
   description: コード品質向上のためのリファクタリング提案
   ```

6. **Performance Profiler** - パフォーマンス分析
   ```yaml
   name: performance-profiler
   description: コードパフォーマンスのボトルネック特定
   ```

7. **CI/CD Pipeline Builder** - CI/CD構築
   ```yaml
   name: cicd-pipeline-builder
   description: 自動ビルド・テスト・デプロイパイプライン構築
   ```

---

## 📊 優先度マトリクス

### 必須 MCP（全エージェント共通）
- **Memory (MCP)** - プロジェクト知識の永続化
- **Filesystem (MCP)** - ファイル操作
- **Time (MCP)** - 時間管理

### 高優先度 MCP（役割別）

| エージェント | 必須MCP | 推奨MCP |
|------------|---------|---------|
| **CEO** | Notion, Linear | Asana, Memory |
| **CTO** | GitHub, Git, Socket | Sentry, AWS, Cloudflare |
| **VP Sales** | HubSpot, Stripe | Intercom, Airtable |
| **Head of Product** | Figma, Linear, Notion | Intercom, Canva |
| **Lead Engineer** | GitHub, Git, Filesystem | Sentry, Vercel, PostgreSQL |

---

## 🔧 実装優先順位

### Phase 1: 基本セットアップ（即時）
1. **全エージェント**: Memory, Filesystem, Time
2. **Lead Engineer**: GitHub, Git
3. **CEO**: Notion または Linear

### Phase 2: 役割特化（1週間以内）
1. **CTO**: Socket, Sentry
2. **VP Sales**: HubSpot または Airtable
3. **Head of Product**: Figma, Linear

### Phase 3: 高度な統合（2週間以内）
1. デプロイメント系（Vercel, Netlify, Cloudflare）
2. 自動化系（Zapier, Workato）
3. 専門ツール（Hugging Face, Jam）

---

## 💡 カスタムスキル開発の推奨順序

### 即座に作成すべきスキル
1. **Project Vision Creator** (CEO用)
2. **User Story Writer** (Head of Product用)
3. **Code Generator** (Lead Engineer用)

### 次に作成すべきスキル
4. **Architecture Reviewer** (CTO用)
5. **Market Research Analyzer** (VP Sales用)
6. **Test Writer** (Lead Engineer用)

### 長期的に作成すべきスキル
7. その他の専門スキル（役割特化型）

---

## 📝 次のステップ

1. ✅ このマッピングをレビュー
2. ⬜ 優先度の高いMCPサーバーを選択
3. ⬜ 各エージェント用の `.claude/settings.local.json` を作成
4. ⬜ カスタムスキルの開発開始
5. ⬜ 実運用でフィードバック収集・改善

---

**作成日**: 2025-10-29
**プロジェクト**: Organization Unicorn Team
**目的**: CrystalBridge プロジェクトの効率的な開発
