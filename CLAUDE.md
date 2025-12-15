# Organization Unicorn Team - Global Security Governance System

## プロジェクト概要
グローバルなセキュリティガバナンスを実現する14のAIエージェントによるマルチエージェント通信システムです。

NIST CSF 2.0、ISO 27001、GDPR、CCPAなどの国際標準に準拠し、24時間365日のセキュリティオペレーションを実現します。

## セッション構成

**単一セッション「agents」+ 3ウィンドウ構成**

セッション切り替え不要で、ウィンドウ切り替えのみで全14エージェントにアクセス可能。
エージェント落下リスクを軽減した安定構成です。

```
セッション: agents
├── Window 0: L1-Executive (6ペイン)
├── Window 1: L2-Orchestration (3ペイン)
└── Window 2: L3-Execution (5ペイン)
```

## エージェント構成（14エージェント体制）

### Layer 1: Strategic & Governance（経営層 - 6名）
Window 0: `L1-Executive`

| Agent | Target | Role | 指示書 |
|-------|--------|------|--------|
| **CEO** | agents:0.0 | The Ultimate Decision Maker | @instructions/01_CEO_Global_Security_Strategy.md |
| **CLO** | agents:0.2 | Guardian of Law & Ethics | @instructions/02_CLO_Chief_Legal_Officer.md |
| **CISO** | agents:0.4 | Shield of the Enterprise | @instructions/03_CISO_Chief_Information_Security_Officer.md |
| **CFO** | agents:0.1 | Risk Quantifier | @instructions/04_CFO_Chief_Financial_Officer.md |
| **CTO** | agents:0.3 | Tech Strategist & DevSecOps Enabler | @instructions/05_CTO_Chief_Technology_Officer.md |
| **CMO** | agents:0.5 | Voice of Trust | @instructions/06_CMO_Chief_Marketing_Officer.md |

### Layer 2: Orchestration & Assurance（統括層 - 3名）
Window 1: `L2-Orchestration`

| Agent | Target | Role | 指示書 |
|-------|--------|------|--------|
| **CSIRT Team Leader** | agents:1.0 | Incident Commander | @instructions/07_CSIRT_Team_Leader.md |
| **Auditor** | agents:1.1 | Quality Guardian | @instructions/08_Auditor.md |
| **CTI Analyst** | agents:1.2 | Intelligence Oracle | @instructions/09_CTI_Analyst.md |

### Layer 3: Execution（実行層 - 5名）
Window 2: `L3-Execution`

| Agent | Target | Role | 指示書 |
|-------|--------|------|--------|
| **SOC Analyst** | agents:2.0 | The Vigilant Watcher | @instructions/10_SOC_Analyst.md |
| **White Hacker** | agents:2.1 | The Offensive Architect | @instructions/11_White_Hacker.md |
| **CSIRT Engineer** | agents:2.2 | The Omni-Platform Detective | @instructions/12_CSIRT_Engineer.md |
| **Network Engineer** | agents:2.3 | The Shield Bearer | @instructions/13_Network_Engineer.md |
| **App Engineer** | agents:2.4 | The Code Fixer | @instructions/14_App_Engineer.md |

## 画面レイアウト

```
┌─────────────────────────────────────────────────────────┐
│   Window 0: L1-Executive (6ペイン, 3x2グリッド)         │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │     CEO      │     CLO      │    CISO      │        │
│  │  (Strategy)  │   (Legal)    │  (Security)  │        │
│  ├──────────────┼──────────────┼──────────────┤        │
│  │     CFO      │     CTO      │    CMO       │        │
│  │  (Finance)   │    (Tech)    │  (Marketing) │        │
│  └──────────────┴──────────────┴──────────────┘        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│   Window 1: L2-Orchestration (3ペイン, 1x3グリッド)     │
│  ┌─────────────────┬─────────────┬─────────────────┐   │
│  │  CSIRT Leader   │   Auditor   │  CTI Analyst    │   │
│  │  (Incident)     │   (Audit)   │  (Intelligence) │   │
│  └─────────────────┴─────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│    Window 2: L3-Execution (5ペイン, 1x5グリッド)            │
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│ │   SOC    │  White   │  CSIRT   │ Network  │   App    │   │
│ │ Analyst  │ Hacker   │ Engineer │ Engineer │ Engineer │   │
│ └──────────┴──────────┴──────────┴──────────┴──────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## 環境セットアップ

### 1. 初期セットアップ（Claude自動起動付き）
```bash
# 14エージェント用tmuxセッション作成 + Claude自動起動
./setup.sh

