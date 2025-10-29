#!/bin/bash

# 🚀 Multi-Agent Communication Demo 環境構築（5エージェント版）
# Organization Unicorn Team専用

set -e  # エラー時に停止

# 色付きログ関数
log_info() {
    echo -e "\033[1;32m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[1;34m[SUCCESS]\033[0m $1"
}

echo "🦄 Organization Unicorn Team - Multi-Agent 環境構築"
echo "======================================================"
echo ""

# STEP 1: 既存セッションクリーンアップ
log_info "🧹 既存セッションクリーンアップ開始..."

tmux kill-session -t unicorn-team 2>/dev/null && log_info "unicorn-teamセッション削除完了" || log_info "unicorn-teamセッションは存在しませんでした"
tmux kill-session -t ceo 2>/dev/null && log_info "ceoセッション削除完了" || log_info "ceoセッションは存在しませんでした"

# ディレクトリ準備
mkdir -p ./tmp
mkdir -p ./logs
mkdir -p ./workspace

# 完了ファイルクリア
rm -f ./tmp/agent*_done.txt 2>/dev/null && log_info "既存の完了ファイルをクリア" || log_info "完了ファイルは存在しませんでした"

log_success "✅ クリーンアップ完了"
echo ""
echo "📁 作業ディレクトリ:"
echo "   - ./tmp/        完了マーカー用"
echo "   - ./logs/       通信ログ用"
echo "   - ./workspace/  プロダクト開発用"
echo ""

# workspace/README.md 自動生成
log_info "📝 workspace/README.md を生成中..."
cat > ./workspace/README.md << 'WORKSPACE_README_EOF'
# 📁 Workspace ディレクトリ

## 概要

このディレクトリは、AIエージェントがプロダクト開発を行う際の**共有作業領域**です。
全エージェント（CEO、CTO、VP Sales、Head of Product、Lead Engineer）が、このディレクトリ内でファイルを作成・編集します。

**重要:** このディレクトリの内容は Git で追跡されません。
各プロダクトは別リポジトリとして管理することを推奨します。

## ディレクトリ構造

プロジェクトごとにサブディレクトリが作成されます：

```
workspace/
├── README.md                    # このファイル（setup.shで自動生成）
├── crystalbridge/               # CrystalBridgeプロジェクト
│   ├── README.md               # プロジェクト概要
│   ├── docs/                   # ドキュメント
│   ├── frontend/               # フロントエンド
│   ├── backend/                # バックエンド
│   ├── blockchain/             # ブロックチェーン
│   ├── infrastructure/         # インフラ
│   └── tests/                  # テスト
└── [other-project]/            # 他のプロジェクト
```

## プロジェクト開始

```bash
./agent-send.sh ceo "
あなたはCEOです。

CrystalBridgeプロジェクトを開始してください。
作業ディレクトリ: workspace/crystalbridge/

プロジェクト概要:
- 市民と行政を繋ぐシビックテック・プラットフォーム
- 漫画形式での制度説明
- ブロックチェーンによるコミュニティ参加追跡
"
```

## ファイル確認

```bash
# プロジェクトの内容を確認
ls -la workspace/crystalbridge/

# ツリー表示
tree workspace/crystalbridge/

# リアルタイム監視
watch -n 5 'tree workspace/crystalbridge/'
```

## プロダクトをGit管理（推奨）

各プロダクトは別リポジトリとして管理することを推奨します：

```bash
# プロジェクトディレクトリに移動
cd workspace/crystalbridge

# Gitリポジトリを初期化
git init

# .gitignoreを作成（必要に応じて）
cat > .gitignore << 'EOF'
node_modules/
.env
dist/
build/
.DS_Store
EOF

# 初回コミット
git add .
git commit -m "Initial commit by AI team"

# リモートリポジトリに接続（GitHubなど）
git remote add origin https://github.com/yourusername/crystalbridge.git
git branch -M main
git push -u origin main
```

## 各エージェントの作業領域

- **CEO**: プロジェクト概要、ビジョン、要件定義
- **CTO**: アーキテクチャ、技術選定、インフラ設計
- **VP Sales**: 市場調査、顧客分析、Go-to-Market戦略
- **Head of Product**: ユーザーストーリー、プロダクト仕様、UI/UX設計
- **Lead Engineer**: 実装（フロントエンド/バックエンド/ブロックチェーン）

## ベストプラクティス

1. **プロジェクト命名**: 小文字とハイフン（例: `crystal-bridge`）
2. **ドキュメント優先**: 実装前に必ずドキュメント作成
3. **相互参照**: エージェント間で相対パスを使用
4. **別リポジトリ管理**: 各プロダクトは独立したGitリポジトリに

---

**このファイルについて:**
- このREADMEは `./setup.sh` で自動生成されます
- organization_unicorn_teamリポジトリには含まれません
- 削除されても `./setup.sh` で再生成できます
WORKSPACE_README_EOF

log_success "✅ workspace/README.md 生成完了"
echo ""

