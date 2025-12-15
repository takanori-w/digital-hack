#!/bin/bash

# プロジェクト状況確認スクリプト
# Organization Unicorn Team専用（14エージェント版）

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

    if tmux has-session -t l1-executive 2>/dev/null; then
        echo "  ✅ l1-executive (Layer 1): 存在"
    else
        echo "  ❌ l1-executive (Layer 1): 不在"
    fi

    if tmux has-session -t l2-orchestration 2>/dev/null; then
        echo "  ✅ l2-orchestration (Layer 2): 存在"
    else
        echo "  ❌ l2-orchestration (Layer 2): 不在"
    fi

    if tmux has-session -t l3-execution 2>/dev/null; then
        echo "  ✅ l3-execution (Layer 3): 存在"
    else
        echo "  ❌ l3-execution (Layer 3): 不在"
    fi
}

# エージェント完了状態確認
check_completion() {
    print_section "エージェント作業状態"

    local completed=0
    local total=14

    echo ""
    echo "  【Layer 1: Strategic & Governance】"
    local l1_agents=("ceo" "clo" "ciso" "cfo" "cto" "cmo")
    local l1_names=("CEO" "CLO" "CISO" "CFO" "CTO" "CMO")
    for i in "${!l1_agents[@]}"; do
        if [ -f "./tmp/${l1_agents[$i]}_done.txt" ]; then
            print_status "  ${l1_names[$i]}" ": ✅ 完了" "\033[1;32m"
            ((completed++))
        else
            print_status "  ${l1_names[$i]}" ": 🔄 進行中" "\033[1;33m"
        fi
    done

    echo ""
    echo "  【Layer 2: Orchestration & Assurance】"
    local l2_agents=("csirt_leader" "auditor" "cti_analyst")
    local l2_names=("CSIRT Leader" "Auditor" "CTI Analyst")
    for i in "${!l2_agents[@]}"; do
        if [ -f "./tmp/${l2_agents[$i]}_done.txt" ]; then
            print_status "  ${l2_names[$i]}" ": ✅ 完了" "\033[1;32m"
            ((completed++))
        else
            print_status "  ${l2_names[$i]}" ": 🔄 進行中" "\033[1;33m"
        fi
    done

    echo ""
    echo "  【Layer 3: Execution】"
    local l3_agents=("soc_analyst" "white_hacker" "csirt_engineer" "network_engineer" "app_engineer")
    local l3_names=("SOC Analyst" "White Hacker" "CSIRT Engineer" "Network Engineer" "App Engineer")
    for i in "${!l3_agents[@]}"; do
        if [ -f "./tmp/${l3_agents[$i]}_done.txt" ]; then
            print_status "  ${l3_names[$i]}" ": ✅ 完了" "\033[1;32m"
            ((completed++))
        else
            print_status "  ${l3_names[$i]}" ": 🔄 進行中" "\033[1;33m"
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
        echo "  ログファイルがありません"
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
        echo "  作業ディレクトリ未作成"
    fi
}

# プロジェクト情報表示
show_project_info() {
    print_section "プロジェクト情報"

    echo "  Organization: Unicorn Team"
    echo "  Edition: Global Security Governance"
    echo "  Agents: 14 (L1:6 + L2:3 + L3:5)"
    echo ""
    echo "  【Layer 1: Strategic & Governance】"
    echo "    CEO, CLO, CISO, CFO, CTO, CMO"
    echo ""
    echo "  【Layer 2: Orchestration & Assurance】"
    echo "    CSIRT Team Leader, Auditor, CTI Analyst"
    echo ""
    echo "  【Layer 3: Execution】"
    echo "    SOC Analyst, White Hacker, CSIRT Engineer,"
    echo "    Network Engineer, App Engineer"
}

# 次のアクション提案
suggest_next_actions() {
    print_section "推奨アクション"

    # セッションチェック
    local sessions_ok=true
    if ! tmux has-session -t l1-executive 2>/dev/null; then
        sessions_ok=false
    fi
    if ! tmux has-session -t l2-orchestration 2>/dev/null; then
        sessions_ok=false
    fi
    if ! tmux has-session -t l3-execution 2>/dev/null; then
        sessions_ok=false
    fi

    if [ "$sessions_ok" = false ]; then
        echo "  環境セットアップが必要です:"
        echo "     ./setup.sh"
        return
    fi

    # 完了状態チェック
    local all_done=true
    local agents=("ceo" "clo" "ciso" "cfo" "cto" "cmo" "csirt_leader" "auditor" "cti_analyst" "soc_analyst" "white_hacker" "csirt_engineer" "network_engineer" "app_engineer")
    for agent in "${agents[@]}"; do
        if [ ! -f "./tmp/${agent}_done.txt" ]; then
            all_done=false
            break
        fi
    done

    if [ "$all_done" = true ]; then
        echo "  全タスク完了！次のフェーズに進めます"
        echo "     新しいプロジェクトを開始:"
        echo "     ./agent-send.sh ceo \"次のプロジェクトを開始してください\""
    else
        echo "  💬 エージェントにメッセージを送信:"
        echo "     ./agent-send.sh ceo \"進捗を報告してください\""
        echo ""
        echo "  📺 画面を確認:"
        echo "     tmux attach-session -t l1-executive"
        echo "     tmux attach-session -t l2-orchestration"
        echo "     tmux attach-session -t l3-execution"
        echo ""
        echo "  📊 継続監視:"
        echo "     watch -n 10 ./project-status.sh"
    fi
}

# メイン処理
main() {
    clear
    print_header "Organization Unicorn Team - プロジェクト状況 (14エージェント)"
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
