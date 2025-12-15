#!/bin/bash

# 🚀 Multi-Agent Communication Demo 環境構築（14エージェント版）
# Organization Unicorn Team専用
# 単一セッション・複数ウィンドウ構成でエージェント切り替えリスクを軽減
# Layer 1 (L1): Strategic & Governance (6)
# Layer 2 (L2): Orchestration & Assurance (3)
# Layer 3 (L3): Execution (5)

set -e  # エラー時に停止

# 設定
SESSION_NAME="agents"
AUTO_START_CLAUDE=true  # Claudeを自動起動するか

# コマンドライン引数の解析
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-claude)
            AUTO_START_CLAUDE=false
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --no-claude    Claudeを自動起動しない"
            echo "  --help, -h     このヘルプを表示"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# 色付きログ関数
log_info() {
    echo -e "\033[1;32m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[1;34m[SUCCESS]\033[0m $1"
}

log_header() {
    echo -e "\033[1;35m═══════════════════════════════════════\033[0m"
    echo -e "\033[1;35m$1\033[0m"
    echo -e "\033[1;35m═══════════════════════════════════════\033[0m"
}

echo "🦄 Organization Unicorn Team - 14エージェント Multi-Agent 環境構築"
echo "=================================================================="
echo ""
echo "📋 構成: 単一セッション「$SESSION_NAME」+ 3ウィンドウ（Layer別）"
echo "   - ウィンドウ切り替え: Ctrl+b n (次) / Ctrl+b p (前)"
echo "   - セッション切り替え不要でエージェント落下リスクなし"
echo ""

# STEP 1: 既存セッションクリーンアップ
log_header "STEP 1: 既存セッションクリーンアップ"

log_info "🧹 既存セッションを削除中..."

# 統合セッション
tmux kill-session -t "$SESSION_NAME" 2>/dev/null && log_info "${SESSION_NAME}セッション削除完了" || log_info "${SESSION_NAME}セッションは存在しませんでした"

# 旧セッション（後方互換性のため）
tmux kill-session -t l1-executive 2>/dev/null && log_info "l1-executiveセッション削除完了" || true
tmux kill-session -t l2-orchestration 2>/dev/null && log_info "l2-orchestrationセッション削除完了" || true
tmux kill-session -t l3-execution 2>/dev/null && log_info "l3-executionセッション削除完了" || true

# ディレクトリ準備
mkdir -p ./tmp
mkdir -p ./logs
mkdir -p ./workspace

# 完了ファイルクリア
rm -f ./tmp/agent*_done.txt 2>/dev/null && log_info "既存の完了ファイルをクリア" || log_info "完了ファイルは存在しませんでした"

log_success "✅ クリーンアップ完了"
echo ""

# STEP 2: workspace/README.md 自動生成
log_info "📝 workspace/README.md を生成中..."

cat > ./workspace/README.md << 'WORKSPACE_README_EOF'
# 📁 Workspace ディレクトリ

## 概要

このディレクトリは、AIエージェント14名がセキュリティガバナンス・プロジェクト開発を行う際の**共有作業領域**です。
全エージェント（L1 Executive 6名、L2 Orchestration 3名、L3 Execution 5名）が、このディレクトリ内でファイルを作成・編集します。

**重要:** このディレクトリの内容は Git で追跡されません。
各プロジェクトは別リポジトリとして管理することを推奨します。

## エージェント構成

### Layer 1: Strategic & Governance (6名)
- **001 CEO**: Global Security Strategy（最高責任者）
- **002 CLO**: Chief Legal Officer（法務責任者）
- **003 CISO**: Chief Information Security Officer（セキュリティ責任者）
- **004 CFO**: Chief Financial Officer（財務責任者）
- **005 CTO**: Chief Technology Officer（技術責任者）
- **006 CMO**: Chief Marketing Officer（マーケティング責任者）

### Layer 2: Orchestration & Assurance (3名)
- **007 CSIRT Team Leader**: インシデント対応統括
- **008 Auditor**: 監査・コンプライアンス
- **009 CTI Analyst**: 脅威インテリジェンス分析

### Layer 3: Execution (5名)
- **010 SOC Analyst**: Security Operations Center
- **011 White Hacker**: 脆弱性テスト・侵入テスト
- **012 CSIRT Engineer**: インシデント対応エンジニア
- **013 Global Network Engineer**: ネットワーク・インフラ
- **014 Global Application Engineer**: アプリケーション開発

