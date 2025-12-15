# LifePlan Navigator アラートルール一覧

| 項目 | 内容 |
|------|------|
| ドキュメント名 | アラートルール一覧 |
| バージョン | 1.0 |
| 作成日 | 2025-12-11 |
| 作成者 | SOC Analyst |
| レビュー | CSIRT Team Leader, CTI Analyst, Network Engineer |
| 分類 | Confidential |

---

## 1. 概要

### 1.1 目的
本ドキュメントは、LifePlan Navigator における全アラートルールを定義する。各アラートに対する通知先、対応時間、エスカレーションパスを明確化し、迅速かつ適切なインシデント対応を実現する。

### 1.2 アラート重要度定義

| 重要度 | 説明 | 対応時間 | 通知方法 |
|--------|------|----------|----------|
| **Critical (P0)** | サービス停止、データ漏洩の可能性、重大なセキュリティ侵害 | 即時 | PagerDuty + Slack + 電話 |
| **High (P1)** | サービス劣化、セキュリティ侵害の兆候、重要機能の障害 | 15分以内 | PagerDuty + Slack |
| **Medium (P2)** | パフォーマンス低下、要注意事象、軽微な異常 | 4時間以内 | Slack |
| **Low (P3)** | 軽微な異常、情報提供、予防的警告 | 24時間以内 | Slack (低優先度チャンネル) |
| **Info** | 参考情報、統計データ | 定期レビュー | メール (日次ダイジェスト) |

---

## 2. セキュリティアラート

### 2.1 認証・アクセス制御アラート

| ID | アラート名 | 重要度 | 検知ルール | 閾値 | 通知先 |
|----|-----------|--------|-----------|------|--------|
| SEC-001 | ブルートフォース攻撃（同一IP） | High | DET-AUTH-001 | 5回失敗/5分 | SOC, CSIRT |
| SEC-002 | ブルートフォース攻撃（同一アカウント） | Medium | DET-AUTH-002 | 3回失敗/5分 | SOC |
| SEC-003 | パスワードスプレー攻撃 | High | DET-AUTH-003 | 10アカウント/10分 | SOC, CSIRT |
| SEC-004 | 異常時間帯ログイン | Medium | DET-AUTH-004 | 深夜2-5時 | SOC |
| SEC-005 | 異常地域ログイン | High | DET-AUTH-005 | 未知の国/地域 | SOC, CSIRT |
| SEC-006 | 不可能な移動検知 | Critical | DET-AUTH-006 | >1000km/h | SOC, CSIRT, CISO |
| SEC-007 | 同時セッション異常 | High | DET-AUTH-007 | 2+ 異なるIP | SOC |
| SEC-008 | セッションハイジャック | Critical | DET-AUTH-008 | UA/IP急変 | SOC, CSIRT, CISO |
| SEC-009 | アカウントロック多発 | High | - | >10件/時 | SOC, CSIRT |
| SEC-010 | 管理者アカウント不正使用 | Critical | - | 未承認操作 | CSIRT, CISO |

### 2.2 データ保護アラート

| ID | アラート名 | 重要度 | 検知ルール | 閾値 | 通知先 |
|----|-----------|--------|-----------|------|--------|
| SEC-011 | 大量データエクスポート | Critical | DET-DATA-001 | >1000件/時 | SOC, CSIRT, CISO |
| SEC-012 | 異常データアクセスパターン | High | DET-DATA-002 | 通常の3倍 | SOC, CSIRT |
| SEC-013 | 不正データアクセス | Critical | DET-DATA-003 | 他ユーザーデータ | SOC, CSIRT, CISO |
| SEC-014 | 大量データ削除 | Critical | DET-DATA-004 | >100件/時 | SOC, CSIRT, CISO |
| SEC-015 | 重要設定変更 | High | DET-DATA-005 | セキュリティ設定 | SOC, CSIRT |
| SEC-016 | 個人情報大量閲覧 | High | - | >500件/時 | SOC, CSIRT |
| SEC-017 | 機密ファイルアクセス | High | - | 機密フラグ付き | SOC, CSIRT |

### 2.3 ネットワークセキュリティアラート

