# LifePlan Navigator SOC運用手順書

| 項目 | 内容 |
|------|------|
| ドキュメント名 | SOC運用手順書 (Runbook) |
| バージョン | 1.0 |
| 作成日 | 2025-12-11 |
| 作成者 | SOC Analyst |
| レビュー | CSIRT Team Leader, CTI Analyst, Network Engineer |
| 分類 | Confidential |

---

## 1. 概要

### 1.1 目的
本ドキュメントは、LifePlan Navigator の SOC運用における標準的な手順を定義する。24時間365日の監視体制を維持し、セキュリティインシデントの早期検知・対応を実現する。

### 1.2 適用範囲
- SOC日常監視業務
- アラート対応手順
- インシデント初動対応
- エスカレーション手順

### 1.3 関連ドキュメント
- LifePlan_Navigator_SOC_Monitoring_Design.md
- LifePlan_Navigator_Log_Management.md
- LifePlan_Navigator_Detection_Rules.md
- LifePlan_Navigator_Alert_Rules.md

---

## 2. SOC日常業務

### 2.1 シフト交代手順

#### シフト開始チェックリスト

```
□ 1. シフト引継ぎミーティング実施
   □ 前シフトからの申し送り事項確認
   □ 未解決インシデント状況確認
   □ 特記事項（メンテナンス予定等）確認

□ 2. システム状態確認
   □ SOC Overview ダッシュボード確認
   □ Active Alerts数確認
   □ Security Score確認
   □ 各監視システム稼働状況確認

□ 3. ツール動作確認
   □ SIEM (Splunk) ログイン・検索実行
   □ PagerDuty オンコール設定確認
   □ Slack 通知チャンネル確認
   □ チケットシステム アクセス確認

□ 4. ドキュメント確認
   □ 最新のRunbook確認
   □ 検知ルール更新有無確認
   □ 脅威インテリジェンス更新確認

□ 5. シフト開始報告
   □ Slackにシフト開始投稿
   □ PagerDutyステータス更新
```

#### シフト終了チェックリスト

```
□ 1. 未解決事項整理
   □ 対応中アラート状況まとめ
   □ 未完了タスク一覧作成
   □ 要継続監視事項リストアップ

□ 2. シフトサマリー作成
   □ 対応アラート件数
   □ インシデント発生件数
   □ 特記事項

□ 3. 引継ぎ準備
   □ 引継ぎドキュメント更新
   □ 次シフトへの申し送り事項記載
   □ 優先対応事項の明示

□ 4. シフト終了報告
   □ Slackにシフト終了投稿
   □ PagerDutyステータス更新
```

### 2.2 定期監視タスク

| タスク | 頻度 | 実施内容 | 記録先 |
|--------|------|----------|--------|
| ダッシュボード確認 | 15分毎 | SOC Overview、Security Alerts | シフトログ |
| アラートキュー確認 | 15分毎 | 未対応アラート確認・対応 | チケットシステム |
| 脅威インテリジェンス確認 | 1時間毎 | 新規IOC、脅威情報確認 | インテルログ |
| システムヘルスチェック | 2時間毎 | 監視システム稼働確認 | シフトログ |
| ログ収集状況確認 | 4時間毎 | ログ欠損確認 | シフトログ |
| 日次サマリー作成 | 日次 | 日次レポート作成 | Confluence |

### 2.3 監視ダッシュボード操作

#### SOC Overview ダッシュボード

**アクセス方法:**
```
URL: https://grafana.internal.lifeplan.example.com/d/soc-overview
認証: SSO (Active Directory)
```

**確認項目:**
1. **Active Alerts パネル**
   - Critical/High アラートは即座に確認
   - Medium/Low は15分以内に確認

2. **Security Score パネル**
   - 80未満: 詳細確認必要
   - 70未満: CSIRT Team Leader報告

3. **Threat Level パネル**
   - HIGH以上: 警戒態勢

4. **Authentication Activity パネル**
   - 失敗率急増時は詳細確認

5. **WAF/IDS Events パネル**
   - 攻撃ブロック急増時は詳細確認

---

## 3. アラート対応手順

