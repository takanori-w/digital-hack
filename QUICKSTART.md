# 🚀 クイックスタートガイド

## 最速5分でAI組織を起動！

### 前提条件の確認
```bash
# tmuxがインストールされているか確認
tmux -V
# → tmux 3.x などが表示されればOK

# Claude Codeがインストールされているか確認
claude --version
# → バージョンが表示されればOK
```

---

## ステップ1: 環境セットアップ（1分）

```bash
cd /path/to/organization_unicorn_team
./setup.sh
```

**期待される出力：**
```
🦄 Organization Unicorn Team - Multi-Agent 環境構築
======================================================
[INFO] 🧹 既存セッションクリーンアップ開始...
[SUCCESS] ✅ クリーンアップ完了
[INFO] 📺 unicorn-teamセッション作成開始 (4ペイン)...
[SUCCESS] ✅ unicorn-teamセッション作成完了
[INFO] 👑 CEOセッション作成開始...
[SUCCESS] ✅ CEOセッション作成完了
[SUCCESS] 🎉 Organization Unicorn Team 環境セットアップ完了！
```

---

## ステップ2: CEO起動（1分）

```bash
# CEO画面を開く
tmux attach-session -t ceo

# CEO画面内でClaude Code起動
claude --dangerously-skip-permissions
```

> 初回はブラウザで認証してください

**画面から離れる：**
- `Ctrl+b` を押してから `d` を押す

---

## ステップ3: チーム一括起動（1分）

```bash
# 自動起動スクリプトを使用
./launch-agents.sh

# または手動で
for i in {0..3}; do
  tmux send-keys -t unicorn-team:0.$i 'claude --dangerously-skip-permissions' C-m
done
```

**各画面でブラウザ認証を完了してください**

---

## ステップ4: チーム画面確認（30秒）

```bash
tmux attach-session -t unicorn-team
```

**4分割画面が表示されます：**
```
┌─────────────┬─────────────┐
│     CTO     │  VP Sales   │
├─────────────┼─────────────┤
│ Head of Prd │    Lead Eng │
└─────────────┴─────────────┘
```

**セッション間の移動：**
- `Ctrl+b` → `s` でセッション選択
- 矢印キーで選択、Enterで確定

---

## ステップ5: プロジェクト開始（30秒）

```bash
# 新しいターミナルから実行
./agent-send.sh ceo "あなたはCEOです。CrystalBridgeプロジェクトを開始してください。指示書に従って、チームに適切な指示を出してください。"
```

**これでAI組織が動き始めます！🎉**

---

## よく使うコマンド一覧

### 基本操作
```bash
# エージェント一覧表示
./agent-send.sh --list

# プロジェクト状況確認
./project-status.sh

# メッセージ送信
./agent-send.sh [エージェント名] "[メッセージ]"
```

### tmux操作
```bash
# セッション一覧
tmux ls

# CEO画面にアタッチ
tmux attach-session -t ceo

# チーム画面にアタッチ
tmux attach-session -t unicorn-team

# デタッチ（画面から離れる）
Ctrl+b → d

# セッション切り替え
Ctrl+b → s
```

### トラブル対応
```bash
# 全リセット
tmux kill-server
rm -rf ./tmp/* ./logs/*
./setup.sh

# ログ確認
cat logs/send_log.txt

# セッション再作成
tmux kill-session -t ceo
tmux kill-session -t unicorn-team
./setup.sh
```

---

## メッセージ送信例

### CEOにプロジェクト開始を指示
```bash
./agent-send.sh ceo "CrystalBridgeプロジェクトを開始してください"
```

### CTOに技術選定を依頼
```bash
./agent-send.sh cto "技術スタックの選定をお願いします"
```

### VP Salesに市場調査を依頼
```bash
./agent-send.sh vp_sales "ターゲット市場の調査を開始してください"
```

### Head of Productに要件定義を依頼
```bash
./agent-send.sh hop "ユーザーストーリーを作成してください"
```

### Lead Engineerに実装を依頼
```bash
./agent-send.sh engineer "アーキテクチャ設計をお願いします"
```

---

## トラブルシューティング

### Q: エージェントが反応しない
```bash
# 状態確認
./project-status.sh

# 再起動
tmux kill-session -t ceo
tmux kill-session -t unicorn-team
./setup.sh
./launch-agents.sh
```

### Q: メッセージが届かない
```bash
# ログ確認
cat logs/send_log.txt

# セッション確認
tmux ls

# 手動テスト
./agent-send.sh ceo "テストメッセージ"
```

### Q: tmuxセッションが見つからない
```bash
# セットアップ実行
./setup.sh

# セッション確認
tmux ls
```

### Q: Claude Code認証がうまくいかない
```bash
# ブラウザで以下にアクセス
# https://claude.ai

# ログイン後、再度起動
claude --dangerously-skip-permissions
```

---

## 次のステップ

1. **README.md** - 詳細なドキュメント
2. **CLAUDE.md** - システム構成
3. **instructions/** - 各エージェントの指示書

詳細は **README.md** を参照してください！

---

**動作確認済み環境:**
- macOS 14.x (Sonoma)
- tmux 3.x
- Claude Code CLI 最新版

**問題が発生した場合:**
1. README.mdを確認
2. ログを確認（logs/send_log.txt）
3. セッションをリセット（tmux kill-server）