## ディレクトリ構造

プロジェクトごとにサブディレクトリが作成されます：

```
workspace/
├── README.md                           # このファイル
├── security-governance/                # セキュリティガバナンスプロジェクト
│   ├── README.md                      # プロジェクト概要
│   ├── strategy/                      # L1 Executive の戦略文書
│   ├── compliance/                    # L2 Assurance のコンプライアンス
│   ├── operations/                    # L3 Execution の運用ドキュメント
│   └── incidents/                     # インシデント対応記録
└── [other-project]/                   # 他のプロジェクト
```

## プロジェクト開始

```bash
./agent-send.sh ceo "
あなたはCEOです（グローバルセキュリティ戦略）。

セキュリティガバナンスプロジェクトを開始してください。
作業ディレクトリ: workspace/security-governance/

プロジェクト概要:
- グローバルセキュリティ組織の構築
- リスク管理フレームワーク確立
- インシデント対応体制の整備
- コンプライアンス達成
"
```

## ファイル確認

```bash
# プロジェクトの内容を確認
ls -la workspace/security-governance/

# ツリー表示
tree workspace/security-governance/

# リアルタイム監視
watch -n 5 'tree workspace/security-governance/'
```

## エージェント間コミュニケーション

各層での連携フロー:

```
L1: CEO (統括)
  ├→ CLO (法務)
  ├→ CISO (セキュリティ)
  ├→ CFO (財務)
  ├→ CTO (技術)
  └→ CMO (マーケティング)

L2: CSIRT_Leader (オーケストレーション)
  ├→ Auditor (監査)
  └→ CTI_Analyst (脅威情報)

L3: SOC_Analyst (運用)
  ├→ White_Hacker (テスト)
  ├→ CSIRT_Engineer (対応)
  ├→ Network_Engineer (インフラ)
  └→ App_Engineer (開発)
```

## ベストプラクティス

1. **ドキュメント優先**: 実装前に必ずドキュメント作成
2. **相互参照**: エージェント間で相対パスを使用
3. **バージョン管理**: 重要ドキュメントはGit管理推奨
4. **監査ログ**: すべての決定と実行を記録

---

**このファイルについて:**
- このREADMEは `./setup.sh` で自動生成されます
- organization_unicorn_teamリポジトリには含まれません
- 削除されても `./setup.sh` で再生成できます
WORKSPACE_README_EOF

log_success "✅ workspace/README.md 生成完了"
echo ""

# STEP 3: 統合セッション作成
log_header "STEP 3: 統合セッション作成（3ウィンドウ・14ペイン）"

log_info "📺 ${SESSION_NAME}セッション作成開始..."

WORKDIR=$(pwd)

# ===== Window 0: Layer 1 Executive (6ペイン: 3x2グリッド) =====
log_info "Window 0: Layer 1 Executive (6ペイン) 作成中..."

tmux new-session -d -s "$SESSION_NAME" -n "L1-Executive" -c "$WORKDIR"

# 3x2グリッド作成
tmux split-window -h -t "${SESSION_NAME}:0" -c "$WORKDIR"
tmux select-pane -t "${SESSION_NAME}:0.0"
tmux split-window -v -c "$WORKDIR"
tmux select-pane -t "${SESSION_NAME}:0.0"
tmux split-window -v -c "$WORKDIR"
tmux select-pane -t "${SESSION_NAME}:0.3"
tmux split-window -v -c "$WORKDIR"
tmux select-pane -t "${SESSION_NAME}:0.3"
tmux split-window -v -c "$WORKDIR"

# Layer 1 エージェント設定
L1_TITLES=("CEO" "CLO" "CISO" "CFO" "CTO" "CMO")
L1_COLORS=("\033[1;35m" "\033[1;31m" "\033[1;32m" "\033[1;33m" "\033[1;34m" "\033[1;36m")
L1_PANE_ORDER=(0 2 4 1 3 5)  # 左列: 0,2,4 右列: 1,3,5

for i in {0..5}; do
    pane="${SESSION_NAME}:0.${L1_PANE_ORDER[$i]}"
    tmux select-pane -t "$pane" -T "${L1_TITLES[$i]}"
    tmux send-keys -t "$pane" "export PS1='(${L1_COLORS[$i]}${L1_TITLES[$i]}\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m
    tmux send-keys -t "$pane" "clear && echo '=== ${L1_TITLES[$i]} エージェント ===' && echo 'Layer 1: Strategic & Governance'" C-m