### 3.1 アラート確認フロー

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      アラート対応フローチャート                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [アラート受信]                                                         │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────┐                                                        │
│  │アラート確認 │ ← 5分以内に確認                                       │
│  └──────┬──────┘                                                        │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────┐    Yes    ┌─────────────────┐                     │
│  │ 誤検知判定？    │──────────→│ 誤検知として    │                     │
│  │                 │           │ クローズ        │                     │
│  └────────┬────────┘           └─────────────────┘                     │
│           │ No                                                          │
│           ▼                                                             │
│  ┌─────────────────┐    Yes    ┌─────────────────┐                     │
│  │ 即時対応必要？  │──────────→│ インシデント    │                     │
│  │ (P0/P1)         │           │ 対応開始        │                     │
│  └────────┬────────┘           └─────────────────┘                     │
│           │ No                                                          │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │ 詳細調査        │                                                    │
│  │ ・ログ分析      │                                                    │
│  │ ・影響範囲特定  │                                                    │
│  └────────┬────────┘                                                    │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐    Yes    ┌─────────────────┐                     │
│  │ セキュリティ    │──────────→│ インシデント    │                     │
│  │ インシデント？  │           │ チケット起票    │                     │
│  └────────┬────────┘           └─────────────────┘                     │
│           │ No                                                          │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │ アラート対応    │                                                    │
│  │ としてクローズ  │                                                    │
│  └─────────────────┘                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 誤検知判定基準

#### 判定フローチャート

```
┌─────────────────────────────────────────────────────────────────┐
│                    誤検知判定フロー                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [アラート内容確認]                                             │
│         │                                                       │
│         ▼                                                       │
│  ┌───────────────────┐                                          │
│  │ 1. 既知の誤検知    │                                          │
│  │    パターン？      │                                          │
│  └─────────┬─────────┘                                          │
│            │                                                    │
│   ┌────────┴────────┐                                           │
│   │                 │                                           │
│   ▼ Yes             ▼ No                                        │
│ [誤検知]     ┌──────────────┐                                   │
│              │ 2. 正規業務   │                                   │
│              │    活動？     │                                   │
│              └──────┬───────┘                                   │
│                     │                                           │
│         ┌───────────┴───────────┐                               │
│         │                       │                               │
│         ▼ Yes                   ▼ No                            │
│  ┌──────────────┐       ┌──────────────┐                        │
│  │ 3. 承認済み   │       │ 4. 攻撃の    │                        │
│  │    操作？     │       │    指標？     │                        │
│  └──────┬───────┘       └──────┬───────┘                        │
│         │                       │                               │
│   ┌─────┴─────┐           ┌─────┴─────┐                         │
│   │           │           │           │                         │
│   ▼ Yes       ▼ No        ▼ Yes       ▼ No                      │
│ [誤検知]   [要調査]    [真陽性]    [要調査]                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 誤検知パターン一覧

| パターンID | 説明 | 検知ルール | 判定基準 |
|-----------|------|-----------|----------|
| FP-001 | 内部スキャナ | DET-RECON-001 | 承認済みスキャナIPからのアクセス |
| FP-002 | バッチ処理 | DET-DATA-001 | 定期バッチ実行時間帯 |
| FP-003 | 負荷テスト | DET-NET-001 | 負荷テストフラグ有効 |
| FP-004 | SSO連携 | DET-AUTH-003 | SSO連携システムからのアクセス |
| FP-005 | CDNキャッシュ | DET-WEB-* | CDN IPからのアクセス |

### 3.3 各アラート対応手順

#### SEC-001: ブルートフォース攻撃（同一IP）

**概要:**
同一IPアドレスから複数回のログイン失敗が検知された場合の対応手順

**対応手順:**

```
1. アラート確認 (5分以内)
   □ アラート詳細確認
     - 発生時刻
     - 送信元IP
     - 対象アカウント
     - 失敗回数

2. 初期分析 (10分以内)
   □ IPアドレス調査
     - GeoIP確認 (国、都市)
     - Whois情報確認
     - 脅威インテリジェンス照合
     - 過去のアラート履歴確認

   □ 対象アカウント確認
     - アカウント状態 (ロック/有効)
     - 最終ログイン成功日時
     - アカウント所有者情報