| ID | アラート名 | 重要度 | 検知ルール | 閾値 | 通知先 |
|----|-----------|--------|-----------|------|--------|
| SEC-018 | SQLインジェクション攻撃 | Critical | DET-WEB-001 | 検知時 | SOC, CSIRT, Network |
| SEC-019 | XSS攻撃 | High | DET-WEB-002 | 検知時 | SOC, Network |
| SEC-020 | パストラバーサル攻撃 | High | DET-WEB-003 | 検知時 | SOC, Network |
| SEC-021 | コマンドインジェクション | Critical | DET-WEB-004 | 検知時 | SOC, CSIRT, Network |
| SEC-022 | DDoS攻撃 | Critical | DET-NET-001 | ベースライン5倍 | SOC, CSIRT, Network |
| SEC-023 | アプリケーションDDoS | High | DET-NET-002 | >1000req/min | SOC, Network |
| SEC-024 | ポートスキャン検知 | Medium | DET-RECON-001 | >10ポート/5分 | SOC |
| SEC-025 | Webスキャン検知 | Medium | DET-RECON-002 | スキャナUA | SOC |

### 2.4 マルウェア・脅威アラート

| ID | アラート名 | 重要度 | 検知ルール | 閾値 | 通知先 |
|----|-----------|--------|-----------|------|--------|
| SEC-026 | C2通信検知 | Critical | DET-MAL-001 | 既知C2 | SOC, CSIRT, CISO |
| SEC-027 | DGAドメイン検知 | High | DET-MAL-002 | 高エントロピー | SOC, CSIRT |
| SEC-028 | マルウェア検知 | Critical | - | AV/EDR検知 | SOC, CSIRT |
| SEC-029 | 不審なプロセス実行 | High | - | EDR検知 | SOC, CSIRT |
| SEC-030 | 権限昇格試行 | Critical | DET-INSIDER-001 | 未承認変更 | SOC, CSIRT, CISO |

### 2.5 クラウドセキュリティアラート

| ID | アラート名 | 重要度 | 検知ルール | 閾値 | 通知先 |
|----|-----------|--------|-----------|------|--------|
| SEC-031 | IAMポリシー不正変更 | Critical | DET-AWS-001 | 未承認変更 | SOC, CSIRT, CISO |
| SEC-032 | セキュリティグループ開放 | High | DET-AWS-002 | 0.0.0.0/0 | SOC, Network |
| SEC-033 | S3バケット公開 | Critical | - | パブリック設定 | SOC, CSIRT, CISO |
| SEC-034 | CloudTrail無効化 | Critical | - | 監査停止 | SOC, CSIRT, CISO |
| SEC-035 | 不正なAPIキー使用 | High | - | 異常パターン | SOC, CSIRT |

---

## 3. インフラストラクチャアラート

### 3.1 コンピュートリソースアラート

| ID | アラート名 | 重要度 | 閾値 | 持続時間 | 通知先 |
|----|-----------|--------|------|----------|--------|
| INFRA-001 | CPU使用率Critical | High | >90% | 5分 | SRE, SOC |
| INFRA-002 | CPU使用率Warning | Medium | >80% | 15分 | SRE |
| INFRA-003 | メモリ使用率Critical | High | >90% | 5分 | SRE, SOC |
| INFRA-004 | メモリ使用率Warning | Medium | >85% | 15分 | SRE |
| INFRA-005 | ディスク使用率Critical | Critical | >90% | 即時 | SRE, SOC |
| INFRA-006 | ディスク使用率Warning | High | >80% | 即時 | SRE |
| INFRA-007 | ディスクI/O高負荷 | Medium | >80% | 10分 | SRE |

### 3.2 Kubernetes アラート

| ID | アラート名 | 重要度 | 閾値 | 持続時間 | 通知先 |
|----|-----------|--------|------|----------|--------|
| K8S-001 | Pod再起動多発 | High | >3回/時 | 即時 | SRE, Dev |
| K8S-002 | Podクラッシュループ | Critical | CrashLoopBackOff | 即時 | SRE, Dev |
| K8S-003 | ノード異常 | Critical | NotReady | 1分 | SRE |
| K8S-004 | デプロイメント失敗 | High | レプリカ不足 | 5分 | SRE, Dev |
| K8S-005 | HPA最大スケール | Medium | max replicas | 10分 | SRE |
| K8S-006 | PVC容量不足 | High | >85% | 即時 | SRE |
| K8S-007 | ResourceQuota超過 | High | 超過 | 即時 | SRE |

### 3.3 データベースアラート

