#!/bin/bash

# 📊 プロジェクト状況確認スクリプト
# Organization Unicorn Team専用（5エージェント版）

# 色付き出力関数
print_header() {
    echo -e "\033[1;35m==================================================\033[0m"
    echo -e "\033[1;35m$1\033[0m"
    echo -e "\033[1;35m==================================================\033[0m"
}

print_section() {
    echo ""
    echo -e "\033[1;36m>>> $1\033[0m"
    echo -e "\033[1;36m--------------------------------------------------\033[0m"
}

print_status() {
    local agent=$1
    local status=$2
    local color=$3
    echo -e "  ${color}${agent}${status}\033[0m"
}

# セッション確認
check_sessions() {
    print_section "Tmuxセッション状態"

    if tmux has-session -t ceo 2>/dev/null; then
        echo "  ✅ CEO セッション: 存在"
    else
        echo "  ❌ CEO セッション: 不在"
    fi

    if tmux has-session -t unicorn-team 2>/dev/null; then
        echo "  ✅ Unicorn Team セッション: 存在"
    else
        echo "  ❌ Unicorn Team セッション: 不在"
    fi
}

# エージェント完了状態確認
check_completion() {
    print_section "エージェント作業状態"

    local agents=("ceo" "cto" "vp_sales" "head_of_product" "lead_engineer")
    local names=("CEO (Project Orchestrator)" "CTO (Technical Prophet)" "VP Sales (Door Opener)" "Head of Product (Translator)" "Lead Engineer (Velocity Hacker)")
    local completed=0
    local total=${#agents[@]}

    for i in "${!agents[@]}"; do
        if [ -f "./tmp/${agents[$i]}_done.txt" ]; then
            print_status "${names[$i]}" ": ✅ 完了" "\033[1;32m"
            ((completed++))
        else
            print_status "${names[$i]}" ": 🔄 進行中" "\033[1;33m"
        fi
    done

    echo ""
    echo "  進捗: $completed/$total タスク完了 ($(( completed * 100 / total ))%)"
}

# ログファイル確認
check_logs() {
    print_section "最新のメッセージログ (直近5件)"

    if [ -f "./logs/send_log.txt" ]; then
        tail -n 5 ./logs/send_log.txt | while IFS= read -r line; do
            echo "  📨 $line"
        done
    else
        echo "  ℹ️  ログファイルがありません"
    fi
}

# 作業ディレクトリ確認
check_workspace() {
    print_section "作業ディレクトリ"

    if [ -d "./workspace" ]; then
        echo "  📁 ./workspace:"
        ls -1 ./workspace 2>/dev/null | while IFS= read -r dir; do
            if [ -d "./workspace/$dir" ]; then
                echo "    └─ 📂 $dir"
            fi
        done
    else
        echo "  ℹ️  作業ディレクトリ未作成"
    fi
}

# プロジェクト情報表示
show_project_info() {
    print_section "プロジェクト情報"

    echo "  🦄 Organization: Unicorn Team"
    echo "  📦 Project: CrystalBridge"
    echo "  🎯 Mission: 市民と行政を繋ぐシビックテックプラットフォーム"
    echo ""
    echo "  👥 Team Structure:"
    echo "    ├─ CEO: Project Orchestrator"
    echo "    ├─ CTO: Technical Prophet"
    echo "    ├─ VP Sales: Door Opener"
    echo "    ├─ Head of Product: Translator"
    echo "    └─ Lead Engineer: Velocity Hacker"
}

# 次のアクション提案
suggest_next_actions() {
    print_section "推奨アクション"

    # セッションチェック
    if ! tmux has-session -t ceo 2>/dev/null || ! tmux has-session -t unicorn-team 2>/dev/null; then
        echo "  🔧 環境セットアップが必要です:"
        echo "     ./setup.sh"
        return
    fi

    # 完了状態チェック
    local all_done=true
    for agent in ceo cto vp_sales head_of_product lead_engineer; do
        if [ ! -f "./tmp/${agent}_done.txt" ]; then
            all_done=false
            break
        fi
    done

    if [ "$all_done" = true ]; then
        echo "  🎉 全タスク完了！次のフェーズに進めます"
        echo "     新しいプロジェクトを開始:"
        echo "     ./agent-send.sh ceo \"次のプロジェクトを開始してください\""
    else
        echo "  💬 エージェントにメッセージを送信:"
        echo "     ./agent-send.sh ceo \"進捗を報告してください\""
        echo ""
        echo "  📺 画面を確認:"
        echo "     tmux attach-session -t ceo"
        echo "     tmux attach-session -t unicorn-team"
        echo ""
        echo "  📊 継続監視:"
        echo "     watch -n 10 ./project-status.sh"
    fi
}

# メイン処理
main() {
    clear
    print_header "🦄 Organization Unicorn Team - プロジェクト状況"
    echo "  最終更新: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    show_project_info
    check_sessions
    check_completion
    check_workspace
    check_logs
    suggest_next_actions

    echo ""
    print_header "状況確認完了"
    echo ""
}

# 実行
main "$@"