3. 誤検知判定
   □ 正規ユーザーのパスワード忘れ？
     - 失敗後にパスワードリセット実行あり → 誤検知
   □ VPN/プロキシ経由？
     - 社内プロキシIPの場合 → 詳細調査必要
   □ 既知のスキャナ/ボット？
     - 脅威インテルでボット判定 → ブロック対象

4. 対応アクション
   □ 攻撃と判断した場合:
     a. WAF/FWでIP一時ブロック (30分)
        コマンド: aws waf update-ip-set ...
     b. 対象アカウントの追加保護
        - MFA強制有効化検討
        - パスワードリセット推奨
     c. CSIRT Team Leader報告 (P1の場合)

   □ 誤検知と判断した場合:
     a. 誤検知理由を記録
     b. 必要に応じてホワイトリスト追加検討

5. クローズ処理
   □ チケットにアクション結果記録
   □ 対応時間記録
   □ チューニング提案 (必要に応じて)
```

**SIEM検索クエリ:**
```spl
index=lifeplan_security sourcetype=auth_log action=login_failure src_ip={{alert.src_ip}}
| stats count, values(user) as target_users, min(_time) as first_attempt, max(_time) as last_attempt by src_ip
| lookup geoip_lookup ip as src_ip OUTPUT country, city, asn, org
| lookup threat_intel_ip ip as src_ip OUTPUT threat_type, confidence
| table src_ip, country, city, org, count, target_users, first_attempt, last_attempt, threat_type
```

---

#### SEC-006: 不可能な移動検知 (Impossible Travel)

**概要:**
物理的に不可能な速度での地理的移動が検知された場合の対応手順（Critical）

**対応手順:**

```
1. 即時確認 (2分以内)
   □ アラート詳細確認
     - ユーザーID
     - 前回ログイン (時刻、IP、国)
     - 今回ログイン (時刻、IP、国)
     - 計算された移動速度

2. 緊急判断 (3分以内)
   □ 明らかなVPN使用パターン？
     - 前回/今回IPがVPNサービス → VPN利用確認
   □ 企業VPN使用の可能性？
     - 企業VPN IPリスト照合

3. 即時対応 (5分以内)
   □ 攻撃の可能性が高い場合:
     a. 該当セッション即時無効化
        API: POST /admin/sessions/{session_id}/revoke
     b. アカウント一時ロック
        API: POST /admin/users/{user_id}/lock
     c. ユーザーへ確認通知送信
        - 登録済みメールアドレスへ
        - SMS (設定されている場合)

4. CSIRT エスカレーション (P0)
   □ CSIRT Team Leader 即時報告
     - PagerDuty経由
     - Slack #soc-alerts-critical
   □ 報告内容:
     - インシデント概要
     - 実施済み対応
     - 追加調査必要事項

5. 詳細調査
   □ 該当ユーザーのアクティビティ全調査
     - ログイン履歴 (30日分)
     - データアクセス履歴
     - 設定変更履歴
   □ 不正アクセス期間中の操作確認
     - データダウンロード有無
     - 設定変更有無
     - 他アカウントへのアクセス試行

6. 対応完了
   □ ユーザー確認結果により:
     - 正規アクセス確認 → アカウントロック解除
     - 不正アクセス確定 → インシデント対応継続
   □ 全対応内容を記録
```

**SIEM検索クエリ:**
```spl
index=lifeplan_security sourcetype=auth_log user={{alert.user}}
| sort _time
| streamstats current=t last(_time) as prev_time, last(src_ip) as prev_ip by user
| lookup geoip_lookup ip as src_ip OUTPUT lat as curr_lat, lon as curr_lon, country as curr_country
| lookup geoip_lookup ip as prev_ip OUTPUT lat as prev_lat, lon as prev_lon, country as prev_country
| eval time_diff_hours = round((_time - prev_time) / 3600, 2)
| eval distance_km = round(6371 * acos(sin(curr_lat*3.14159/180)*sin(prev_lat*3.14159/180) + cos(curr_lat*3.14159/180)*cos(prev_lat*3.14159/180)*cos((curr_lon-prev_lon)*3.14159/180)), 0)
| table _time, user, prev_ip, prev_country, src_ip, curr_country, time_diff_hours, distance_km
```

---

#### SEC-011: 大量データエクスポート検知

**概要:**
同一ユーザーによる大量のデータエクスポートが検知された場合の対応手順（Critical）

**対応手順:**

```
1. 即時確認 (2分以内)
   □ アラート詳細確認
     - ユーザーID、ロール
     - エクスポート件数
     - エクスポートデータ種別
     - 時間帯

