# ⚡ 14エージェント版 クイックスタート

## 🚀 30秒で開始

### ステップ 1: 環境構築（10秒）

```bash
cd /path/to/organization_unicorn_team
./setup.sh
```

**出力例：**
```
🦄 Organization Unicorn Team - 14エージェント Multi-Agent 環境構築
==================================================================

✅ l1-executiveセッション作成完了
✅ l2-orchestrationセッション作成完了
✅ l3-executionセッション作成完了

🎉 14エージェント Multi-Agent 環境セットアップ完了！
```

### ステップ 2: セッション確認（10秒）

```bash
# セッション一覧表示
tmux list-sessions

# 出力:
# l1-executive: 1 windows (1 panes) ...
# l2-orchestration: 1 windows (1 panes) ...
# l3-execution: 1 windows (1 panes) ...
```

### ステップ 3: エージェント起動（10秒）

```bash
# Layer 1 (Executive) 起動
tmux send-keys -t l1-executive 'claude --dangerously-skip-permissions' C-m

# Layer 2 (Orchestration) 一括起動
for i in {0..2}; do tmux send-keys -t l2-orchestration:0.$i 'claude --dangerously-skip-permissions' C-m; done

# Layer 3 (Execution) 一括起動
for i in {0..4}; do tmux send-keys -t l3-execution:0.$i 'claude --dangerously-skip-permissions' C-m; done
```

---

## 💬 メッセージ送信（使用例）

### Layer 1: Executive に指示

```bash
# CEOにプロジェクト開始指示
./agent-send.sh ceo "
セキュリティガバナンスプロジェクトを開始してください。

目標:
- グローバルセキュリティ組織の構築
- リスク管理フレームワーク確立
- インシデント対応体制の整備

workspace/security-governance/ で全チームが協力してください。
"

# CISOにセキュリティ戦略策定指示
./agent-send.sh ciso "セキュリティ戦略を策定してください"

# CLOに法規制要件整理指示
./agent-send.sh clo "法規制要件を整理してください（GDPRなど）"

# CTOにセキュリティアーキテクチャ設計指示
./agent-send.sh cto "セキュリティアーキテクチャを設計してください"
```

### Layer 2: Orchestration に指示

```bash
# CSIRT Team Leaderにインシデント対応体制構築指示
./agent-send.sh csirt_team_leader "24時間インシデント対応体制を構築してください"

# Auditorに準拠チェック指示
./agent-send.sh auditor "法規制準拠チェックリストを作成してください"

# CTI Analystに脅威分析指示
./agent-send.sh cti_analyst "外部脅威ランドスケープを分析してください"
```

### Layer 3: Execution に指示

```bash
# SOC Analystに監視体制構築指示
./agent-send.sh soc_analyst "24/7セキュリティ監視体制を構築してください"

# White Hackerに脆弱性診断指示
./agent-send.sh white_hacker "全システムの脆弱性診断を実施してください"

# CSIRT Engineerに対応手順作成指示
./agent-send.sh csirt_engineer "インシデント対応手順書を作成してください"

# Network Engineerにネットワークアーキテクチャ設計指示
./agent-send.sh network_engineer "ゼロトラストネットワークアーキテクチャを設計してください"

# App Engineerにセキュアコーディング指示
./agent-send.sh app_engineer "OWASP Top 10対応を実装してください"
```

---

## 📺 画面確認

### Layer 1 (Executive) - 6ペイン

```bash
tmux attach-session -t l1-executive
```

```
┌──────────────┬──────────────┬──────────────┐
│   CEO        │   CLO        │   CISO       │
│ (Global)     │ (Legal)      │ (Security)   │
├──────────────┼──────────────┼──────────────┤
│   CFO        │   CTO        │   CMO        │
│ (Finance)    │ (Tech)       │ (Marketing)  │
└──────────────┴──────────────┴──────────────┘
```

### Layer 2 (Orchestration) - 3ペイン

```bash
tmux attach-session -t l2-orchestration
```

```
┌──────────────────┬──────────────────┬──────────────────┐
│ CSIRT_Leader     │ Auditor          │ CTI_Analyst      │
│ (Incident)       │ (Compliance)     │ (Intelligence)   │
└──────────────────┴──────────────────┴──────────────────┘
```

### Layer 3 (Execution) - 5ペイン

```bash
tmux attach-session -t l3-execution
```

```
┌────────────┬────────────┬────────────┬────────────┬────────────┐
│ SOC        │ White      │ CSIRT      │ Network    │ App        │
│ Analyst    │ Hacker     │ Engineer   │ Engineer   │ Engineer   │
└────────────┴────────────┴────────────┴────────────┴────────────┘
```

---

## 🎯 エージェント一覧

```bash
./agent-send.sh --list
```

**利用可能エージェント：**

