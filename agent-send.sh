#!/bin/bash

# 🚀 Agent間メッセージ送信スクリプト
# Organization Unicorn Team専用（14エージェント版）
# 単一セッション「agents」+ 3ウィンドウ構成対応
# Layer 1 (6) + Layer 2 (3) + Layer 3 (5)

SESSION_NAME="agents"

# エージェント→tmuxターゲット マッピング
# 新構成: agents:Window.Pane
get_agent_target() {
    case "${1,,}" in
        # ━━━ Layer 1: Strategic & Governance (Window 0) ━━━
        "ceo") echo "${SESSION_NAME}:0.0" ;;
        "clo"|"chief_legal_officer") echo "${SESSION_NAME}:0.2" ;;
        "ciso"|"chief_information_security_officer") echo "${SESSION_NAME}:0.4" ;;
        "cfo"|"chief_financial_officer") echo "${SESSION_NAME}:0.1" ;;
        "cto"|"chief_technology_officer") echo "${SESSION_NAME}:0.3" ;;
        "cmo"|"chief_marketing_officer") echo "${SESSION_NAME}:0.5" ;;

        # ━━━ Layer 2: Orchestration & Assurance (Window 1) ━━━
        "csirt_team_leader"|"csirt_leader"|"csirt") echo "${SESSION_NAME}:1.0" ;;
        "auditor") echo "${SESSION_NAME}:1.1" ;;
        "cti_analyst"|"cti"|"threat_intelligence"|"intelligence") echo "${SESSION_NAME}:1.2" ;;

        # ━━━ Layer 3: Execution (Window 2) ━━━
        "soc_analyst"|"soc") echo "${SESSION_NAME}:2.0" ;;
        "white_hacker"|"hacker"|"penetration") echo "${SESSION_NAME}:2.1" ;;
        "csirt_engineer"|"csirt_eng"|"incident_response") echo "${SESSION_NAME}:2.2" ;;
        "network_engineer"|"network_eng"|"infra") echo "${SESSION_NAME}:2.3" ;;
        "app_engineer"|"application_engineer"|"developer") echo "${SESSION_NAME}:2.4" ;;

        # ━━━ Legacy aliases (旧構成互換) ━━━
        "cto_tech"|"technical_prophet") echo "${SESSION_NAME}:0.3" ;;
        "vp_sales"|"vpsales"|"sales") echo "${SESSION_NAME}:2.1" ;;
        "head_of_product"|"hop"|"product") echo "${SESSION_NAME}:1.1" ;;
        "lead_engineer"|"engineer"|"engineer_velocity") echo "${SESSION_NAME}:2.4" ;;

        *) echo "" ;;
    esac
}

show_usage() {
    cat << EOF
🦄 Organization Unicorn Team (14エージェント版) - Agent間メッセージ送信

使用方法:
  $0 [エージェント名] [メッセージ]
  $0 --list
  $0 --help

利用可能エージェント:

  【Layer 1: Strategic & Governance】
    CEO                              - グローバルセキュリティ戦略
    CLO, Chief_Legal_Officer         - 法務責任者
    CISO, Chief_Information_Security_Officer - セキュリティ責任者
    CFO, Chief_Financial_Officer     - 財務責任者
    CTO, Chief_Technology_Officer    - 技術責任者
    CMO, Chief_Marketing_Officer     - マーケティング責任者

  【Layer 2: Orchestration & Assurance】
    CSIRT_Team_Leader, CSIRT_Leader  - インシデント対応統括
    Auditor                          - 監査・コンプライアンス
    CTI_Analyst, CTI                 - 脅威インテリジェンス分析

  【Layer 3: Execution】
    SOC_Analyst, SOC                 - Security Operations Center
    White_Hacker, Hacker             - 脆弱性テスト・侵入テスト
    CSIRT_Engineer, Incident_Response - インシデント対応エンジニア
    Network_Engineer, Network_Eng    - ネットワーク・インフラ
    App_Engineer, Developer          - アプリケーション開発

使用例:
  $0 ceo "セキュリティガバナンスプロジェクトを開始してください"
  $0 ciso "セキュリティ戦略を策定してください"
  $0 csirt_team_leader "インシデント対応体制を構築してください"
  $0 soc_analyst "脅威監視を開始してください"
  $0 white_hacker "脆弱性テストを実施してください"

セッション操作:
  tmux attach-session -t $SESSION_NAME    # セッションにアタッチ
  Ctrl+b n                                # 次のウィンドウ
  Ctrl+b p                                # 前のウィンドウ
  Ctrl+b 0/1/2                            # ウィンドウ直接移動
  Ctrl+b d                                # デタッチ
EOF
}

