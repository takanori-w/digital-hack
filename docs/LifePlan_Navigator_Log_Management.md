# LifePlan Navigator ログ管理設計書

| 項目 | 内容 |
|------|------|
| ドキュメント名 | ログ管理設計書 |
| バージョン | 1.0 |
| 作成日 | 2025-12-11 |
| 作成者 | SOC Analyst |
| レビュー | CSIRT Team Leader, CTI Analyst, Network Engineer |
| 分類 | Confidential |

---

## 1. 概要

### 1.1 目的
本ドキュメントは、LifePlan Navigator におけるログ収集・保管・分析の方針を定義する。セキュリティインシデントの検知・調査・フォレンジックを可能にし、コンプライアンス要件を満たすログ管理体制を構築する。

### 1.2 適用範囲
- 全アプリケーションログ
- インフラストラクチャログ
- セキュリティ機器ログ
- ネットワークログ
- 監査ログ

### 1.3 準拠規格
- GDPR Article 30 (記録保持義務)
- 個人情報保護法
- ISO 27001:2022 (A.12.4 ログ取得)
- PCI DSS v4.0 (Requirement 10)
- NIST SP 800-92 (ログ管理ガイド)

---

## 2. 収集対象ログ一覧

### 2.1 アプリケーションログ

| ログ種別 | ソース | 内容 | フォーマット | 収集方式 |
|---------|--------|------|-------------|----------|
| **アクセスログ** | Web Server (Nginx) | HTTP リクエスト/レスポンス | JSON | Fluent Bit |
| **APIログ** | API Gateway (Kong) | API呼び出し、認証情報 | JSON | Fluent Bit |
| **認証ログ** | Keycloak | ログイン/ログアウト、認証失敗 | JSON | Fluent Bit |
| **アプリケーションログ** | Backend Services | ビジネスロジック実行、エラー | JSON (構造化) | Fluent Bit |
| **監査ログ** | Application | データアクセス、変更操作 | JSON | Fluent Bit |
| **バッチログ** | Batch Services | バッチ処理実行結果 | JSON | Fluent Bit |

### 2.2 データベースログ

| ログ種別 | ソース | 内容 | フォーマット | 収集方式 |
|---------|--------|------|-------------|----------|
| **クエリログ** | PostgreSQL | 実行SQL、実行時間 | Text/CSV | Fluent Bit |
| **スロークエリログ** | PostgreSQL | 閾値超過クエリ | Text/CSV | Fluent Bit |
| **接続ログ** | PostgreSQL | 接続/切断、認証 | Text | Fluent Bit |
| **エラーログ** | PostgreSQL | エラー、警告 | Text | Fluent Bit |
| **監査ログ** | pgAudit | DDL/DML操作、特権操作 | JSON | Fluent Bit |
| **Redisログ** | Redis | 接続、コマンド、エラー | Text | Fluent Bit |

### 2.3 インフラストラクチャログ

| ログ種別 | ソース | 内容 | フォーマット | 収集方式 |
|---------|--------|------|-------------|----------|
| **システムログ** | syslog | OS イベント | Syslog | Fluent Bit |
| **コンテナログ** | Docker/Containerd | コンテナ stdout/stderr | JSON | Fluent Bit |
| **Kubernetesログ** | kubelet, API Server | Podイベント、API呼び出し | JSON | Fluent Bit |
| **Kubernetesイベント** | Kubernetes Events | リソース変更イベント | JSON | Fluent Bit |
| **CloudTrail** | AWS CloudTrail | AWS API呼び出し | JSON | S3 → SIEM |
| **CloudWatch Logs** | AWS Services | AWSサービスログ | JSON | Subscription |

### 2.4 ネットワーク・セキュリティログ

| ログ種別 | ソース | 内容 | フォーマット | 収集方式 |
|---------|--------|------|-------------|----------|
| **VPCフローログ** | AWS VPC | ネットワークフロー | JSON | S3 → SIEM |
| **ALBアクセスログ** | AWS ALB | ロードバランサーログ | JSON | S3 → SIEM |
| **WAFログ** | AWS WAF / Cloudflare | 攻撃検知、ブロック | JSON | S3 / API |
| **ファイアウォールログ** | Security Groups / NGFW | 許可/拒否ログ | Syslog/JSON | Fluent Bit |
| **IDS/IPSログ** | Suricata / Snort | 侵入検知アラート | JSON (EVE) | Fluent Bit |
| **DNSログ** | Route53 / CoreDNS | DNSクエリ | JSON | CloudWatch |