| ID | アラート名 | 重要度 | 閾値 | 持続時間 | 通知先 |
|----|-----------|--------|------|----------|--------|
| DB-001 | 接続数Critical | Critical | >最大90% | 1分 | DBA, SRE |
| DB-002 | 接続待ち発生 | High | >10 | 5分 | DBA, SRE |
| DB-003 | スロークエリ多発 | High | >50件/分 | 5分 | DBA, Dev |
| DB-004 | レプリケーション遅延Critical | Critical | >30秒 | 1分 | DBA, SRE |
| DB-005 | レプリケーション遅延Warning | High | >5秒 | 5分 | DBA |
| DB-006 | デッドロック発生 | High | >0 | 即時 | DBA, Dev |
| DB-007 | ディスク容量Critical | Critical | >90% | 即時 | DBA, SRE |
| DB-008 | バックアップ失敗 | Critical | 失敗 | 即時 | DBA, SRE |

### 3.4 ネットワークインフラアラート

| ID | アラート名 | 重要度 | 閾値 | 持続時間 | 通知先 |
|----|-----------|--------|------|----------|--------|
| NET-001 | ALBヘルスチェック失敗 | High | unhealthy | 即時 | SRE, Network |
| NET-002 | SSL証明書期限切れ間近 | Critical | <7日 | 即時 | SRE, Security |
| NET-003 | SSL証明書期限Warning | Medium | <30日 | 即時 | SRE |
| NET-004 | NATゲートウェイ帯域制限 | High | >80% | 5分 | Network, SRE |
| NET-005 | VPN接続断 | High | Down | 即時 | Network |
| NET-006 | DNS解決失敗率上昇 | High | >1% | 5分 | Network, SRE |

---

## 4. アプリケーションアラート

### 4.1 可用性アラート

| ID | アラート名 | 重要度 | 閾値 | 持続時間 | 通知先 |
|----|-----------|--------|------|----------|--------|
| APP-001 | サービス停止 | Critical | 可用性<99.9% | 5分 | SRE, Dev, CSIRT |
| APP-002 | エラー率Critical | High | >5% | 5分 | SRE, Dev |
| APP-003 | エラー率Warning | Medium | >1% | 10分 | SRE, Dev |
| APP-004 | ヘルスチェック失敗 | High | 失敗 | 即時 | SRE |
| APP-005 | 外部サービス連携障害 | High | タイムアウト | 即時 | SRE, Dev |

### 4.2 パフォーマンスアラート

| ID | アラート名 | 重要度 | 閾値 | 持続時間 | 通知先 |
|----|-----------|--------|------|----------|--------|
| APP-006 | レスポンスタイムCritical | High | P95 > 3秒 | 5分 | SRE, Dev |
| APP-007 | レスポンスタイムWarning | Medium | P95 > 1秒 | 10分 | SRE, Dev |
| APP-008 | リクエスト急増 | High | 2倍以上 | 1分 | SRE |
| APP-009 | キュー滞留 | High | >1000件 | 5分 | SRE, Dev |
| APP-010 | バッチ処理遅延 | Medium | >30分 | 即時 | SRE, Dev |

### 4.3 ビジネスメトリクスアラート

| ID | アラート名 | 重要度 | 閾値 | 持続時間 | 通知先 |
|----|-----------|--------|------|----------|--------|
| BIZ-001 | 新規登録急減 | Medium | 前日比50%減 | 1時間 | Product, Dev |
| BIZ-002 | 決済処理失敗率上昇 | High | >1% | 15分 | SRE, Dev, Finance |
| BIZ-003 | ログイン成功率低下 | High | <95% | 15分 | SRE, Dev |
| BIZ-004 | API利用率異常 | Medium | 通常の3倍 | 30分 | SRE, Dev |

---

## 5. 通知設定

### 5.1 通知チャンネル設定

| チャンネル | 用途 | 対象アラート |
|-----------|------|-------------|
| #soc-alerts-critical | Critical緊急アラート | P0 |
| #soc-alerts-high | High優先アラート | P1 |
| #soc-alerts-general | Medium/Low アラート | P2, P3 |
| #infra-alerts | インフラアラート | INFRA-*, K8S-*, DB-*, NET-* |
| #app-alerts | アプリケーションアラート | APP-*, BIZ-* |
| #security-alerts | セキュリティアラート | SEC-* |

### 5.2 PagerDuty エスカレーションポリシー

```yaml
# Critical (P0) Escalation Policy
escalation_policy:
  name: "Critical Security Incident"
  escalation_rules:
    - targets:
        - type: schedule
          id: soc-oncall-primary
      escalation_timeout_in_minutes: 5
    - targets:
        - type: schedule
          id: csirt-lead-oncall
      escalation_timeout_in_minutes: 10
    - targets:
        - type: user
          id: ciso
      escalation_timeout_in_minutes: 15
    - targets:
        - type: user
          id: ceo
      escalation_timeout_in_minutes: 30
  repeat_enabled: true
  num_loops: 3
```

