#!/bin/bash

# 🚀 AIエージェント一括起動スクリプト
# Organization Unicorn Team専用（5エージェント版）
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

echo "🦄 Organization Unicorn Team - AIエージェント一括起動"
echo "====================================================="
echo ""

# セッション存在確認
check_sessions() {
    local all_exist=true

    if ! tmux has-session -t ceo 2>/dev/null; then
        log_warning "ceoセッションが存在しません"
        all_exist=false
    fi

    if ! tmux has-session -t unicorn-team 2>/dev/null; then
        log_warning "unicorn-teamセッションが存在しません"
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

    echo "📋 起動するエージェント:"
    echo "  - CEO (Project Orchestrator) - プロジェクト統括"
    echo "  - CTO (Technical Prophet) - 技術戦略"
    echo "  - VP Sales (Door Opener) - セールス"
    echo "  - Head of Product (Translator) - プロダクト"
    echo "  - Lead Engineer (Velocity Hacker) - エンジニアリング"
    echo ""

    # 起動確認
    read -p "全エージェントを起動しますか？ (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "キャンセルしました"
        exit 0
    fi

    echo ""
    log_info "起動を開始します..."
    echo ""

    # CEO起動
    launch_agent "ceo" "CEO (Project Orchestrator)"

    # CTO起動
    launch_agent "unicorn-team:0.0" "CTO (Technical Prophet)"

    # VP Sales起動
    launch_agent "unicorn-team:0.1" "VP Sales (Door Opener)"

    # Head of Product起動
    launch_agent "unicorn-team:0.2" "Head of Product (Translator)"

    # Lead Engineer起動
    launch_agent "unicorn-team:0.3" "Lead Engineer (Velocity Hacker)"

    echo ""
    log_success "✅ 全エージェントの起動コマンドを送信しました"
    echo ""
    echo "📋 次のステップ:"
    echo "  1. 各画面でブラウザ認証を完了してください"
    echo "  2. CEOに指示を送信:"
    echo "     ./agent-send.sh ceo \"あなたはCEOです。CrystalBridgeプロジェクトを開始してください\""
    echo ""
    echo "💡 画面を確認:"
    echo "  tmux attach-session -t ceo           # CEO画面"
    echo "  tmux attach-session -t unicorn-team  # チーム画面"
    echo ""
    echo "📊 プロジェクト状況確認:"
    echo "  ./project-status.sh"
}

# 実行
main "$@"