### 2.5 エンドポイント・セキュリティログ

| ログ種別 | ソース | 内容 | フォーマット | 収集方式 |
|---------|--------|------|-------------|----------|
| **EDRログ** | CrowdStrike / SentinelOne | エンドポイント脅威検知 | JSON | API |
| **アンチウイルスログ** | ClamAV | マルウェア検知 | Syslog | Fluent Bit |
| **脆弱性スキャンログ** | Trivy / Nessus | 脆弱性検出結果 | JSON | API / File |

---

## 3. ログフォーマット標準

### 3.1 共通ログフォーマット (JSON)

```json
{
  "timestamp": "2025-12-11T10:23:45.123Z",
  "level": "INFO",
  "service": "api-gateway",
  "environment": "production",
  "hostname": "api-gw-pod-abc123",
  "trace_id": "abc123def456",
  "span_id": "span789",
  "message": "Request processed successfully",
  "context": {
    "user_id": "usr_12345",
    "session_id": "sess_67890",
    "client_ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "request_id": "req_abcdef"
  },
  "request": {
    "method": "POST",
    "path": "/api/v1/lifeplan",
    "query": {},
    "headers": {
      "content-type": "application/json"
    }
  },
  "response": {
    "status_code": 200,
    "duration_ms": 145
  }
}
```

### 3.2 監査ログフォーマット

```json
{
  "timestamp": "2025-12-11T10:23:45.123Z",
  "event_type": "DATA_ACCESS",
  "event_subtype": "READ",
  "actor": {
    "user_id": "usr_12345",
    "username": "john.doe@example.com",
    "role": "user",
    "session_id": "sess_67890",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
  },
  "target": {
    "resource_type": "lifeplan",
    "resource_id": "lp_abc123",
    "owner_id": "usr_12345"
  },
  "action": {
    "name": "view_lifeplan",
    "result": "success",
    "details": {}
  },
  "context": {
    "service": "backend-api",
    "trace_id": "trace_xyz",
    "request_id": "req_abcdef"
  }
}
```

### 3.3 セキュリティイベントログフォーマット

```json
{
  "timestamp": "2025-12-11T10:23:45.123Z",
  "event_type": "SECURITY_EVENT",
  "severity": "HIGH",
  "category": "authentication",
  "subcategory": "brute_force_attempt",
  "source": {
    "ip": "203.0.113.50",
    "port": 54321,
    "geo": {
      "country": "XX",
      "city": "Unknown"
    }
  },
  "target": {
    "service": "auth-service",
    "endpoint": "/auth/login",
    "user_id": "usr_12345"
  },
  "event": {
    "description": "Multiple failed login attempts detected",
    "count": 5,
    "time_window_seconds": 60,
    "mitre_attack": {
      "tactic": "Credential Access",
      "technique": "T1110.001",
      "technique_name": "Brute Force: Password Guessing"
    }
  },
  "action_taken": "account_locked",
  "detection_rule": "SEC-001"
}
```

---

## 4. ログ保管期間設定

### 4.1 保管期間マトリクス

