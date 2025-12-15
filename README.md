# Organization Unicorn Team - Global Security Governance System

## これは何？

**3行で説明すると：**
1. 14のAIエージェントがセキュリティガバナンスを協力して推進
2. 3つのレイヤー（経営層・統括層・実行層）で役割分担
3. NIST CSF 2.0、ISO 27001、GDPR準拠のセキュリティ組織を構築

---

## クイックスタート

### 1. 環境構築（1分）
```bash
cd /path/to/organization_unicorn_team
./setup.sh
```

### 2. エージェント起動
```bash
./launch-agents.sh
# y を入力してエンター
```

### 3. プロジェクト開始
```bash
./agent-send.sh ceo "セキュリティガバナンスプロジェクトを開始してください"
```

詳細な手順は `QUICKSTART.md` を参照してください。

---

## エージェント構成（14名）

### Layer 1: Strategic & Governance（経営層 - 6名）

| エージェント | 役割 | エイリアス |
|-------------|------|-----------|
| **CEO** | Global Security Strategy | `ceo` |
| **CLO** | Chief Legal Officer | `clo` |
| **CISO** | Chief Information Security Officer | `ciso` |
| **CFO** | Chief Financial Officer | `cfo` |
| **CTO** | Chief Technology Officer | `cto` |
| **CMO** | Chief Marketing Officer | `cmo` |

### Layer 2: Orchestration & Assurance（統括層 - 3名）

| エージェント | 役割 | エイリアス |
|-------------|------|-----------|
| **CSIRT Team Leader** | Incident Commander | `csirt_leader`, `csirt` |
| **Auditor** | Quality Guardian | `auditor` |
| **CTI Analyst** | Intelligence Oracle | `cti_analyst`, `cti` |

### Layer 3: Execution（実行層 - 5名）

| エージェント | 役割 | エイリアス |
|-------------|------|-----------|
| **SOC Analyst** | Vigilant Watcher | `soc_analyst`, `soc` |
| **White Hacker** | Offensive Architect | `white_hacker`, `hacker` |
| **CSIRT Engineer** | Forensic Detective | `csirt_engineer` |
| **Network Engineer** | Shield Bearer | `network_engineer`, `network_eng` |
| **App Engineer** | Code Fixer | `app_engineer`, `developer` |

---

## 画面レイアウト

```
┌─────────────────────────────────────────────────────────┐
│         Layer 1: Executive (6ペイン, 3x2グリッド)       │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │     CEO      │     CLO      │    CISO      │        │
│  ├──────────────┼──────────────┼──────────────┤        │
│  │     CFO      │     CTO      │    CMO       │        │
│  └──────────────┴──────────────┴──────────────┘        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│     Layer 2: Orchestration (3ペイン, 1x3グリッド)       │
│  ┌─────────────────┬─────────────┬─────────────────┐   │
│  │  CSIRT Leader   │   Auditor   │  CTI Analyst    │   │
│  └─────────────────┴─────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│          Layer 3: Execution (5ペイン, 1x5グリッド)          │
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│ │   SOC    │  White   │  CSIRT   │ Network  │   App    │   │
│ │ Analyst  │ Hacker   │ Engineer │ Engineer │ Engineer │   │
│ └──────────┴──────────┴──────────┴──────────┴──────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## コミュニケーション方法

### メッセージ送信
```bash
./agent-send.sh [エージェント名] "[メッセージ]"
```

### 使用例
```bash
# CEOにプロジェクト開始指示
./agent-send.sh ceo "セキュリティガバナンスプロジェクトを開始してください"

# CISOにセキュリティ戦略策定指示
./agent-send.sh ciso "NIST CSF 2.0に基づくセキュリティポリシーを策定してください"

# SOC Analystに監視体制構築指示
./agent-send.sh soc "24時間監視体制を構築してください"

# White Hackerに脆弱性診断指示
./agent-send.sh white_hacker "Webアプリケーションの脆弱性診断を実施してください"
```

### エージェント一覧表示
```bash
./agent-send.sh --list
```

---

## インシデント対応フロー

```
【検知フェーズ】
SOC Analyst (監視・検知)
    ↓ アラート発報
