# LifePlan Navigator - セキュリティチーム連携指示書

**発行日**: 2025-12-11
**発行者**: CISO (Chief Information Security Officer)
**分類**: 内部機密
**緊急度**: 高

---

## 1. 目的

本ドキュメントは、LifePlan Navigator Webアプリケーションのセキュリティ品質確保のため、White Hacker および SOC Analyst への具体的な作業指示を定義します。

---

## 2. 現状サマリ

### 2.1 発見済み脆弱性

| ID | 深刻度 | 概要 | 状態 |
|----|--------|------|------|
| VER-001 | Critical | CSRF httpOnly/Double Submit Cookie矛盾 | 修正待ち |
| VULN-001 | Critical | LocalStorageへの機密情報平文保存 | 修正待ち |
| VULN-002 | High | XSS脆弱性（サニタイゼーション未実装） | 修正待ち |
| VULN-003 | High | セキュリティヘッダー不足 | 一部対応済み |
| VULN-005 | Medium | 入力バリデーション不足 | 修正待ち |
| VULN-008 | Medium | 認証・認可機能未実装 | 設計完了 |

### 2.2 作成済みドキュメント

| ドキュメント | 概要 | 主担当 |
|-------------|------|--------|
| LifePlan_Navigator_Security_Requirements.md | セキュリティ要件定義 | CISO |
| LifePlan_Navigator_Implementation_Guide.md | 実装ガイド | App Engineer |
| VULNERABILITY_ASSESSMENT_REPORT.md | 脆弱性診断レポート | White Hacker |
| SECURITY_VERIFICATION_REPORT.md | セキュリティ検証レポート | White Hacker |
| SECURITY_CODE_REVIEW_INSTRUCTIONS.md | コードレビュー指示書 | CISO |
| AUTHENTICATION_IMPLEMENTATION_GUIDE.md | 認証実装ガイド | CISO |
| SECURITY_TEST_CASES.md | セキュリティテストケース | CISO |
| PRE_DEPLOYMENT_SECURITY_CHECKLIST.md | デプロイ前チェックリスト | CISO |

---

## 3. White Hacker への指示

### 3.1 即時対応タスク

#### タスク1: CSRF修正の検証 (優先度: P0)

**背景**: App EngineerがVER-001の修正を実施予定。修正完了後の検証が必要。

**作業内容**:
```
1. 修正完了通知を受け取り次第、検証開始
2. 検証項目:
   - CSRFトークンがリクエストヘッダーに正しく付与されること
   - 不正なトークンで403 Forbiddenが返ること
   - トークンなしで403 Forbiddenが返ること
   - トークンがCORSで漏洩しないこと
3. 検証結果をSECURITY_VERIFICATION_REPORT.mdに追記
4. CISOへ結果報告
```

**期限**: App Engineer修正完了後24時間以内

**検証コマンド例**:
```bash
# トークンなしでPOST
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
# 期待: 403 CSRF token validation failed

# 不正トークンでPOST
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: invalid-token" \
  -d '{"test": "data"}'
# 期待: 403 CSRF token validation failed
```

#### タスク2: XSS脆弱性の再検証 (優先度: P1)

**作業内容**:
```
1. サニタイゼーション実装後の検証
2. 以下のペイロードでテスト:
   - <script>alert(1)</script>
   - <img src=x onerror=alert(1)>
   - <svg onload=alert(1)>
   - javascript:alert(1)
3. 全入力フィールドで検証
4. 結果をレポート
```

**期限**: 修正完了後48時間以内

#### タスク3: 本番デプロイ前ペネトレーションテスト (優先度: P0)

**作業内容**:
```
1. SECURITY_TEST_CASES.md に基づくテスト実施
2. テスト範囲:
   - 認証バイパス試行
   - 認可バイパス試行 (IDOR)
   - セッションハイジャック試行
   - XSS攻撃 (Reflected, Stored, DOM)
   - CSRF攻撃
   - クリックジャッキング
   - インジェクション攻撃
3. 発見した脆弱性は即座にCISO/CSIRT Leaderに報告
4. 最終レポート作成
```

**期限**: 本番デプロイ予定日の3日前まで

### 3.2 報告フォーマット

```markdown
## ペネトレーションテスト結果報告

**テスト日**: YYYY-MM-DD
**テスト担当**: White Hacker
**対象環境**: [staging/production]

### サマリ
| 深刻度 | 件数 |
|--------|------|
| Critical | X件 |
| High | X件 |
| Medium | X件 |
| Low | X件 |

### 発見事項
#### [VULN-XXX] タイトル
- **深刻度**: Critical/High/Medium/Low
- **CVSS**: X.X
- **CWE**: CWE-XXX
- **再現手順**: ...
- **推奨対策**: ...

### 結論
[デプロイ可/条件付き可/不可]
```

### 3.3 連絡コマンド

```bash
# CISOへの報告
./agent-send.sh ciso "【セキュリティ検証完了】VER-001 CSRF修正: [合格/不合格] 詳細: ..."

# CSIRT Leaderへの報告
./agent-send.sh csirt_leader "【脆弱性発見】[Critical/High] 概要: ..."

# App Engineerへのフィードバック
./agent-send.sh app_engineer "【検証フィードバック】修正項目: 状態: ..."
```

---

## 4. SOC Analyst への指示

### 4.1 即時対応タスク

#### タスク1: 監視環境の準備 (優先度: P0)

**作業内容**:
```
1. LifePlan Navigator用の監視ダッシュボード作成
2. 以下のメトリクスを設定:
   - ログイン成功/失敗率
   - エラーレート (4xx, 5xx)
   - レスポンスタイム
   - 同時接続数
3. ログ収集パイプライン設定
4. 動作確認
```