| Layer | エージェント | エイリアス |
|-------|-----------|---------|
| L1 | CEO | ceo |
| L1 | CLO | clo, chief_legal_officer |
| L1 | CISO | ciso, chief_information_security_officer |
| L1 | CFO | cfo, chief_financial_officer |
| L1 | CTO | cto, chief_technology_officer |
| L1 | CMO | cmo, chief_marketing_officer |
| L2 | CSIRT Team Leader | csirt_team_leader, csirt_leader, csirt |
| L2 | Auditor | auditor |
| L2 | CTI Analyst | cti_analyst, cti |
| L3 | SOC Analyst | soc_analyst, soc |
| L3 | White Hacker | white_hacker, hacker |
| L3 | CSIRT Engineer | csirt_engineer, csirt_eng |
| L3 | Network Engineer | network_engineer, network_eng |
| L3 | App Engineer | app_engineer, developer |

---

## 📁 ディレクトリ構造

```
organization_unicorn_team/
├── setup.sh          ← 14エージェント環境構築
├── agent-send.sh            ← メッセージ送信（14エージェント対応）
├── CLAUDE.md          ← 詳細ドキュメント
├── QUICKSTART.md      ← このファイル
├── workspace/                  ← 共有作業領域
│   ├── README.md               ← 自動生成
│   └── security-governance/    ← プロジェクト領域
├── tmp/                        ← 完了マーカー
├── logs/                       ← 通信ログ
└── instructions/               ← エージェント指示書（拡張版作成予定）
```

---

## 🔄 基本的なワークフロー

### シナリオ 1: セキュリティガバナンス構築

```
1️⃣ CEO が全体指示
    ↓
2️⃣ L1 (Executive) が並行で戦略立案
    - CEO: プロジェクト全体統括
    - CISO: セキュリティ戦略
    - CLO: 法規制準拠
    - CFO: 予算計画
    - CTO: 技術戦略
    - CMO: ステークホルダー対応
    ↓
3️⃣ L2 (Orchestration) が実行計画立案
    - CSIRT_Leader: 対応体制構築
    - Auditor: 準拠確認
    - CTI_Analyst: 脅威分析
    ↓
4️⃣ L3 (Execution) が実装実行
    - SOC_Analyst: 監視体制構築
    - White_Hacker: 脆弱性診断
    - CSIRT_Engineer: 対応手順作成
    - Network_Engineer: インフラ構築
    - App_Engineer: 開発実装
    ↓
5️⃣ 完了報告 → CEO が最終承認
```

---

## 🛠️ よく使うコマンド

```bash
# エージェント一覧表示
./agent-send.sh --list

# セッション一覧表示
tmux list-sessions

# セッションにアタッチ
tmux attach-session -t l1-executive      # L1
tmux attach-session -t l2-orchestration  # L2
tmux attach-session -t l3-execution      # L3

# セッションからデタッチ
# Ctrl+b → d

# 特定セッションのペイン一覧
tmux list-panes -t l1-executive

# 環境リセット
tmux kill-server
rm -rf ./tmp/* ./logs/* ./workspace/*
./setup.sh

# ログ確認
tail -f logs/send_log.txt

# 状況確認
ls -la tmp/
tree workspace/
```

---

## ⚠️ トラブルシューティング

### Q: エージェントが反応しない
```bash
# セッション確認
tmux list-sessions

# セッション再構築
tmux kill-server
./setup.sh
```

### Q: メッセージが送信されない
```bash
# 正しいエージェント名か確認
./agent-send.sh --list

# ログを確認
cat logs/send_log.txt
```

### Q: ペイン分割が上手くいかない
```bash
# 全セッションをリセット
tmux kill-server
./setup.sh
```

---

## 📖 詳細ドキュメント

より詳しい情報は以下をご参照ください：

- **完全ドキュメント**: `CLAUDE.md`
- **5エージェント版**: `CLAUDE.md` / `README.md`
- **使用方法**: `./agent-send.sh --help`

---

## 🎓 実行例

### 最小限の実行

```bash
# 1. セットアップ
./setup.sh

# 2. CEOのみ起動
tmux send-keys -t l1-executive 'claude --dangerously-skip-permissions' C-m

# 3. 別ウィンドウで指示
./agent-send.sh ceo "プロジェクトを開始してください"
```

### フル実行

```bash
# 1. セットアップ
./setup.sh

# 2. 全エージェント起動
tmux send-keys -t l1-executive 'claude --dangerously-skip-permissions' C-m
for i in {0..2}; do tmux send-keys -t l2-orchestration:0.$i 'claude --dangerously-skip-permissions' C-m; done
for i in {0..4}; do tmux send-keys -t l3-execution:0.$i 'claude --dangerously-skip-permissions' C-m; done

# 3. プロジェクト開始
./agent-send.sh ceo "セキュリティガバナンスプロジェクトを開始してください"

# 4. 進捗確認
watch -n 10 'tmux list-sessions && echo "" && ls -la tmp/ | wc -l'
```

---

**Ready to build with 14 AI agents! 🚀**