done

log_success "✅ Window 0 (L1-Executive) 作成完了"

# ===== Window 1: Layer 2 Orchestration (3ペイン: 1x3グリッド) =====
log_info "Window 1: Layer 2 Orchestration (3ペイン) 作成中..."

tmux new-window -t "$SESSION_NAME" -n "L2-Orchestration" -c "$WORKDIR"

# 1x3グリッド作成
tmux split-window -h -t "${SESSION_NAME}:1" -c "$WORKDIR"
tmux split-window -h -t "${SESSION_NAME}:1.0" -c "$WORKDIR"

# Layer 2 エージェント設定
L2_TITLES=("CSIRT_Team_Leader" "Auditor" "CTI_Analyst")
L2_COLORS=("\033[1;36m" "\033[1;33m" "\033[1;32m")

for i in {0..2}; do
    pane="${SESSION_NAME}:1.$i"
    tmux select-pane -t "$pane" -T "${L2_TITLES[$i]}"
    tmux send-keys -t "$pane" "export PS1='(${L2_COLORS[$i]}${L2_TITLES[$i]}\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m
    tmux send-keys -t "$pane" "clear && echo '=== ${L2_TITLES[$i]} エージェント ===' && echo 'Layer 2: Orchestration & Assurance'" C-m
done

log_success "✅ Window 1 (L2-Orchestration) 作成完了"

# ===== Window 2: Layer 3 Execution (5ペイン: 1x5グリッド) =====
log_info "Window 2: Layer 3 Execution (5ペイン) 作成中..."

tmux new-window -t "$SESSION_NAME" -n "L3-Execution" -c "$WORKDIR"

# 1x5グリッド作成
tmux split-window -h -t "${SESSION_NAME}:2" -c "$WORKDIR"
tmux split-window -h -t "${SESSION_NAME}:2.0" -c "$WORKDIR"
tmux split-window -h -t "${SESSION_NAME}:2.0" -c "$WORKDIR"
tmux split-window -h -t "${SESSION_NAME}:2.0" -c "$WORKDIR"

# Layer 3 エージェント設定
L3_TITLES=("SOC_Analyst" "White_Hacker" "CSIRT_Engineer" "Network_Engineer" "App_Engineer")
L3_COLORS=("\033[1;31m" "\033[1;32m" "\033[1;34m" "\033[1;33m" "\033[1;36m")

for i in {0..4}; do
    pane="${SESSION_NAME}:2.$i"
    tmux select-pane -t "$pane" -T "${L3_TITLES[$i]}"
    tmux send-keys -t "$pane" "export PS1='(${L3_COLORS[$i]}${L3_TITLES[$i]}\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m
    tmux send-keys -t "$pane" "clear && echo '=== ${L3_TITLES[$i]} エージェント ===' && echo 'Layer 3: Execution'" C-m
done

log_success "✅ Window 2 (L3-Execution) 作成完了"

# 最初のウィンドウに戻る
tmux select-window -t "${SESSION_NAME}:0"

echo ""

# STEP 4: Claude 自動起動
log_header "STEP 4: Claude 自動起動"

if [ "$AUTO_START_CLAUDE" = true ]; then
    log_info "🤖 全14エージェントでClaude Code起動中..."

    # 起動待機時間（秒）- エージェント間の起動間隔
    STARTUP_DELAY=1

    # Layer 1 (Window 0: 6ペイン)
    log_info "Layer 1 (Executive) 起動中..."
    for i in {0..5}; do
        tmux send-keys -t "${SESSION_NAME}:0.$i" "claude --dangerously-skip-permissions" C-m
        sleep $STARTUP_DELAY
    done

    # Layer 2 (Window 1: 3ペイン)
    log_info "Layer 2 (Orchestration) 起動中..."
    for i in {0..2}; do
        tmux send-keys -t "${SESSION_NAME}:1.$i" "claude --dangerously-skip-permissions" C-m
        sleep $STARTUP_DELAY
    done

    # Layer 3 (Window 2: 5ペイン)
    log_info "Layer 3 (Execution) 起動中..."
    for i in {0..4}; do
        tmux send-keys -t "${SESSION_NAME}:2.$i" "claude --dangerously-skip-permissions" C-m
        sleep $STARTUP_DELAY
    done

    log_success "✅ 全14エージェントでClaude起動完了"