**期限**: 本番デプロイの1週間前

#### タスク2: アラートルール設定 (優先度: P0)

**作業内容**:
```
1. 以下のアラートルールを設定:

   # ブルートフォース検知
   - 条件: 同一IPから5分間に10回以上のログイン失敗
   - アクション: アラート発報 + 該当IPを一時ブロック
   - 重要度: High

   # 異常なアクセスパターン
   - 条件: 通常の10倍以上のリクエスト/分
   - アクション: アラート発報
   - 重要度: Medium

   # 機密データ大量アクセス
   - 条件: 1時間に100件以上のユーザーデータ取得
   - アクション: アラート発報 + 操作一時停止
   - 重要度: High

   # WAFブロック急増
   - 条件: 5分間に50件以上のWAFブロック
   - アクション: アラート発報
   - 重要度: High

   # 深夜の管理者アクセス
   - 条件: 02:00-06:00の管理者ログイン
   - アクション: アラート発報
   - 重要度: Medium
```

**期限**: 本番デプロイの3日前

#### タスク3: インシデント対応手順の確認 (優先度: P1)

**作業内容**:
```
1. インシデント対応フローの確認
2. エスカレーションマトリクスの確認
3. 連絡先の最新化
4. 対応訓練の実施（CSIRT Leaderと調整）
```

**期限**: 本番デプロイの5日前

### 4.2 ログ収集要件

| ログ種別 | 収集元 | 保持期間 | 形式 |
|----------|--------|----------|------|
| 認証ログ | NextAuth.js | 2年 | JSON |
| アクセスログ | Nginx/ALB | 1年 | CLF |
| アプリケーションログ | Next.js | 90日 | JSON |
| エラーログ | Sentry/自前 | 90日 | JSON |
| WAFログ | Cloudflare | 1年 | JSON |
| 監査ログ | カスタム | 7年 | JSON |

### 4.3 監視ダッシュボード要件

```
┌─────────────────────────────────────────────────────────────┐
│             LifePlan Navigator - Security Dashboard          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Active Users │  │ Error Rate   │  │ Avg Response │      │
│  │    1,234     │  │    0.12%     │  │    145ms     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Login Attempts (Last 24h)                  │   │
│  │  [グラフ: 成功/失敗の推移]                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Security Events                            │   │
│  │  - 10:23 Failed login: user@example.com (5 attempts)│   │
│  │  - 10:15 WAF Block: SQL Injection attempt           │   │
│  │  - 09:58 New IP login: admin@company.com            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ WAF Blocks (24h)     │  │ Geo Distribution     │        │
│  │ [グラフ]             │  │ [地図]               │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 連絡コマンド

```bash
# CISOへの報告
./agent-send.sh ciso "【監視設定完了】ダッシュボード/アラート設定完了。詳細: ..."

# CSIRT Leaderへの報告
./agent-send.sh csirt_leader "【アラート発報】[High] 概要: ... 対応状況: ..."

# Network Engineerへの連携
./agent-send.sh network_eng "【ログ収集】WAFログ連携設定の確認をお願いします"
```

---

## 5. 連携スケジュール

```
2025-12-11 (今日)
└── ドキュメント作成完了

2025-12-12
├── App Engineer: CSRF修正完了
├── White Hacker: CSRF検証開始
└── SOC Analyst: 監視環境準備開始

2025-12-13
├── White Hacker: CSRF検証完了
├── App Engineer: XSS対策実装
└── SOC Analyst: アラートルール設定

2025-12-14
├── White Hacker: XSS検証
├── App Engineer: 入力バリデーション実装
└── SOC Analyst: 監視ダッシュボード完成

2025-12-15
├── White Hacker: ペネトレーションテスト
├── SOC Analyst: インシデント対応訓練
└── CISO: 中間レビュー

2025-12-16
├── White Hacker: ペネトレーションテスト完了
├── CISO: 最終セキュリティレビュー
└── 本番デプロイ判断

2025-12-17 (予定)
└── 本番デプロイ（承認条件付き）
```

---

## 6. エスカレーションマトリクス

| 深刻度 | 検出者 | 報告先 | 対応時間 |
|--------|--------|--------|----------|
| Critical | White Hacker/SOC | CISO, CSIRT Leader, CEO | 即時 |
| High | White Hacker/SOC | CISO, CSIRT Leader | 4時間以内 |
| Medium | White Hacker/SOC | CSIRT Leader | 24時間以内 |
| Low | White Hacker/SOC | App Engineer Lead | 1週間以内 |

---

## 7. 承認

| 役職 | 氏名 | 署名 | 日付 |
|------|------|------|------|
| CISO | | | 2025-12-11 |
| CSIRT Leader | | | |
| White Hacker | | | |
| SOC Analyst | | | |

---

## 8. 連絡先一覧

```bash
# 全エージェント一覧
./agent-send.sh --list

# Layer 1 (Executive)
./agent-send.sh ceo "[メッセージ]"
./agent-send.sh ciso "[メッセージ]"
./agent-send.sh cto "[メッセージ]"

# Layer 2 (Orchestration)
./agent-send.sh csirt_leader "[メッセージ]"

# Layer 3 (Execution)
./agent-send.sh white_hacker "[メッセージ]"
./agent-send.sh soc "[メッセージ]"
./agent-send.sh network_eng "[メッセージ]"
./agent-send.sh app_engineer "[メッセージ]"
```

---
*本ドキュメントは機密情報を含みます。取り扱いには十分ご注意ください。*