# Claude自動起動なしの場合
./setup.sh --no-claude
```

### 2. セッション操作
```bash
# セッションにアタッチ
tmux attach-session -t agents

# ウィンドウ切り替え（セッション内）
Ctrl+b n        # 次のウィンドウ (L1 → L2 → L3)
Ctrl+b p        # 前のウィンドウ (L3 → L2 → L1)
Ctrl+b 0        # Window 0 (L1-Executive)
Ctrl+b 1        # Window 1 (L2-Orchestration)
Ctrl+b 2        # Window 2 (L3-Execution)

# ペイン切り替え（ウィンドウ内）
Ctrl+b 矢印キー  # 上下左右のペインに移動
Ctrl+b q        # ペイン番号表示 → 番号キーで移動

# デタッチ（エージェントは稼働継続）
Ctrl+b d
```

## メッセージ送信方法

### 基本コマンド
```bash
./agent-send.sh [エージェント名] "[メッセージ]"
```

### エージェント名（エイリアス対応）

**Layer 1 (Executive)**
- **CEO**: `ceo`
- **CLO**: `clo`, `chief_legal_officer`
- **CISO**: `ciso`, `chief_information_security_officer`
- **CFO**: `cfo`, `chief_financial_officer`
- **CTO**: `cto`, `chief_technology_officer`
- **CMO**: `cmo`, `chief_marketing_officer`

**Layer 2 (Orchestration)**
- **CSIRT Team Leader**: `csirt_team_leader`, `csirt_leader`, `csirt`
- **Auditor**: `auditor`
- **CTI Analyst**: `cti_analyst`, `cti`, `threat_intelligence`

**Layer 3 (Execution)**
- **SOC Analyst**: `soc_analyst`, `soc`
- **White Hacker**: `white_hacker`, `hacker`, `penetration`
- **CSIRT Engineer**: `csirt_engineer`, `csirt_eng`, `incident_response`
- **Network Engineer**: `network_engineer`, `network_eng`, `infra`
- **App Engineer**: `app_engineer`, `application_engineer`, `developer`

### 使用例
```bash
# CEOにセキュリティ戦略を依頼
./agent-send.sh ceo "グローバルセキュリティガバナンス体制を構築してください"

# CISOにセキュリティポリシー策定を依頼
./agent-send.sh ciso "NIST CSF 2.0に基づくセキュリティポリシーを策定してください"

# CSIRT Team Leaderにインシデント対応訓練を依頼
./agent-send.sh csirt_leader "インシデント対応訓練シナリオを作成してください"

# SOC Analystに脅威監視を依頼
./agent-send.sh soc "24時間監視体制を構築してください"

# White Hackerにペネトレーションテストを依頼
./agent-send.sh white_hacker "Webアプリケーションの脆弱性診断を実施してください"

# Network Engineerにファイアウォール設定を依頼
./agent-send.sh network_eng "NGFWのセキュリティポリシーを設定してください"
```

## インシデント対応フロー

```
【検知フェーズ】
SOC Analyst (監視・検知)
    │
    ↓ アラート発報
【分析フェーズ】
CTI Analyst (脅威分析)  ←→  CSIRT Engineer (フォレンジック)
    │
    ↓ 脅威確認