2. 緊急判断 (3分以内)
   □ 承認済みバッチ処理？
     - バッチジョブスケジュール確認
   □ 承認済み管理者操作？
     - 変更管理チケット確認
   □ ユーザーのロール確認
     - 大量エクスポート権限保持者？

3. 即時対応 (5分以内)
   □ 不正の可能性が高い場合:
     a. エクスポート機能一時停止 (該当ユーザー)
        API: POST /admin/users/{user_id}/features/export/disable
     b. 該当セッション無効化
     c. ユーザーアカウント一時ロック

4. CSIRT エスカレーション (P0)
   □ CSIRT Team Leader 即時報告
   □ データ漏洩の可能性を報告
   □ 法務部門 (CLO) への報告準備

5. 詳細調査
   □ エクスポートされたデータの特定
     - ファイル名、サイズ、件数
     - 含まれる個人情報の種類
   □ エクスポート先の確認
     - ダウンロード先IP
     - 外部送信の有無
   □ ユーザーの直近の行動分析
     - 退職予定者ではないか
     - 不審な行動履歴

6. 影響評価
   □ 漏洩データの範囲特定
   □ 影響を受ける可能性のあるユーザー数
   □ GDPR/個人情報保護法上の報告義務確認

7. 対応完了
   □ 全対応内容を記録
   □ インシデントレポート作成
   □ 再発防止策の検討
```

---

#### SEC-018: SQLインジェクション攻撃検知

**概要:**
WAFまたはアクセスログでSQLインジェクション攻撃が検知された場合の対応手順（Critical）

**対応手順:**

```
1. 即時確認 (2分以内)
   □ アラート詳細確認
     - 攻撃元IP
     - 対象エンドポイント
     - 攻撃ペイロード
     - WAFアクション (ブロック/検知のみ)

2. 緊急判断 (3分以内)
   □ WAFでブロック済み？
     - ブロック済み → 攻撃は阻止
     - 検知のみ → 成功の可能性あり、即時対応
   □ 攻撃パターン分析
     - 自動化ツール使用の痕跡
     - 手動攻撃の兆候

3. 即時対応 (5分以内)
   □ 攻撃進行中の場合:
     a. WAFで攻撃元IPブロック (即時)
     b. 対象エンドポイントの一時無効化 (必要に応じて)

4. 攻撃成功可否確認
   □ データベースログ確認
     - 不正なクエリ実行の痕跡
     - エラーログの異常
   □ アプリケーションログ確認
     - 異常なレスポンス
     - データ取得の痕跡

5. CSIRT/開発チーム連携
   □ CSIRT Team Leader報告
   □ App Engineer通知 (脆弱性確認依頼)
     - 対象エンドポイントのコード確認
     - 入力検証の実装確認

6. 詳細調査
   □ 攻撃元IPの調査
     - 脅威インテリジェンス照合
     - 過去の攻撃履歴
   □ 攻撃の範囲特定
     - 他のエンドポイントへの試行
     - 攻撃キャンペーンの一部か

7. 対応完了
   □ WAFルール強化 (必要に応じて)
   □ 脆弱性修正確認
   □ インシデントレポート作成
```

**SIEM検索クエリ:**
```spl
index=lifeplan_security sourcetype=waf_log attack_type="sql_injection"
| stats count, values(uri_path) as targeted_endpoints, values(payload) as payloads by src_ip
| lookup threat_intel_ip ip as src_ip OUTPUT threat_type, campaign
| table src_ip, count, targeted_endpoints, payloads, threat_type, campaign
```

---

## 4. エスカレーション手順

### 4.1 エスカレーション判断基準

| 条件 | エスカレーション先 | 方法 |
|------|------------------|------|
| P0 アラート発生 | CSIRT Team Leader | PagerDuty即時 |
| P1 アラート15分未解決 | CSIRT Team Leader | Slack + PagerDuty |
| データ漏洩の可能性 | CISO + CLO | 電話 + Slack |
| サービス停止 | SRE + Dev Lead | PagerDuty |
| 外部攻撃継続中 | Network Engineer | Slack即時 |

### 4.2 エスカレーション連絡先

| 役割 | 連絡方法 | バックアップ |
|------|----------|-------------|
| SOC On-Call | PagerDuty: soc-oncall | Slack: #soc-oncall |
| CSIRT Team Leader | PagerDuty: csirt-lead | 電話: 緊急連絡先リスト参照 |
| CISO | 電話: 緊急連絡先リスト参照 | Slack DM |
| Network Engineer | PagerDuty: network-oncall | Slack: #network-team |
| App Engineer | PagerDuty: app-oncall | Slack: #dev-team |

### 4.3 エスカレーション報告テンプレート

```
【エスカレーション報告】