| ログカテゴリ | ログ種別 | Hot Storage | Warm Storage | Cold Storage | 合計保管期間 | 根拠 |
|-------------|---------|-------------|--------------|--------------|-------------|------|
| **セキュリティ** | 認証ログ | 90日 | 275日 | 2年 | 3年 | GDPR, 個人情報保護法 |
| | 監査ログ | 90日 | 275日 | 6年 | 7年 | 金融規制, 税法 |
| | WAF/IDS/IPSログ | 90日 | 275日 | 2年 | 3年 | フォレンジック要件 |
| | VPCフローログ | 30日 | 60日 | 275日 | 1年 | セキュリティ調査 |
| **アプリケーション** | アクセスログ | 30日 | 60日 | 275日 | 1年 | 運用・調査 |
| | APIログ | 30日 | 60日 | 275日 | 1年 | 運用・調査 |
| | アプリログ | 30日 | 60日 | 275日 | 1年 | 障害調査 |
| | エラーログ | 90日 | 275日 | 1年 | 2年 | 障害分析 |
| **データベース** | クエリログ | 7日 | 23日 | - | 30日 | パフォーマンス分析 |
| | スロークエリログ | 30日 | 60日 | 275日 | 1年 | パフォーマンス最適化 |
| | 監査ログ | 90日 | 275日 | 6年 | 7年 | コンプライアンス |
| **インフラ** | システムログ | 30日 | 60日 | 275日 | 1年 | 障害調査 |
| | コンテナログ | 14日 | 16日 | - | 30日 | デバッグ |
| | CloudTrail | 90日 | 275日 | 6年 | 7年 | AWS監査 |

### 4.2 ストレージ階層定義

| 階層 | ストレージ | 特性 | 用途 |
|------|-----------|------|------|
| **Hot Storage** | Elasticsearch (SSD) | 高速検索、リアルタイム分析 | アクティブ監視・調査 |
| **Warm Storage** | Elasticsearch (HDD) | 検索可能、コスト最適化 | 過去ログ調査 |
| **Cold Storage** | S3 Glacier / Azure Blob Archive | 長期保管、低コスト | コンプライアンス保管 |

### 4.3 ライフサイクル管理ポリシー

```yaml
# S3 Lifecycle Policy Example
lifecycle_rules:
  - id: security-logs-lifecycle
    prefix: security-logs/
    transitions:
      - days: 90
        storage_class: STANDARD_IA
      - days: 365
        storage_class: GLACIER
    expiration:
      days: 2555  # 7 years

  - id: application-logs-lifecycle
    prefix: application-logs/
    transitions:
      - days: 30
        storage_class: STANDARD_IA
      - days: 90
        storage_class: GLACIER
    expiration:
      days: 365  # 1 year
```

---

## 5. SIEM連携設計

### 5.1 SIEM アーキテクチャ

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       SIEM連携アーキテクチャ                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    データソース層                                   │  │
│  │                                                                    │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │  │
│  │  │  Apps   │ │   DB    │ │ Infra   │ │ Network │ │Security │     │  │
│  │  │  Logs   │ │  Logs   │ │  Logs   │ │  Logs   │ │  Logs   │     │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘     │  │
│  └───────┼───────────┼───────────┼───────────┼───────────┼──────────┘  │
│          │           │           │           │           │              │
│          ▼           ▼           ▼           ▼           ▼              │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    収集・正規化層                                   │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Fluent Bit / Fluentd                      │  │  │
│  │  │  - ログ収集                                                  │  │  │
│  │  │  - パース・正規化                                            │  │  │
│  │  │  - フィルタリング                                            │  │  │
│  │  │  - エンリッチメント (GeoIP, ユーザー情報)                     │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                              │                                           │
│          ┌───────────────────┼───────────────────┐                       │
│          ▼                   ▼                   ▼                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │    Kafka     │    │     S3       │    │  CloudWatch  │               │
│  │   (Stream)   │    │  (Archive)   │    │   (AWS)      │               │
│  └───────┬──────┘    └──────────────┘    └──────┬───────┘               │
│          │                                       │                       │
│          └───────────────────┬───────────────────┘                       │
│                              ▼                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                      SIEM (Splunk ES)                               │  │
│  │                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │  Indexing    │  │  Correlation │  │  Detection   │              │  │
│  │  │  & Storage   │  │  & Analysis  │  │  & Alerting  │              │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │  │
│  │                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │  Dashboard   │  │   Reports    │  │  Case Mgmt   │              │  │
│  │  │  & Search    │  │  & Audit     │  │  (Notable)   │              │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                              │                                           │
│          ┌───────────────────┼───────────────────┐                       │
│          ▼                   ▼                   ▼                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │  PagerDuty   │    │    Slack     │    │    SOAR      │               │
│  │  (On-Call)   │    │   (通知)     │    │ (自動対応)   │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 データモデル (Splunk CIM準拠)