【対応フェーズ】
CSIRT Team Leader (指揮・統括)
    │
    ├→ Network Engineer (ネットワーク遮断・隔離)
    ├→ App Engineer (脆弱性修正・パッチ適用)
    └→ White Hacker (攻撃経路分析・再現テスト)
    │
    ↓ 対応完了報告
【報告フェーズ】
CISO (セキュリティ統括報告)
    │
    ├→ CEO (最終意思決定)
    ├→ CLO (法的対応・規制報告)
    ├→ CFO (損害評価・保険対応)
    └→ CMO (危機コミュニケーション)
    │
    ↓ 是正措置
【監査フェーズ】
Auditor (事後監査・改善提案)
```

## よく使うコマンド

```bash
# エージェント一覧表示
./agent-send.sh --list

# ヘルプ表示
./agent-send.sh --help

# セッション確認
tmux ls

# ウィンドウ一覧
tmux list-windows -t agents

# セッションにアタッチ
tmux attach-session -t agents

# 環境リセット
tmux kill-session -t agents
./setup.sh
```

## セキュリティフレームワーク

### 準拠規格
- **NIST CSF 2.0**: Cybersecurity Framework
- **ISO 27001**: 情報セキュリティマネジメントシステム
- **GDPR**: EU一般データ保護規則
- **CCPA**: カリフォルニア州消費者プライバシー法
- **SOC 2 Type II**: サービス組織管理基準

### インシデント対応フレームワーク
- **SANS PICERL**: Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned
- **MITRE ATT&CK**: 攻撃戦術・技術・手順のナレッジベース

### リスク評価フレームワーク
- **FAIR**: Factor Analysis of Information Risk
- **CVSS**: Common Vulnerability Scoring System

## エージェント間コミュニケーションプロトコル

### エスカレーションマトリクス

| Severity | 対応時間 | 報告先 |
|----------|----------|--------|
| Critical (P0) | 即時 | CEO, CISO, CSIRT Leader |
| High (P1) | 4時間以内 | CISO, CSIRT Leader |
| Medium (P2) | 24時間以内 | CSIRT Leader |
| Low (P3) | 1週間以内 | SOC Analyst |

### 通知チェーン
```
P0 (Critical): SOC → CSIRT Leader → CISO → CEO → CLO/CFO/CMO
P1 (High):     SOC → CSIRT Leader → CISO
P2 (Medium):   SOC → CSIRT Leader
P3 (Low):      SOC (自己完結)
```

## トラブルシューティング

### セッションが見つからない
```bash
# セットアップ実行
./setup.sh
```

### エージェントが反応しない
```bash
# セッション確認
tmux ls

# 再起動
tmux kill-session -t agents
./setup.sh
```

### メッセージが届かない
```bash
# ログ確認
cat logs/send_log.txt

# 手動テスト
./agent-send.sh ceo "テストメッセージ"
```

### 手動でClaude起動
```bash
# Layer 1
for i in {0..5}; do tmux send-keys -t agents:0.$i 'claude --dangerously-skip-permissions' C-m; done

# Layer 2
for i in {0..2}; do tmux send-keys -t agents:1.$i 'claude --dangerously-skip-permissions' C-m; done

# Layer 3
for i in {0..4}; do tmux send-keys -t agents:2.$i 'claude --dangerously-skip-permissions' C-m; done
```

## 参考情報

### システム構成
- 元リポジトリ: [Akira-Papa/Claude-Code-Communication](https://github.com/Akira-Papa/Claude-Code-Communication)
- Claude Code公式: https://docs.anthropic.com/ja/docs/claude-code/overview
- Tmux Cheat Sheet: https://tmuxcheatsheet.com/

### セキュリティリソース
- NIST CSF: https://www.nist.gov/cyberframework
- MITRE ATT&CK: https://attack.mitre.org/
- OWASP: https://owasp.org/

---
**Version**: 2.1 | **Edition**: Global Security Governance | **Agents**: 14 | **Session**: Single Session + Multi-Window