【分析フェーズ】
CTI Analyst (脅威分析)  ←→  CSIRT Engineer (フォレンジック)
    ↓ 脅威確認
【対応フェーズ】
CSIRT Team Leader (指揮・統括)
    ├→ Network Engineer (ネットワーク遮断・隔離)
    ├→ App Engineer (脆弱性修正・パッチ適用)
    └→ White Hacker (攻撃経路分析・再現テスト)
    ↓ 対応完了報告
【報告フェーズ】
CISO (セキュリティ統括報告)
    ├→ CEO (最終意思決定)
    ├→ CLO (法的対応・規制報告)
    ├→ CFO (損害評価・保険対応)
    └→ CMO (危機コミュニケーション)
    ↓ 是正措置
【監査フェーズ】
Auditor (事後監査・改善提案)
```

---

## ファイル構成

```
organization_unicorn_team/
├── setup.sh                    # 環境構築スクリプト
├── agent-send.sh               # メッセージ送信
├── launch-agents.sh            # 全エージェント起動
├── project-status.sh           # 状況確認
├── CLAUDE.md                   # システム設定
├── README.md                   # このファイル
├── QUICKSTART.md               # クイックスタート
├── instructions/               # エージェント指示書
│   ├── 01_CEO_Global_Security_Strategy.md
│   ├── 02_CLO_Chief_Legal_Officer.md
│   ├── 03_CISO_Chief_Information_Security_Officer.md
│   ├── 04_CFO_Chief_Financial_Officer.md
│   ├── 05_CTO_Chief_Technology_Officer.md
│   ├── 06_CMO_Chief_Marketing_Officer.md
│   ├── 07_CSIRT_Team_Leader.md
│   ├── 08_Auditor.md
│   ├── 09_CTI_Analyst.md
│   ├── 10_SOC_Analyst.md
│   ├── 11_White_Hacker.md
│   ├── 12_CSIRT_Engineer.md
│   ├── 13_Network_Engineer.md
│   └── 14_App_Engineer.md
├── tmp/                        # 完了マーカー
├── logs/                       # 通信ログ
└── workspace/                  # 共有作業領域
```

---

## よく使うコマンド

### 状況確認
```bash
# プロジェクト状況確認
./project-status.sh

# リアルタイム監視
watch -n 10 ./project-status.sh

# ログ確認
cat logs/send_log.txt
```

### 画面操作
```bash
# Layer 1にアタッチ
tmux attach-session -t l1-executive

# Layer 2にアタッチ
tmux attach-session -t l2-orchestration

# Layer 3にアタッチ
tmux attach-session -t l3-execution

# デタッチ: Ctrl+b → d
# セッション切り替え: Ctrl+b → s
```

### トラブルシューティング
```bash
# セッション確認
tmux ls

# 環境リセット
tmux kill-server
./setup.sh

# 全リセット
rm -rf ./tmp/* ./logs/* ./workspace/*
./setup.sh
```

---

## セキュリティフレームワーク

### 準拠規格
- **NIST CSF 2.0**: Cybersecurity Framework
- **ISO 27001**: 情報セキュリティマネジメントシステム
- **GDPR**: EU一般データ保護規則
- **CCPA**: カリフォルニア州消費者プライバシー法

### インシデント対応フレームワーク
- **SANS PICERL**: Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned
- **MITRE ATT&CK**: 攻撃戦術・技術・手順のナレッジベース

---

## 必要なもの

- Mac / Linux / WSL
- tmux（ターミナル分割ツール）
- Claude Code CLI

---

## 参考リンク

- [Claude Code公式](https://docs.anthropic.com/ja/docs/claude-code/overview)
- [Tmux Cheat Sheet](https://tmuxcheatsheet.com/)
- [NIST CSF](https://www.nist.gov/cyberframework)
- [MITRE ATT&CK](https://attack.mitre.org/)

---

**Version**: 2.0 | **Edition**: Global Security Governance | **Agents**: 14