| CIM データモデル | 対象ログ | 主要フィールド |
|-----------------|---------|---------------|
| **Authentication** | 認証ログ | user, src, dest, action, result |
| **Web** | アクセスログ, APIログ | src, dest, uri_path, status, bytes |
| **Network Traffic** | VPCフローログ, FWログ | src_ip, dest_ip, src_port, dest_port, action |
| **Endpoint** | システムログ, EDRログ | dest, process, user, signature |
| **Intrusion Detection** | IDS/IPSログ, WAFログ | src, dest, signature, category |
| **Change** | 監査ログ, CloudTrail | user, object, action, result |
| **Malware** | AV/EDRログ | file_name, file_hash, signature |

### 5.3 インデックス設計

| インデックス名 | 保管対象 | 保管期間 | サイズ見積 |
|---------------|---------|----------|-----------|
| `lifeplan_app` | アプリケーションログ | 90日 | 100GB/日 |
| `lifeplan_security` | セキュリティログ | 365日 | 50GB/日 |
| `lifeplan_audit` | 監査ログ | 2555日 | 10GB/日 |
| `lifeplan_network` | ネットワークログ | 90日 | 200GB/日 |
| `lifeplan_infra` | インフラログ | 30日 | 50GB/日 |

### 5.4 SIEM連携フロー

```
[収集] → [パース] → [正規化] → [エンリッチ] → [転送] → [インデックス]
   │         │          │          │          │          │
   │         │          │          │          │          ↓
   │         │          │          │          │    [相関分析]
   │         │          │          │          │          │
   │         │          │          │          │          ↓
   │         │          │          │          │    [検知ルール]
   │         │          │          │          │          │
   │         │          │          │          │          ↓
   │         │          │          │          │    [アラート]
   ↓         ↓          ↓          ↓          ↓          ↓
Fluent    Grok     Common    GeoIP/    Kafka/   Splunk ES
  Bit    Parser    Schema    Lookup     HEC
```

---

## 6. ログ収集設定

### 6.1 Fluent Bit 設定例

```ini
# /etc/fluent-bit/fluent-bit.conf

[SERVICE]
    Flush         1
    Log_Level     info
    Daemon        Off
    Parsers_File  parsers.conf

# Application Logs
[INPUT]
    Name              tail
    Path              /var/log/app/*.log
    Tag               app.*
    Parser            json
    Refresh_Interval  5
    Mem_Buf_Limit     50MB
    Skip_Long_Lines   On

# Nginx Access Logs
[INPUT]
    Name              tail
    Path              /var/log/nginx/access.log
    Tag               nginx.access
    Parser            nginx_json
    Refresh_Interval  5

# Kubernetes Logs
[INPUT]
    Name              tail
    Path              /var/log/containers/*.log
    Tag               kube.*
    Parser            docker
    DB                /var/log/flb_kube.db
    Mem_Buf_Limit     50MB

# Add timestamp and hostname
[FILTER]
    Name              record_modifier
    Match             *
    Record hostname   ${HOSTNAME}
    Record environment production

# Add GeoIP enrichment
[FILTER]
    Name              geoip2
    Match             *
    Database          /etc/fluent-bit/GeoLite2-City.mmdb
    Lookup_key        client_ip
    Record country    %{country.names.en}
    Record city       %{city.names.en}

# Output to Kafka
[OUTPUT]
    Name              kafka
    Match             *
    Brokers           kafka-1:9092,kafka-2:9092,kafka-3:9092
    Topics            logs-${TAG}
    Timestamp_Key     @timestamp
    rdkafka.compression.codec  snappy

# Output to Splunk HEC
[OUTPUT]
    Name              splunk
    Match             security.*
    Host              splunk-hec.internal
    Port              8088
    TLS               On
    TLS.Verify        On
    Splunk_Token      ${SPLUNK_HEC_TOKEN}
    Splunk_Send_Raw   Off
```

### 6.2 Splunk HEC 設定

