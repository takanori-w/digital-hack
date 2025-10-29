# 🦄 Organization Unicorn Team - Agent Communication System

## プロジェクト概要
CrystalBridgeは、行政の支援制度を漫画形式の説明とブロックチェーンベースのコミュニティ参加により、市民にとってアクセスしやすくするシビックテック・プラットフォームです。

このリポジトリは5つのAIエージェントが協力してプロジェクトを推進する、マルチエージェント通信システムです。

## エージェント構成（5エージェント体制）

### 【CEO層】
- **CEO** (別セッション: ceo): プロジェクト統括責任者
  - 役割: Project Orchestrator
  - 指示書: @instructions/01_CEO_Project_Orchestrator.md
  - セッション: `ceo:0`

### 【エグゼクティブチーム】
- **CTO** (unicorn-team:0.0): 技術戦略責任者
  - 役割: Technical Prophet
  - 指示書: @instructions/02_CTO_Technical_Prophet.md
  - ペイン位置: 左上

- **VP Sales** (unicorn-team:0.1): セールス責任者
  - 役割: Door Opener
  - 指示書: @instructions/03_VP_Sales_Door_Opener.md
  - ペイン位置: 右上

- **Head of Product** (unicorn-team:0.2): プロダクト責任者
  - 役割: Translator
  - 指示書: @instructions/04_Head_of_Product_Translator.md
  - ペイン位置: 左下

- **Lead Engineer** (unicorn-team:0.3): リードエンジニア
  - 役割: Velocity Hacker
  - 指示書: @instructions/05_Lead_Engineer_Velocity_Hacker.md
  - ペイン位置: 右下

## 画面レイアウト

```
┌─────────────────────────┐
│     CEO Session         │  ← 独立セッション（紫色）
│  (Project Orchestrator) │
└─────────────────────────┘

┌─────────────┬─────────────┐
│     CTO     │  VP Sales   │  ← unicorn-team session
│  (Tech)     │  (Sales)    │     左上: 赤, 右上: シアン
├─────────────┼─────────────┤
│   Head of   │    Lead     │
│   Product   │  Engineer   │     左下: 黄, 右下: 青
│ (Product)   │  (Eng)      │
└─────────────┴─────────────┘
```

## メッセージ送信方法

### 基本コマンド
```bash
./agent-send.sh [エージェント名] "[メッセージ]"
```

### エージェント名（エイリアス対応）
- **CEO**: `ceo`, `CEO`
- **CTO**: `cto`, `CTO`
- **VP Sales**: `vp_sales`, `VP_Sales`, `vpsales`
- **Head of Product**: `head_of_product`, `Head_of_Product`, `hop`
- **Lead Engineer**: `lead_engineer`, `Lead_Engineer`, `engineer`

### 使用例
```bash
# CEOにメッセージ送信
./agent-send.sh ceo "CrystalBridgeプロジェクトを開始してください"

# CTOに技術選定を依頼
./agent-send.sh cto "技術スタックの選定をお願いします"

# VP Salesに市場調査を依頼
./agent-send.sh vp_sales "ターゲット市場の調査を開始してください"

# Head of Productにユーザーストーリー作成を依頼
./agent-send.sh hop "ユーザーストーリーマップを作成してください"

# Lead Engineerにアーキテクチャ設計を依頼
./agent-send.sh engineer "システムアーキテクチャを設計してください"
```

## 基本フロー

```
CEO (統括)
  ↓ プロジェクトビジョンと目標を設定
  ↓
  ├→ CTO (技術戦略)
  │   └→ Lead Engineer (実装)
  │
  ├→ VP Sales (市場戦略)
  │   └→ Head of Product (プロダクト設計)
  │
  └→ 横断的コラボレーション
      ↓
   統合・レビュー
      ↓
  CEO (最終承認)
```

## 環境セットアップ

### 1. 初期セットアップ
```bash
# tmuxセッション作成（ceo + unicorn-team）
./setup.sh
```

### 2. エージェント起動
```bash
# 全エージェント一括起動
./launch-agents.sh

# または個別起動
tmux send-keys -t ceo 'claude --dangerously-skip-permissions' C-m
for i in {0..3}; do
  tmux send-keys -t unicorn-team:0.$i 'claude --dangerously-skip-permissions' C-m
done
```

### 3. 画面確認
```bash
# CEO画面
tmux attach-session -t ceo

# チーム画面
tmux attach-session -t unicorn-team

# セッション切り替え: Ctrl+b → s
# デタッチ: Ctrl+b → d
```

## プロジェクト管理

### 状況確認
```bash
# プロジェクト状況を確認
./project-status.sh

# リアルタイム監視（10秒ごと更新）
watch -n 10 ./project-status.sh
```

### 完了マーカー
各エージェントのタスク完了時に以下のファイルが作成されます：
```
./tmp/ceo_done.txt
./tmp/cto_done.txt
./tmp/vp_sales_done.txt
./tmp/head_of_product_done.txt
./tmp/lead_engineer_done.txt
```

### 作業ディレクトリ
全エージェントが共有する作業領域：
```
./workspace/[プロジェクト名]/
```

## よく使うコマンド

```bash
# エージェント一覧表示
./agent-send.sh --list

# セッション一覧
tmux ls

# 特定セッションにアタッチ
tmux attach-session -t [ceo|unicorn-team]

# 環境リセット
tmux kill-server
rm -rf ./tmp/*
./setup.sh
```

## トラブルシューティング

### セッションが見つからない
```bash
# セットアップ実行
./setup.sh
```

### エージェントが反応しない
```bash
# 状態確認
./project-status.sh

# 再起動
tmux kill-session -t ceo
tmux kill-session -t unicorn-team
./setup.sh
./launch-agents.sh
```

### メッセージが届かない
```bash
# ログ確認
cat logs/send_log.txt

# 手動テスト
./agent-send.sh ceo "テストメッセージ"
```

## プロジェクト技術要素

### 想定技術スタック
- **AI**: ライフイベントベースの制度レコメンド
- **漫画生成**: 4コマ漫画による手続き説明
- **ブロックチェーン**: NFT/SBTによるコミュニティ参加追跡
- **ステーブルコイン**: 地域経済循環のための報酬システム
- **QRコード**: イベントチェックインシステム

### ターゲットユーザー
- 行政支援を求める市民（出産、引っ越し、介護、起業、教育）
- アクセシビリティ改善を望む地方自治体
- コミュニティ報酬システムに参加する地域商店

## 参考情報

### 関連ドキュメント
- ビジネスプラン: `1.ビジネスプラン.md`
- ユースケース: `2.ユースケース.md`

### システム構成
- 元リポジトリ: [Akira-Papa/Claude-Code-Communication](https://github.com/Akira-Papa/Claude-Code-Communication)
- Claude Code公式: https://docs.anthropic.com/ja/docs/claude-code/overview
- Tmux Cheat Sheet: https://tmuxcheatsheet.com/
