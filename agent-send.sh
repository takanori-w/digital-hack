#!/bin/bash

# 🚀 Agent間メッセージ送信スクリプト
# Organization Unicorn Team専用（5エージェント版）

# エージェント→tmuxターゲット マッピング
get_agent_target() {
    case "$1" in
        "ceo") echo "ceo" ;;
        "CEO") echo "ceo" ;;
        "cto") echo "unicorn-team:0.0" ;;
        "CTO") echo "unicorn-team:0.0" ;;
        "vp_sales") echo "unicorn-team:0.1" ;;
        "VP_Sales") echo "unicorn-team:0.1" ;;
        "vpsales") echo "unicorn-team:0.1" ;;
        "head_of_product") echo "unicorn-team:0.2" ;;
        "Head_of_Product") echo "unicorn-team:0.2" ;;
        "hop") echo "unicorn-team:0.2" ;;
        "lead_engineer") echo "unicorn-team:0.3" ;;
        "Lead_Engineer") echo "unicorn-team:0.3" ;;
        "engineer") echo "unicorn-team:0.3" ;;
        *) echo "" ;;
    esac
}

show_usage() {
    cat << EOF
🦄 Organization Unicorn Team - Agent間メッセージ送信

使用方法:
  $0 [エージェント名] [メッセージ]
  $0 --list

利用可能エージェント:
  ceo (CEO)                    - プロジェクト統括責任者
  cto (CTO)                    - 技術戦略責任者
  vp_sales (VP_Sales)          - セールス責任者
  head_of_product (hop)        - プロダクト責任者
  lead_engineer (engineer)     - リードエンジニア

使用例:
  $0 ceo "プロジェクトを開始してください"
  $0 cto "技術選定をお願いします"
  $0 vp_sales "市場調査を開始してください"
  $0 head_of_product "ユーザーストーリーを作成してください"
  $0 lead_engineer "アーキテクチャ設計をお願いします"
EOF
}

# エージェント一覧表示
show_agents() {
    echo "📋 Organization Unicorn Team - エージェント一覧:"
    echo "================================================"
    echo ""
    echo "【CEO層】"
    echo "  ceo, CEO               → ceo:0              (Project Orchestrator)"
    echo ""
    echo "【エグゼクティブチーム】"
    echo "  cto, CTO               → unicorn-team:0.0   (Technical Prophet)"
    echo "  vp_sales, VP_Sales     → unicorn-team:0.1   (Door Opener)"
    echo "  head_of_product, hop   → unicorn-team:0.2   (Translator)"
    echo "  lead_engineer, engineer→ unicorn-team:0.3   (Velocity Hacker)"
    echo ""
    echo "【レイアウト】"
    echo "  ┌─────────────┬─────────────┐"
    echo "  │     CTO     │  VP Sales   │"
    echo "  ├─────────────┼─────────────┤"
    echo "  │   Head of   │    Lead     │"
    echo "  │   Product   │  Engineer   │"
    echo "  └─────────────┴─────────────┘"
}

# ログ記録
log_send() {
    local agent="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    mkdir -p logs
    echo "[$timestamp] $agent: SENT - \"$message\"" >> logs/send_log.txt
}

# メッセージ送信
send_message() {
    local target="$1"
    local message="$2"

    echo "📤 送信中: $target ← '$message'"

    # Claude Codeのプロンプトを一度クリア
    tmux send-keys -t "$target" C-c
    sleep 0.3

    # メッセージ送信
    tmux send-keys -t "$target" "$message"
    sleep 0.1

    # エンター押下
    tmux send-keys -t "$target" C-m
    sleep 0.5
}

# ターゲット存在確認
check_target() {
    local target="$1"
    local session_name="${target%%:*}"

    if ! tmux has-session -t "$session_name" 2>/dev/null; then
        echo "❌ セッション '$session_name' が見つかりません"
        echo "   先に ./setup.sh を実行してください"
        return 1
    fi

    return 0
}

# メイン処理
main() {
    if [[ $# -eq 0 ]]; then
        show_usage
        exit 1
    fi

    # --listオプション
    if [[ "$1" == "--list" ]]; then
        show_agents
        exit 0
    fi

    if [[ $# -lt 2 ]]; then
        show_usage
        exit 1
    fi

    local agent_name="$1"
    local message="$2"

    # エージェントターゲット取得
    local target
    target=$(get_agent_target "$agent_name")

    if [[ -z "$target" ]]; then
        echo "❌ エラー: 不明なエージェント '$agent_name'"
        echo ""
        echo "利用可能エージェント一覧:"
        echo "  $0 --list"
        exit 1
    fi

    # ターゲット確認
    if ! check_target "$target"; then
        exit 1
    fi

    # メッセージ送信
    send_message "$target" "$message"

    # ログ記録
    log_send "$agent_name" "$message"

    echo "✅ 送信完了: $agent_name に '$message'"

    return 0
}

main "$@"