```json
{
  "inputs": {
    "http_event_collector": {
      "enabled": true,
      "port": 8088,
      "useDeploymentServer": true,
      "tokens": {
        "lifeplan-security": {
          "disabled": false,
          "name": "lifeplan-security",
          "indexes": ["lifeplan_security", "lifeplan_audit"],
          "sourcetype": "httpevent"
        },
        "lifeplan-app": {
          "disabled": false,
          "name": "lifeplan-app",
          "indexes": ["lifeplan_app", "lifeplan_infra"],
          "sourcetype": "httpevent"
        }
      }
    }
  }
}
```

---

## 7. ログ保護・完全性

### 7.1 ログ保護要件

| 要件 | 実装 | 説明 |
|------|------|------|
| **機密性** | TLS暗号化 (転送中)、KMS暗号化 (保存時) | ログデータの暗号化 |
| **完全性** | イミュータブルストレージ、ハッシュ検証 | 改ざん防止・検知 |
| **可用性** | マルチAZ、レプリケーション | 冗長化による可用性確保 |
| **アクセス制御** | RBAC、監査ログ | 権限管理とアクセス追跡 |

### 7.2 ログ完全性検証

```yaml
# Log Integrity Check Configuration
integrity_check:
  enabled: true
  algorithm: SHA-256

  # Hourly hash chain
  hash_chain:
    interval: 1h
    storage: s3://lifeplan-logs-integrity/

  # Daily verification
  verification:
    schedule: "0 2 * * *"  # 2:00 AM daily
    alert_on_failure: true

  # Tamper detection
  immutable_storage:
    enabled: true
    bucket: lifeplan-logs-archive
    object_lock:
      mode: COMPLIANCE
      retention_days: 2555  # 7 years
```

### 7.3 アクセス制御マトリクス

| ロール | Hot Storage | Warm Storage | Cold Storage | 監査ログ |
|--------|-------------|--------------|--------------|---------|
| SOC Analyst | Read | Read | - | Read |
| CSIRT Engineer | Read/Search | Read/Search | Read (承認後) | Read |
| CSIRT Team Leader | Full | Full | Read | Full |
| CISO | Full | Full | Full | Full |
| Auditor | Read | Read | Read | Full |
| System Admin | - | - | - | - |

---

## 8. ログ監査

### 8.1 ログ監査項目

| 監査項目 | 頻度 | 担当 |
|---------|------|------|
| ログ収集状況確認 | 日次 | SOC Analyst |
| ログ保管容量確認 | 週次 | SOC Analyst |
| ログ完全性検証 | 日次 (自動) | システム |
| ログ保管期間遵守確認 | 月次 | Auditor |
| ログアクセス監査 | 月次 | Auditor |
| SIEM検知精度レビュー | 週次 | CTI Analyst |

### 8.2 監査レポート

```
【ログ管理月次監査レポート】

■ 監査期間: 2025-11-01 ~ 2025-11-30

■ ログ収集状況
- 総ログ件数: 1,234,567,890件
- 欠損率: 0.001%
- 収集遅延 (99%ile): 2.3秒

■ ストレージ使用状況
- Hot Storage: 2.8TB / 5TB (56%)
- Warm Storage: 8.2TB / 20TB (41%)
- Cold Storage: 45TB / 100TB (45%)

■ 保管期間遵守
- 期限切れログ削除: 完了
- 異常なし

■ 完全性検証
- ハッシュ検証: 全件合格
- 改ざん検知: 0件

■ アクセス監査
- 総アクセス件数: 5,678件
- 異常アクセス: 0件
- 権限逸脱: 0件

■ 所見・推奨事項
- なし
```

---

## 9. 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| LifePlan_Navigator_SOC_Monitoring_Design.md | SOC監視設計書 |
| LifePlan_Navigator_Detection_Rules.md | 検知ルール一覧 |
| LifePlan_Navigator_Alert_Rules.md | アラートルール一覧 |
| LifePlan_Navigator_SOC_Runbook.md | SOC運用手順書 |

---

## 10. 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2025-12-11 | 初版作成 | SOC Analyst |

---

## 11. 承認

| 役割 | 氏名 | 日付 | 署名 |
|------|------|------|------|
| 作成者 | SOC Analyst | 2025-12-11 | |
| レビュー | CSIRT Team Leader | | |
| レビュー | CTI Analyst | | |
| レビュー | Network Engineer | | |
| 承認 | CISO | | |