# STEP 2: unicorn-teamセッション作成（4ペイン：CTO + VP_Sales + Head_of_Product + Lead_Engineer）
log_info "📺 unicorn-teamセッション作成開始 (4ペイン)..."

# 最初のペイン作成
tmux new-session -d -s unicorn-team -n "team"

# 2x2グリッド作成（合計4ペイン）
tmux split-window -h -t "unicorn-team:0"      # 水平分割（左右）
tmux select-pane -t "unicorn-team:0.0"
tmux split-window -v                          # 左側を垂直分割
tmux select-pane -t "unicorn-team:0.2"
tmux split-window -v                          # 右側を垂直分割

# ペインタイトル設定
log_info "ペインタイトル設定中..."
PANE_TITLES=("CTO" "VP_Sales" "Head_of_Product" "Lead_Engineer")
PANE_COLORS=("\033[1;31m" "\033[1;36m" "\033[1;33m" "\033[1;34m")  # 赤、シアン、黄、青

for i in {0..3}; do
    tmux select-pane -t "unicorn-team:0.$i" -T "${PANE_TITLES[$i]}"

    # 作業ディレクトリ設定
    tmux send-keys -t "unicorn-team:0.$i" "cd $(pwd)" C-m

    # カラープロンプト設定
    tmux send-keys -t "unicorn-team:0.$i" "export PS1='(${PANE_COLORS[$i]}${PANE_TITLES[$i]}\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m

    # ウェルカムメッセージ
    tmux send-keys -t "unicorn-team:0.$i" "echo '=== ${PANE_TITLES[$i]} エージェント ==='" C-m
    tmux send-keys -t "unicorn-team:0.$i" "echo '指示書: instructions/0$((i+2))_*.md'" C-m
done

log_success "✅ unicorn-teamセッション作成完了"
echo ""

# STEP 3: ceoセッション作成（1ペイン）
log_info "👑 CEOセッション作成開始..."

tmux new-session -d -s ceo
tmux send-keys -t ceo "cd $(pwd)" C-m
tmux send-keys -t ceo "export PS1='(\[\033[1;35m\]CEO\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m
tmux send-keys -t ceo "echo '=== CEO (Project Orchestrator) ==='" C-m
tmux send-keys -t ceo "echo 'プロジェクト統括責任者'" C-m
tmux send-keys -t ceo "echo '指示書: instructions/01_CEO_Project_Orchestrator.md'" C-m
tmux send-keys -t ceo "echo '=================================='" C-m

log_success "✅ CEOセッション作成完了"
echo ""

# STEP 4: 環境確認・表示
log_info "🔍 環境確認中..."

echo ""
echo "📊 セットアップ結果:"
echo "==================="

# tmuxセッション確認
echo "📺 Tmux Sessions:"
tmux list-sessions
echo ""

# ペイン構成表示
echo "📋 ペイン構成:"
echo "  unicorn-teamセッション（4ペイン）:"
echo "    ┌─────────────┬─────────────┐"
echo "    │ Pane 0: CTO │ Pane 1: VP  │"
echo "    │  (Tech)     │  (Sales)    │"
echo "    ├─────────────┼─────────────┤"
echo "    │ Pane 2: HoP │ Pane 3: LE  │"
echo "    │  (Product)  │  (Engineer) │"
echo "    └─────────────┴─────────────┘"
echo ""
echo "  ceoセッション（1ペイン）:"
echo "    CEO (Project Orchestrator) - プロジェクト統括"

echo ""
log_success "🎉 Organization Unicorn Team 環境セットアップ完了！"
echo ""
echo "📋 次のステップ:"
echo "  1. 🔗 セッションアタッチ:"
echo "     tmux attach-session -t unicorn-team   # チーム確認"
echo "     tmux attach-session -t ceo            # CEO確認"
echo ""
echo "  2. 🤖 Claude Code起動:"
echo "     # 手順1: CEO認証"
echo "     tmux send-keys -t ceo 'claude --dangerously-skip-permissions' C-m"
echo "     # 手順2: 認証後、チーム一括起動"
echo "     for i in {0..3}; do tmux send-keys -t unicorn-team:0.\$i 'claude --dangerously-skip-permissions' C-m; done"
echo ""
echo "  3. 📜 指示書確認:"
echo "     CEO: instructions/01_CEO_Project_Orchestrator.md"
echo "     CTO: instructions/02_CTO_Technical_Prophet.md"
echo "     VP Sales: instructions/03_VP_Sales_Door_Opener.md"
echo "     Head of Product: instructions/04_Head_of_Product_Translator.md"
echo "     Lead Engineer: instructions/05_Lead_Engineer_Velocity_Hacker.md"
echo "     システム構造: CLAUDE.md"
echo ""
echo "  4. 🎯 実行: CEOに「あなたはCEOです。指示書に従ってプロジェクトを開始してください」と入力"
echo ""
echo "💡 便利なコマンド:"
echo "  ./agent-send.sh --list              # エージェント一覧表示"
echo "  ./agent-send.sh ceo \"メッセージ\"     # CEOにメッセージ送信"
echo "  ./project-status.sh                 # プロジェクト状況確認"