### 5.3 通知テンプレート

#### Critical アラート通知テンプレート
```
🚨 *CRITICAL ALERT* 🚨

*Alert ID:* {{alert_id}}
*Alert Name:* {{alert_name}}
*Severity:* {{severity}}
*Time:* {{timestamp}}

*Summary:*
{{summary}}

*Details:*
• Source: {{source}}
• Target: {{target}}
• Value: {{current_value}} (Threshold: {{threshold}})

*Impact:*
{{impact_description}}

*Immediate Actions Required:*
1. Acknowledge this alert
2. Follow runbook: {{runbook_url}}
3. Update incident status every 15 minutes

*Escalation:*
If not acknowledged within 5 minutes, escalating to {{next_escalation}}

*Links:*
• Dashboard: {{dashboard_url}}
• Logs: {{log_url}}
• Runbook: {{runbook_url}}
```

---

## 6. アラート抑制ルール

### 6.1 メンテナンス時抑制

| 抑制ルール | 条件 | 対象アラート |
|-----------|------|-------------|
| 計画メンテナンス | メンテナンスウィンドウ中 | INFRA-*, K8S-*, APP-* |
| デプロイメント中 | デプロイパイプライン実行中 | APP-002, APP-003 |
| 負荷テスト中 | 負荷テストフラグ有効 | APP-006, APP-007, APP-008 |

### 6.2 アラート集約ルール

| 集約ルール | 条件 | 動作 |
|-----------|------|------|
| 同一アラート重複 | 5分以内の同一アラート | 1件に集約、カウント表示 |
| 関連アラートグループ | 同一インシデント起因 | 親アラートにグループ化 |
| フラッピング防止 | 短時間の状態変動 | 5分間安定後に通知 |

### 6.3 抑制設定例

```yaml
# Splunk Alert Suppression
alert_suppression:
  - name: "Maintenance Window Suppression"
    condition: |
      lookup maintenance_windows start, end
      | where now() >= start AND now() <= end
    suppress_alerts:
      - "INFRA-*"
      - "K8S-*"
      - "APP-*"

  - name: "Duplicate Suppression"
    window: 5m
    fields:
      - alert_id
      - src_ip
      - user
    action: aggregate_and_count

  - name: "Flapping Prevention"
    stabilization_period: 5m
    min_consecutive_states: 3
```

---

## 7. アラート対応マトリクス

### 7.1 対応時間SLA

| 重要度 | 初動対応 | 状況確認 | 解決目標 |
|--------|----------|----------|----------|
| Critical (P0) | 5分以内 | 15分以内 | 4時間以内 |
| High (P1) | 15分以内 | 30分以内 | 8時間以内 |
| Medium (P2) | 4時間以内 | 8時間以内 | 24時間以内 |
| Low (P3) | 24時間以内 | 48時間以内 | 1週間以内 |

### 7.2 エスカレーションマトリクス

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       エスカレーションフロー                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [アラート発生]                                                             │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────┐    5分応答なし    ┌───────────────┐                       │
│  │ SOC Analyst │ ─────────────────→│ CSIRT Leader  │                       │
│  │  (Primary)  │                   │   (On-Call)   │                       │
│  └─────────────┘                   └───────┬───────┘                       │
│       │                                    │                               │
│       │ P0/P1                              │ 10分応答なし                  │
│       ▼                                    ▼                               │
│  ┌─────────────┐                   ┌───────────────┐                       │
│  │   CSIRT     │                   │     CISO      │                       │
│  │  Engineer   │                   │               │                       │
│  └─────────────┘                   └───────┬───────┘                       │
│                                            │                               │
│                                            │ P0 + 15分応答なし             │
│                                            ▼                               │
│                                    ┌───────────────┐                       │
│                                    │  Executive    │                       │
│                                    │ (CEO/CLO/CFO) │                       │
│                                    └───────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. アラートチューニング

### 8.1 誤検知管理

| 指標 | 目標値 | 測定頻度 |
|------|--------|----------|
| 誤検知率 (False Positive Rate) | <5% | 週次 |
| 検知漏れ率 (False Negative Rate) | <1% | 月次 |
| アラート対応時間 (MTTA) | <15分 (P0/P1) | 週次 |
| インシデント解決時間 (MTTR) | <4時間 (P0) | 月次 |

### 8.2 チューニングプロセス