■ 基本情報
- 報告日時: YYYY-MM-DD HH:MM
- 報告者: [氏名]
- アラートID: [ID]
- 重要度: [P0/P1/P2/P3]

■ インシデント概要
[1-2文で概要を記載]

■ 検知情報
- 検知日時: YYYY-MM-DD HH:MM
- 検知ルール: [ルールID]
- 影響システム: [システム名]

■ 現在の状況
- ステータス: [調査中/対応中/封じ込め完了]
- 影響範囲: [影響を受けているユーザー/システム]

■ 実施済み対応
1. [対応内容1]
2. [対応内容2]

■ 要請事項
[エスカレーション先への依頼事項]

■ 次回更新予定
[更新予定時刻]
```

---

## 5. インシデント初動対応

### 5.1 インシデント宣言基準

| カテゴリ | インシデント宣言基準 |
|---------|---------------------|
| データ漏洩 | 個人情報/機密情報の外部流出確認または強い疑い |
| 不正アクセス | 認証突破によるシステムへの不正ログイン確認 |
| マルウェア | マルウェア感染確認、C2通信検知 |
| サービス妨害 | DDoS攻撃によるサービス影響発生 |
| 内部不正 | 従業員による意図的な不正行為確認 |

### 5.2 インシデントチケット起票手順

```
1. チケットシステムアクセス
   URL: https://jira.internal.lifeplan.example.com/
   プロジェクト: INCIDENT

2. チケット作成
   □ Issue Type: Security Incident
   □ Summary: [インシデント概要]
   □ Priority: [P0/P1/P2/P3]
   □ Components: [影響システム]
   □ Labels: [incident, security, YYYY-MM]

3. 必須フィールド入力
   □ Detection Time: [検知日時]
   □ Detection Method: [検知方法/ルール]
   □ Incident Type: [カテゴリ選択]
   □ Affected Systems: [影響システム]
   □ Initial Assessment: [初期評価]

4. 添付資料
   □ アラート詳細スクリーンショット
   □ 関連ログ抽出
   □ 初期調査結果

5. 通知設定
   □ Watcher追加: CSIRT Team Leader, CISO
   □ Slack連携: #incident-response
```

### 5.3 証拠保全手順

```
【証拠保全チェックリスト】

□ 1. ログ保全
   □ 関連ログの即時エクスポート
     - 認証ログ
     - アクセスログ
     - 監査ログ
     - WAF/IDS ログ
   □ 保存先: /evidence/INCIDENT-XXXX/logs/
   □ ハッシュ値計算・記録

□ 2. スクリーンショット保存
   □ アラート画面
   □ ダッシュボード状態
   □ 関連する管理画面
   □ 保存先: /evidence/INCIDENT-XXXX/screenshots/

□ 3. メモリダンプ (必要に応じて)
   □ 対象サーバー特定
   □ ダンプ取得承認
   □ ダンプ実行・保存

□ 4. ネットワークキャプチャ (必要に応じて)
   □ キャプチャ範囲決定
   □ キャプチャ開始
   □ 保存・ハッシュ計算

□ 5. 証拠台帳記録
   □ 証拠ID付与
   □ 収集日時記録
   □ 収集者記録
   □ ハッシュ値記録
   □ 保管場所記録
```

---

## 6. 連絡・報告

### 6.1 定期報告

| 報告名 | 頻度 | 宛先 | 内容 |
|--------|------|------|------|
| シフトサマリー | シフト毎 | SOC Team | アラート対応状況 |
| Daily Security Report | 日次 | CSIRT, CISO | セキュリティ状況 |
| Weekly SOC Report | 週次 | Management | KPI、トレンド分析 |
| Monthly Security Review | 月次 | Executive | 総合評価、改善提案 |

### 6.2 報告テンプレート

#### Daily Security Report

```markdown
# Daily Security Report