# エージェント一覧表示
show_agents() {
    echo "📋 Organization Unicorn Team (14エージェント版) - エージェント一覧:"
    echo "═════════════════════════════════════════════════════════════════════"
    echo ""
    echo "セッション: $SESSION_NAME (単一セッション・3ウィンドウ構成)"
    echo ""

    echo "【Layer 1: Strategic & Governance (Window 0: L1-Executive)】"
    echo ""
    echo "  CEO                  → ${SESSION_NAME}:0.0  (グローバルセキュリティ戦略)"
    echo "  CLO                  → ${SESSION_NAME}:0.2  (Chief Legal Officer)"
    echo "  CISO                 → ${SESSION_NAME}:0.4  (Chief Information Security Officer)"
    echo "  CFO                  → ${SESSION_NAME}:0.1  (Chief Financial Officer)"
    echo "  CTO                  → ${SESSION_NAME}:0.3  (Chief Technology Officer)"
    echo "  CMO                  → ${SESSION_NAME}:0.5  (Chief Marketing Officer)"
    echo ""

    echo "【Layer 2: Orchestration & Assurance (Window 1: L2-Orchestration)】"
    echo ""
    echo "  CSIRT_Team_Leader    → ${SESSION_NAME}:1.0  (インシデント対応統括)"
    echo "  Auditor              → ${SESSION_NAME}:1.1  (監査・コンプライアンス)"
    echo "  CTI_Analyst          → ${SESSION_NAME}:1.2  (脅威インテリジェンス分析)"
    echo ""

    echo "【Layer 3: Execution (Window 2: L3-Execution)】"
    echo ""
    echo "  SOC_Analyst          → ${SESSION_NAME}:2.0  (Security Operations Center)"
    echo "  White_Hacker         → ${SESSION_NAME}:2.1  (脆弱性テスト・侵入テスト)"
    echo "  CSIRT_Engineer       → ${SESSION_NAME}:2.2  (インシデント対応エンジニア)"
    echo "  Network_Engineer     → ${SESSION_NAME}:2.3  (ネットワーク・インフラ)"
    echo "  App_Engineer         → ${SESSION_NAME}:2.4  (アプリケーション開発)"
    echo ""

    echo "【レイアウト図】"
    echo ""
    echo "  ┌─────────────────────────────────────────┐"
    echo "  │ Window 0: L1-Executive (6ペイン, 3x2)   │"
    echo "  │  ┌──────────┬──────────┬──────────┐    │"
    echo "  │  │   CEO    │   CLO    │  CISO    │    │"
    echo "  │  ├──────────┼──────────┼──────────┤    │"
    echo "  │  │   CFO    │   CTO    │  CMO     │    │"
    echo "  │  └──────────┴──────────┴──────────┘    │"
    echo "  └─────────────────────────────────────────┘"
    echo ""
    echo "  ┌────────────────────────────────────────────────┐"
    echo "  │ Window 1: L2-Orchestration (3ペイン, 1x3)      │"
    echo "  │  ┌──────────────┬──────────┬──────────────┐   │"
    echo "  │  │ CSIRT_Leader │ Auditor  │ CTI_Analyst  │   │"
    echo "  │  └──────────────┴──────────┴──────────────┘   │"
    echo "  └────────────────────────────────────────────────┘"
    echo ""
    echo "  ┌──────────────────────────────────────────────────────────┐"
    echo "  │ Window 2: L3-Execution (5ペイン, 1x5)                    │"
    echo "  │ ┌─────────┬──────────┬──────────┬──────────┬──────────┐ │"
    echo "  │ │   SOC   │  White   │ CSIRT    │ Network  │   App    │ │"
    echo "  │ │Analyst  │ Hacker   │Engineer  │Engineer  │Engineer  │ │"
    echo "  │ └─────────┴──────────┴──────────┴──────────┴──────────┘ │"
    echo "  └──────────────────────────────────────────────────────────┘"
    echo ""

    echo "【操作方法】"
    echo "  tmux attach-session -t $SESSION_NAME  # セッションにアタッチ"
    echo "  Ctrl+b n                              # 次のウィンドウ (L1→L2→L3)"
    echo "  Ctrl+b p                              # 前のウィンドウ"
    echo "  Ctrl+b 0/1/2                          # ウィンドウ直接移動"
    echo "  Ctrl+b 矢印キー                        # ペイン間移動"
    echo "  Ctrl+b d                              # デタッチ"
    echo ""
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

    # --helpオプション
    if [[ "$1" == "--help" ]]; then
        show_usage
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