```
┌─────────────────────────────────────────────────────────────────┐
│                 アラートチューニングサイクル                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [週次レビュー]                                                 │
│       │                                                         │
│       ├→ 誤検知分析 ───→ 閾値調整提案                          │
│       │                                                         │
│       ├→ 検知漏れ分析 ───→ 新規ルール提案                      │
│       │                                                         │
│       └→ 対応時間分析 ───→ エスカレーション調整                │
│                                                                 │
│  [月次レビュー]                                                 │
│       │                                                         │
│       ├→ アラート有効性評価                                     │
│       │                                                         │
│       ├→ ルール棚卸し（廃止/更新）                              │
│       │                                                         │
│       └→ 新規脅威対応ルール追加                                 │
│                                                                 │
│  [四半期レビュー]                                               │
│       │                                                         │
│       ├→ SLA達成率評価                                          │
│       │                                                         │
│       ├→ カバレッジ分析（MITRE ATT&CK）                         │
│       │                                                         │
│       └→ 年間計画への反映                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 チューニング申請フォーム

```yaml
Alert Tuning Request:
  alert_id: "SEC-001"
  alert_name: "Brute Force Attack - Same IP"

  current_settings:
    threshold: "5 failures in 5 minutes"
    severity: "High"

  proposed_changes:
    threshold: "10 failures in 5 minutes"
    reason: "High false positive rate due to corporate proxy IP"

  analysis:
    false_positive_count: 45
    true_positive_count: 3
    analysis_period: "2025-11-01 to 2025-11-30"
    false_positive_rate: "93.75%"

  impact_assessment:
    detection_impact: "May miss slow brute force attacks"
    mitigation: "Add detection rule for 10+ failures in 30 minutes"

  approval:
    requested_by: "SOC Analyst"
    reviewed_by: "CTI Analyst"
    approved_by: "CSIRT Team Leader"
```

---

## 9. ダッシュボード・レポート

### 9.1 アラートダッシュボード構成

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Alert Management Dashboard                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│ │ Active Alerts │ │ MTTA (P0/P1)  │ │  MTTR (P0)    │ │ False Pos Rate│    │
│ │     [24]      │ │    [8 min]    │ │   [2.5 hrs]   │ │    [3.2%]     │    │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │                    Alert Trend (Last 7 Days)                           │  │
│ │  100│                                                                  │  │
│ │     │    ╭───╮                              ╭──╮                       │  │
│ │   50│───╯   ╰───╮    ╭────────╮      ╭────╯  ╰───                     │  │
│ │     │           ╰────╯        ╰──────╯                                 │  │
│ │    0└────────────────────────────────────────────────────────►        │  │
│ │       Mon   Tue   Wed   Thu   Fri   Sat   Sun                         │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ Top Alerts by Count             │ │ Alerts by Severity                  ││
│ │                                 │ │                                     ││
│ │ SEC-001: ████████████ 45       │ │ Critical: ██ 5                      ││
│ │ SEC-002: ████████ 32           │ │ High:     ████████ 35               ││
│ │ INFRA-001: ██████ 24           │ │ Medium:   ████████████ 52           ││
│ │ APP-003: █████ 20              │ │ Low:      ██████ 28                 ││
│ └─────────────────────────────────┘ └─────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 定期レポート

| レポート名 | 頻度 | 内容 | 配布先 |
|-----------|------|------|--------|
| Daily Alert Summary | 日次 | アラート件数、対応状況 | SOC Team |
| Weekly Security Report | 週次 | セキュリティアラート分析 | CSIRT, CISO |
| Monthly Alert Analytics | 月次 | KPI分析、チューニング提案 | CISO, Management |
| Quarterly Security Review | 四半期 | 総合セキュリティ評価 | Executive |

---

## 10. 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| LifePlan_Navigator_SOC_Monitoring_Design.md | SOC監視設計書 |
| LifePlan_Navigator_Log_Management.md | ログ管理設計書 |
| LifePlan_Navigator_Detection_Rules.md | 検知ルール一覧 |
| LifePlan_Navigator_SOC_Runbook.md | SOC運用手順書 |

---

## 11. 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2025-12-11 | 初版作成 | SOC Analyst |

---

## 12. 承認

| 役割 | 氏名 | 日付 | 署名 |
|------|------|------|------|
| 作成者 | SOC Analyst | 2025-12-11 | |
| レビュー | CSIRT Team Leader | | |
| レビュー | CTI Analyst | | |
| レビュー | Network Engineer | | |
| 承認 | CISO | | |