else
    log_info "⏭️ Claude自動起動スキップ（--no-claude オプション指定）"
    echo ""
    echo "手動起動コマンド:"
    echo "  # Layer 1"
    echo "  for i in {0..5}; do tmux send-keys -t ${SESSION_NAME}:0.\$i 'claude --dangerously-skip-permissions' C-m; done"
    echo "  # Layer 2"
    echo "  for i in {0..2}; do tmux send-keys -t ${SESSION_NAME}:1.\$i 'claude --dangerously-skip-permissions' C-m; done"
    echo "  # Layer 3"
    echo "  for i in {0..4}; do tmux send-keys -t ${SESSION_NAME}:2.\$i 'claude --dangerously-skip-permissions' C-m; done"
fi

echo ""

# STEP 5: 環境確認・表示
log_header "STEP 5: 環境確認・表示"

log_info "🔍 環境確認中..."

echo ""
echo "📊 セットアップ結果:"
echo "==================="
echo ""

# tmuxセッション確認
echo "📺 Tmux Session:"
tmux list-sessions
echo ""

# ウィンドウ構成表示
echo "📋 ウィンドウ構成 (単一セッション: $SESSION_NAME):"
echo ""
echo "Window 0: L1-Executive (6ペイン)"
echo "┌─────────────┬─────────────┬─────────────┐"
echo "│   CEO       │   CLO       │   CISO      │"
echo "├─────────────┼─────────────┼─────────────┤"
echo "│   CFO       │   CTO       │   CMO       │"
echo "└─────────────┴─────────────┴─────────────┘"
echo ""
echo "Window 1: L2-Orchestration (3ペイン)"
echo "┌──────────────────┬──────────────────┬──────────────────┐"
echo "│ CSIRT_Team_Lead  │   Auditor        │   CTI_Analyst    │"
echo "└──────────────────┴──────────────────┴──────────────────┘"
echo ""
echo "Window 2: L3-Execution (5ペイン)"
echo "┌──────────────┬──────────────────┬──────────────────┬──────────────┬───────────────┐"
echo "│ SOC_Analyst  │  White_Hacker    │  CSIRT_Engineer  │ Network_Eng  │  App_Engineer │"
echo "└──────────────┴──────────────────┴──────────────────┴──────────────┴───────────────┘"
echo ""

log_success "🎉 14エージェント Multi-Agent 環境セットアップ完了！"
echo ""

echo "📋 操作方法:"
echo "  🔗 セッションアタッチ:"
echo "     tmux attach-session -t $SESSION_NAME"
echo ""
echo "  📺 ウィンドウ切り替え（セッション内）:"
echo "     Ctrl+b n        # 次のウィンドウ (L1 → L2 → L3)"
echo "     Ctrl+b p        # 前のウィンドウ (L3 → L2 → L1)"
echo "     Ctrl+b 0        # Window 0 (L1-Executive)"
echo "     Ctrl+b 1        # Window 1 (L2-Orchestration)"
echo "     Ctrl+b 2        # Window 2 (L3-Execution)"
echo ""
echo "  📍 ペイン切り替え（ウィンドウ内）:"
echo "     Ctrl+b 矢印キー  # 上下左右のペインに移動"
echo "     Ctrl+b q        # ペイン番号表示 → 番号キーで移動"
echo ""
echo "  🚪 デタッチ:"
echo "     Ctrl+b d        # セッションから離脱（エージェントは稼働継続）"
echo ""

echo "💡 便利なコマンド:"
echo "  ./agent-send.sh --list                # エージェント一覧表示"
echo "  ./agent-send.sh [エージェント] \"メッセージ\" # メッセージ送信"
echo "  ./project-status.sh                   # プロジェクト状況確認"
echo "  tmux list-windows -t $SESSION_NAME    # ウィンドウ一覧"
echo "  tmux kill-session -t $SESSION_NAME    # セッション停止"
echo ""

echo "📚 ドキュメント:"
echo "  - システム構造: CLAUDE.md"
echo "  - エージェント指示書: instructions/下の各Markdownファイル"
echo ""

echo "🚀 開始:"
echo "  tmux attach-session -t $SESSION_NAME"
echo ""
