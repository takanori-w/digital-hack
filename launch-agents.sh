#!/bin/bash

# AIエージェント一括起動スクリプト
# Organization Unicorn Team専用（14エージェント版）
# claude --dangerously-skip-permissions フラグ付きで全エージェントを起動

set -e  # エラー時に停止

# 色付きログ関数
log_info() {
    echo -e "\033[1;32m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[1;34m[SUCCESS]\033[0m $1"
}

log_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

echo "Organization Unicorn Team - 14エージェント一括起動"
echo "====================================================="
echo ""

# セッション存在確認
check_sessions() {
    local all_exist=true

    if ! tmux has-session -t l1-executive 2>/dev/null; then
        log_warning "l1-executiveセッションが存在しません"
        all_exist=false
    fi

    if ! tmux has-session -t l2-orchestration 2>/dev/null; then
        log_warning "l2-orchestrationセッションが存在しません"
        all_exist=false
    fi

    if ! tmux has-session -t l3-execution 2>/dev/null; then
        log_warning "l3-executionセッションが存在しません"
        all_exist=false
    fi

    if [ "$all_exist" = false ]; then
        echo ""
        echo "❌ 必要なセッションが見つかりません"
        echo "   先に ./setup.sh を実行してください"
        exit 1
    fi
}

# エージェント起動関数
launch_agent() {
    local target=$1
    local name=$2

    log_info "$name を起動中..."
    tmux send-keys -t "$target" 'claude --dangerously-skip-permissions' C-m
    sleep 0.5
}

# メイン処理
main() {
    # セッション確認
    check_sessions

    echo "📋 起動するエージェント (14名):"
    echo ""
    echo "  【Layer 1: Strategic & Governance (6名)】"
    echo "    - CEO (Global Security Strategy)"
    echo "    - CLO (Chief Legal Officer)"
    echo "    - CISO (Chief Information Security Officer)"
    echo "    - CFO (Chief Financial Officer)"
    echo "    - CTO (Chief Technology Officer)"
    echo "    - CMO (Chief Marketing Officer)"
    echo ""
    echo "  【Layer 2: Orchestration & Assurance (3名)】"
    echo "    - CSIRT Team Leader (Incident Commander)"
    echo "    - Auditor (Quality Guardian)"
    echo "    - CTI Analyst (Intelligence Oracle)"
    echo ""
    echo "  【Layer 3: Execution (5名)】"
    echo "    - SOC Analyst (Vigilant Watcher)"
    echo "    - White Hacker (Offensive Architect)"
    echo "    - CSIRT Engineer (Forensic Detective)"
    echo "    - Network Engineer (Shield Bearer)"
    echo "    - App Engineer (Code Fixer)"
    echo ""

    # 起動確認
    read -p "全14エージェントを起動しますか？ (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "キャンセルしました"
        exit 0
    fi

    echo ""
    log_info "起動を開始します..."
    echo ""

    # Layer 1: Executive (6ペイン)
    log_info "Layer 1 (Executive) 起動中..."
    for i in {0..5}; do
        launch_agent "l1-executive:0.$i" "L1 Agent $((i+1))"
    done

    # Layer 2: Orchestration (3ペイン)
    log_info "Layer 2 (Orchestration) 起動中..."
    for i in {0..2}; do
        launch_agent "l2-orchestration:0.$i" "L2 Agent $((i+1))"
    done

    # Layer 3: Execution (5ペイン)
    log_info "Layer 3 (Execution) 起動中..."
    for i in {0..4}; do
        launch_agent "l3-execution:0.$i" "L3 Agent $((i+1))"
    done

    echo ""
    log_success "✅ 全14エージェントの起動コマンドを送信しました"
    echo ""
    echo "📋 次のステップ:"
    echo "  1. 各画面でブラウザ認証を完了してください"
    echo "  2. CEOに指示を送信:"
    echo "     ./agent-send.sh ceo \"セキュリティガバナンスプロジェクトを開始してください\""
    echo ""
    echo "💡 画面を確認:"
    echo "  tmux attach-session -t l1-executive      # Layer 1"
    echo "  tmux attach-session -t l2-orchestration  # Layer 2"
    echo "  tmux attach-session -t l3-execution      # Layer 3"
    echo ""
    echo "📊 プロジェクト状況確認:"
    echo "  ./project-status.sh"
}

# 実行
main "$@"