**Date:** YYYY-MM-DD
**Prepared by:** SOC Team

## Executive Summary
[1-2文で本日のセキュリティ状況を要約]

## Alert Statistics
| Severity | Count | Resolved | Pending |
|----------|-------|----------|---------|
| Critical | X | X | X |
| High | X | X | X |
| Medium | X | X | X |
| Low | X | X | X |

## Key Incidents
[重要なインシデント/アラートの概要]

## Threat Intelligence Updates
[新規IOC、脅威情報のサマリー]

## Action Items
- [ ] [アクション1]
- [ ] [アクション2]

## Metrics
- MTTA: X minutes
- False Positive Rate: X%
- Security Score: XX/100
```

---

## 7. ツール操作ガイド

### 7.1 Splunk 基本操作

**ログイン:**
```
URL: https://splunk.internal.lifeplan.example.com
認証: SSO (Active Directory)
```

**よく使うクエリ:**

```spl
# 直近1時間のセキュリティアラート
index=lifeplan_security earliest=-1h
| stats count by sourcetype, severity
| sort -count

# 特定IPの全アクティビティ
index=* src_ip="X.X.X.X" OR dest_ip="X.X.X.X"
| table _time, index, sourcetype, src_ip, dest_ip, action

# ユーザーの認証履歴
index=lifeplan_security sourcetype=auth_log user="target_user"
| table _time, action, src_ip, user_agent, result

# WAF攻撃検知サマリー
index=lifeplan_security sourcetype=waf_log
| stats count by attack_type, src_ip
| sort -count
```

### 7.2 PagerDuty 操作

**アラート対応:**
```
1. アラート確認
   - PagerDutyアプリ or Webで通知確認

2. アクノレッジ
   - "Acknowledge" ボタンクリック
   - 対応開始を示す

3. 対応完了
   - "Resolve" ボタンクリック
   - 解決理由を記入
```

**エスカレーション:**
```
1. 手動エスカレーション
   - アラート詳細画面で "Escalate" 選択
   - エスカレーション先選択
   - 理由記入
```

### 7.3 Slack 通知チャンネル

| チャンネル | 用途 |
|-----------|------|
| #soc-alerts-critical | P0アラート自動通知 |
| #soc-alerts-high | P1アラート自動通知 |
| #soc-alerts-general | P2/P3アラート |
| #incident-response | インシデント対応コミュニケーション |
| #soc-oncall | オンコール連絡 |

---

## 8. 訓練・演習

### 8.1 定期訓練計画

| 訓練種別 | 頻度 | 内容 | 参加者 |
|---------|------|------|--------|
| テーブルトップ演習 | 月次 | シナリオベース討議 | SOC, CSIRT |
| 実機演習 | 四半期 | SIEM操作、対応手順確認 | SOC |
| レッドチーム演習 | 年次 | 模擬攻撃への対応 | 全セキュリティチーム |

### 8.2 演習シナリオ例

**シナリオ1: ブルートフォース攻撃対応**
```
状況設定:
- 09:00 SEC-001アラート発生
- 同一IPから100回以上のログイン失敗
- 対象: 複数の管理者アカウント

演習目標:
- 10分以内にアラート確認・初期対応
- 適切なエスカレーション判断
- IP ブロック実施
```

**シナリオ2: データ漏洩検知対応**
```
状況設定:
- 14:30 SEC-011アラート発生
- 退職予定者による大量データエクスポート
- 顧客個人情報を含むデータ

演習目標:
- 即時対応（セッション無効化、アカウントロック）
- CSIRT/CISO エスカレーション
- 証拠保全実施
```

---

## 9. 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2025-12-11 | 初版作成 | SOC Analyst |

---

## 10. 承認

| 役割 | 氏名 | 日付 | 署名 |
|------|------|------|------|
| 作成者 | SOC Analyst | 2025-12-11 | |
| レビュー | CSIRT Team Leader | | |
| レビュー | CTI Analyst | | |
| レビュー | Network Engineer | | |
| 承認 | CISO | | |
