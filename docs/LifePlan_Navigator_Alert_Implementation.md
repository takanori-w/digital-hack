# LifePlan Navigator アラートルール実装設定書

| 項目 | 内容 |
|------|------|
| ドキュメント名 | アラートルール実装設定書 |
| バージョン | 1.0 |
| 作成日 | 2025-12-11 |
| 作成者 | SOC Analyst |
| レビュー | CSIRT Team Leader, Network Engineer |
| 分類 | Confidential |

---

## 1. 概要

### 1.1 目的
本ドキュメントは、LifePlan Navigator の監視アラートを Prometheus Alertmanager と Grafana で実装するための具体的な設定を提供する。

### 1.2 アラート実装方針

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      アラート実装アーキテクチャ                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │ Application │    │ Prometheus  │    │ Alertmanager│                     │
│  │   Metrics   │───→│   Server    │───→│             │                     │
│  └─────────────┘    └─────────────┘    └──────┬──────┘                     │
│                                               │                             │
│  ┌─────────────┐    ┌─────────────┐           │                             │
│  │ Application │    │   Grafana   │           │                             │
│  │    Logs     │───→│   Loki      │───→ ┌─────┴─────┐                       │
│  └─────────────┘    └─────────────┘     │  Routing  │                       │
│                                         └─────┬─────┘                       │
│                                               │                             │
│              ┌────────────────────────────────┼────────────────────┐        │
│              │                                │                    │        │
│              ▼                                ▼                    ▼        │
│       ┌────────────┐                 ┌────────────┐        ┌────────────┐   │
│       │ PagerDuty  │                 │   Slack    │        │   Email    │   │
│       │ (Critical) │                 │  (All)     │        │ (Digest)   │   │
│       └────────────┘                 └────────────┘        └────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prometheus アラートルール

### 2.1 セキュリティアラート

```yaml
# /etc/prometheus/rules/security_alerts.yml

groups:
  - name: security_authentication
    interval: 10s
    rules:
      # SEC-001: ブルートフォース攻撃（同一IP）
      - alert: BruteForceAttack_SameIP
        expr: |
          sum by (src_ip) (
            increase(auth_login_failures_total{application="lifeplan-navigator"}[5m])
          ) > 5
        for: 0m
        labels:
          severity: high
          category: authentication
          alert_id: SEC-001
          mitre_attack: T1110.001
        annotations:
          summary: "Brute Force Attack Detected - Same IP"
          description: |
            IP {{ $labels.src_ip }} has {{ $value }} failed login attempts in the last 5 minutes.
            Threshold: 5 failures
          runbook_url: "https://wiki.internal/runbook/sec-001"
          dashboard_url: "https://grafana.internal/d/auth-monitor"

      # SEC-002: ブルートフォース攻撃（同一アカウント）
      - alert: BruteForceAttack_SameAccount
        expr: |
          sum by (user) (
            increase(auth_login_failures_total{application="lifeplan-navigator"}[5m])
          ) > 3
        for: 0m
        labels:
          severity: medium
          category: authentication
          alert_id: SEC-002
          mitre_attack: T1110.001
        annotations:
          summary: "Brute Force Attack Detected - Same Account"
          description: |
            User {{ $labels.user }} has {{ $value }} failed login attempts in the last 5 minutes.
          runbook_url: "https://wiki.internal/runbook/sec-002"

      # SEC-003: パスワードスプレー攻撃
      - alert: PasswordSprayAttack
        expr: |
          count by (src_ip) (
            sum by (src_ip, user) (
              increase(auth_login_failures_total{application="lifeplan-navigator"}[10m])
            ) > 0
          ) > 10
        for: 0m
        labels:
          severity: high
          category: authentication
          alert_id: SEC-003
          mitre_attack: T1110.003
        annotations:
          summary: "Password Spray Attack Detected"
          description: |
            IP {{ $labels.src_ip }} attempted login to {{ $value }} different accounts in 10 minutes.
          runbook_url: "https://wiki.internal/runbook/sec-003"

      # SEC-009: アカウントロック多発
      - alert: AccountLockoutSpike
        expr: |
          sum(increase(auth_account_lockout_total{application="lifeplan-navigator"}[1h])) > 10
        for: 0m
        labels:
          severity: high
          category: authentication
          alert_id: SEC-009
        annotations:
          summary: "Account Lockout Spike Detected"
          description: |
            {{ $value }} accounts have been locked in the last hour.
            Normal baseline: < 5/hour
          runbook_url: "https://wiki.internal/runbook/sec-009"

  - name: security_session
    interval: 10s
    rules:
      # SEC-007: 同時セッション異常
      - alert: ConcurrentSessionAnomaly
        expr: |
          count by (user) (
            session_active{application="lifeplan-navigator"}
          ) > 2
        for: 1m
        labels:
          severity: high
          category: session
          alert_id: SEC-007
          mitre_attack: T1550
        annotations:
          summary: "Concurrent Session Anomaly"
          description: |
            User {{ $labels.user }} has {{ $value }} active sessions from different IPs.
          runbook_url: "https://wiki.internal/runbook/sec-007"

      # SEC-008: セッションハイジャック疑い
      - alert: SessionHijackingSuspected
        expr: |
          session_anomaly_score{application="lifeplan-navigator"} > 0.8
        for: 0m
        labels:
          severity: critical
          category: session
          alert_id: SEC-008
          mitre_attack: T1539
        annotations:
          summary: "Session Hijacking Suspected"
          description: |
            Session {{ $labels.session_id }} for user {{ $labels.user }} shows anomaly score {{ $value }}.
            IP or User-Agent changed during session.
          runbook_url: "https://wiki.internal/runbook/sec-008"

  - name: security_data
    interval: 30s
    rules:
      # SEC-011: 大量データエクスポート
      - alert: MassDataExport
        expr: |
          sum by (user) (
            increase(data_export_records_total{application="lifeplan-navigator"}[1h])
          ) > 1000
        for: 0m
        labels:
          severity: critical
          category: data_protection
          alert_id: SEC-011
          mitre_attack: T1567
        annotations:
          summary: "Mass Data Export Detected"
          description: |
            User {{ $labels.user }} exported {{ $value }} records in the last hour.
            Threshold: 1000 records
          runbook_url: "https://wiki.internal/runbook/sec-011"

      # SEC-012: 異常データアクセスパターン
      - alert: AnomalousDataAccess
        expr: |
          (
            sum by (user) (increase(data_access_total{application="lifeplan-navigator"}[1h]))
            /
            avg_over_time(sum by (user) (increase(data_access_total{application="lifeplan-navigator"}[1h]))[7d:1h])
          ) > 3
        for: 5m
        labels:
          severity: high
          category: data_protection
          alert_id: SEC-012
          mitre_attack: T1530
        annotations:
          summary: "Anomalous Data Access Pattern"
          description: |
            User {{ $labels.user }} data access is {{ $value }}x the 7-day average.
          runbook_url: "https://wiki.internal/runbook/sec-012"

      # SEC-014: 大量データ削除
      - alert: MassDataDeletion
        expr: |
          sum by (user) (
            increase(data_delete_total{application="lifeplan-navigator"}[1h])
          ) > 100
        for: 0m
        labels:
          severity: critical
          category: data_protection
          alert_id: SEC-014
          mitre_attack: T1485
        annotations:
          summary: "Mass Data Deletion Detected"
          description: |
            User {{ $labels.user }} deleted {{ $value }} records in the last hour.
          runbook_url: "https://wiki.internal/runbook/sec-014"
```

### 2.2 ネットワークセキュリティアラート

```yaml
# /etc/prometheus/rules/network_alerts.yml

groups:
  - name: network_security
    interval: 10s
    rules:
      # SEC-018: WAF SQLインジェクション検知
      - alert: SQLInjectionDetected
        expr: |
          increase(waf_attacks_blocked_total{application="lifeplan-navigator",attack_type="sql_injection"}[5m]) > 0
        for: 0m
        labels:
          severity: critical
          category: network
          alert_id: SEC-018
          mitre_attack: T1190
        annotations:
          summary: "SQL Injection Attack Detected"
          description: |
            {{ $value }} SQL injection attempts blocked from {{ $labels.src_ip }}.
            Target: {{ $labels.uri_path }}
          runbook_url: "https://wiki.internal/runbook/sec-018"

      # SEC-019: WAF XSS検知
      - alert: XSSAttackDetected
        expr: |
          increase(waf_attacks_blocked_total{application="lifeplan-navigator",attack_type="xss"}[5m]) > 0
        for: 0m
        labels:
          severity: high
          category: network
          alert_id: SEC-019
          mitre_attack: T1189
        annotations:
          summary: "XSS Attack Detected"
          description: |
            {{ $value }} XSS attempts blocked from {{ $labels.src_ip }}.
          runbook_url: "https://wiki.internal/runbook/sec-019"

      # SEC-021: コマンドインジェクション検知
      - alert: CommandInjectionDetected
        expr: |
          increase(waf_attacks_blocked_total{application="lifeplan-navigator",attack_type="command_injection"}[5m]) > 0
        for: 0m
        labels:
          severity: critical
          category: network
          alert_id: SEC-021
          mitre_attack: T1059
        annotations:
          summary: "Command Injection Attack Detected"
          description: |
            Command injection attempt blocked from {{ $labels.src_ip }}.
          runbook_url: "https://wiki.internal/runbook/sec-021"

      # SEC-022: DDoS攻撃検知
      - alert: DDoSAttackDetected
        expr: |
          (
            sum(rate(http_requests_total{application="lifeplan-navigator"}[1m]))
            /
            avg_over_time(sum(rate(http_requests_total{application="lifeplan-navigator"}[1m]))[24h:5m])
          ) > 5
        for: 30s
        labels:
          severity: critical
          category: network
          alert_id: SEC-022
          mitre_attack: T1498
        annotations:
          summary: "DDoS Attack Suspected"
          description: |
            Traffic is {{ $value }}x the 24-hour baseline.
            Current rate: {{ printf "%.0f" (sum(rate(http_requests_total{application="lifeplan-navigator"}[1m]))) }} req/s
          runbook_url: "https://wiki.internal/runbook/sec-022"

      # SEC-024: ポートスキャン検知
      - alert: PortScanDetected
        expr: |
          count by (src_ip) (
            increase(firewall_blocked_connections_total{application="lifeplan-navigator"}[5m])
          ) > 10
        for: 0m
        labels:
          severity: medium
          category: network
          alert_id: SEC-024
          mitre_attack: T1046
        annotations:
          summary: "Port Scan Detected"
          description: |
            IP {{ $labels.src_ip }} attempted connections to {{ $value }} different ports.
          runbook_url: "https://wiki.internal/runbook/sec-024"

  - name: network_malware
    interval: 30s
    rules:
      # SEC-026: C2通信検知
      - alert: C2CommunicationDetected
        expr: |
          threat_intel_ioc_match_total{application="lifeplan-navigator",ioc_type="c2"} > 0
        for: 0m
        labels:
          severity: critical
          category: malware
          alert_id: SEC-026
          mitre_attack: T1071
        annotations:
          summary: "C2 Communication Detected"
          description: |
            Communication to known C2 infrastructure detected.
            Source: {{ $labels.src_ip }}
            Destination: {{ $labels.dest_ip }}
          runbook_url: "https://wiki.internal/runbook/sec-026"
```

### 2.3 インフラストラクチャアラート

```yaml
# /etc/prometheus/rules/infrastructure_alerts.yml

groups:
  - name: infrastructure_compute
    interval: 30s
    rules:
      # INFRA-001: CPU使用率Critical
      - alert: CPUUtilizationCritical
        expr: |
          avg by (instance) (
            100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
          ) > 90
        for: 5m
        labels:
          severity: high
          category: infrastructure
          alert_id: INFRA-001
        annotations:
          summary: "CPU Utilization Critical"
          description: |
            Instance {{ $labels.instance }} CPU usage is {{ printf "%.1f" $value }}%.
          runbook_url: "https://wiki.internal/runbook/infra-001"

      # INFRA-003: メモリ使用率Critical
      - alert: MemoryUtilizationCritical
        expr: |
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90
        for: 5m
        labels:
          severity: high
          category: infrastructure
          alert_id: INFRA-003
        annotations:
          summary: "Memory Utilization Critical"
          description: |
            Instance {{ $labels.instance }} memory usage is {{ printf "%.1f" $value }}%.
          runbook_url: "https://wiki.internal/runbook/infra-003"

      # INFRA-005: ディスク使用率Critical
      - alert: DiskUtilizationCritical
        expr: |
          (1 - (node_filesystem_avail_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes{fstype!="tmpfs"})) * 100 > 90
        for: 0m
        labels:
          severity: critical
          category: infrastructure
          alert_id: INFRA-005
        annotations:
          summary: "Disk Utilization Critical"
          description: |
            Instance {{ $labels.instance }} disk {{ $labels.mountpoint }} usage is {{ printf "%.1f" $value }}%.
          runbook_url: "https://wiki.internal/runbook/infra-005"

  - name: infrastructure_kubernetes
    interval: 30s
    rules:
      # K8S-001: Pod再起動多発
      - alert: PodRestartSpike
        expr: |
          sum by (namespace, pod) (
            increase(kube_pod_container_status_restarts_total[1h])
          ) > 3
        for: 0m
        labels:
          severity: high
          category: kubernetes
          alert_id: K8S-001
        annotations:
          summary: "Pod Restart Spike"
          description: |
            Pod {{ $labels.namespace }}/{{ $labels.pod }} restarted {{ $value }} times in the last hour.
          runbook_url: "https://wiki.internal/runbook/k8s-001"

      # K8S-002: Podクラッシュループ
      - alert: PodCrashLoop
        expr: |
          kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff"} > 0
        for: 0m
        labels:
          severity: critical
          category: kubernetes
          alert_id: K8S-002
        annotations:
          summary: "Pod in CrashLoopBackOff"
          description: |
            Pod {{ $labels.namespace }}/{{ $labels.pod }} container {{ $labels.container }} is in CrashLoopBackOff.
          runbook_url: "https://wiki.internal/runbook/k8s-002"

      # K8S-003: ノード異常
      - alert: NodeNotReady
        expr: |
          kube_node_status_condition{condition="Ready",status="true"} == 0
        for: 1m
        labels:
          severity: critical
          category: kubernetes
          alert_id: K8S-003
        annotations:
          summary: "Node Not Ready"
          description: |
            Node {{ $labels.node }} is not ready.
          runbook_url: "https://wiki.internal/runbook/k8s-003"

  - name: infrastructure_database
    interval: 30s
    rules:
      # DB-001: 接続数Critical
      - alert: DatabaseConnectionsCritical
        expr: |
          (pg_stat_activity_count / pg_settings_max_connections) * 100 > 90
        for: 1m
        labels:
          severity: critical
          category: database
          alert_id: DB-001
        annotations:
          summary: "Database Connections Critical"
          description: |
            Database connection pool is {{ printf "%.1f" $value }}% utilized.
          runbook_url: "https://wiki.internal/runbook/db-001"

      # DB-004: レプリケーション遅延Critical
      - alert: ReplicationLagCritical
        expr: |
          pg_replication_lag_seconds > 30
        for: 1m
        labels:
          severity: critical
          category: database
          alert_id: DB-004
        annotations:
          summary: "Database Replication Lag Critical"
          description: |
            Replication lag is {{ $value }} seconds.
            Threshold: 30 seconds
          runbook_url: "https://wiki.internal/runbook/db-004"

      # DB-006: デッドロック発生
      - alert: DatabaseDeadlock
        expr: |
          increase(pg_stat_database_deadlocks[5m]) > 0
        for: 0m
        labels:
          severity: high
          category: database
          alert_id: DB-006
        annotations:
          summary: "Database Deadlock Detected"
          description: |
            {{ $value }} deadlocks detected in database {{ $labels.datname }}.
          runbook_url: "https://wiki.internal/runbook/db-006"
```

### 2.4 アプリケーションアラート

```yaml
# /etc/prometheus/rules/application_alerts.yml

groups:
  - name: application_availability
    interval: 10s
    rules:
      # APP-001: サービス停止
      - alert: ServiceDown
        expr: |
          up{job="lifeplan-navigator"} == 0
        for: 1m
        labels:
          severity: critical
          category: availability
          alert_id: APP-001
        annotations:
          summary: "Service Down"
          description: |
            LifePlan Navigator service is down on {{ $labels.instance }}.
          runbook_url: "https://wiki.internal/runbook/app-001"

      # APP-002: エラー率Critical
      - alert: ErrorRateCritical
        expr: |
          (
            sum(rate(http_requests_total{application="lifeplan-navigator",status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total{application="lifeplan-navigator"}[5m]))
          ) * 100 > 5
        for: 5m
        labels:
          severity: high
          category: availability
          alert_id: APP-002
        annotations:
          summary: "Error Rate Critical"
          description: |
            Error rate is {{ printf "%.2f" $value }}%.
            Threshold: 5%
          runbook_url: "https://wiki.internal/runbook/app-002"

      # APP-003: エラー率Warning
      - alert: ErrorRateWarning
        expr: |
          (
            sum(rate(http_requests_total{application="lifeplan-navigator",status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total{application="lifeplan-navigator"}[5m]))
          ) * 100 > 1
        for: 10m
        labels:
          severity: medium
          category: availability
          alert_id: APP-003
        annotations:
          summary: "Error Rate Warning"
          description: |
            Error rate is {{ printf "%.2f" $value }}%.
            Warning threshold: 1%
          runbook_url: "https://wiki.internal/runbook/app-003"

  - name: application_performance
    interval: 10s
    rules:
      # APP-006: レスポンスタイムCritical
      - alert: ResponseTimeCritical
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket{application="lifeplan-navigator"}[5m])) by (le)
          ) > 3
        for: 5m
        labels:
          severity: high
          category: performance
          alert_id: APP-006
        annotations:
          summary: "Response Time Critical"
          description: |
            P95 response time is {{ printf "%.2f" $value }} seconds.
            Threshold: 3 seconds
          runbook_url: "https://wiki.internal/runbook/app-006"

      # APP-008: リクエスト急増
      - alert: RequestSpike
        expr: |
          (
            sum(rate(http_requests_total{application="lifeplan-navigator"}[5m]))
            /
            avg_over_time(sum(rate(http_requests_total{application="lifeplan-navigator"}[5m]))[1h:5m])
          ) > 2
        for: 1m
        labels:
          severity: high
          category: performance
          alert_id: APP-008
        annotations:
          summary: "Request Spike Detected"
          description: |
            Request rate is {{ printf "%.1f" $value }}x the 1-hour average.
          runbook_url: "https://wiki.internal/runbook/app-008"
```

---

## 3. Alertmanager 設定

### 3.1 基本設定

```yaml
# /etc/alertmanager/alertmanager.yml

global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.internal:587'
  smtp_from: 'alertmanager@lifeplan.example.com'
  smtp_auth_username: 'alertmanager'
  smtp_auth_password_file: '/etc/alertmanager/secrets/smtp_password'
  slack_api_url_file: '/etc/alertmanager/secrets/slack_webhook'
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

# テンプレート設定
templates:
  - '/etc/alertmanager/templates/*.tmpl'

# ルーティング設定
route:
  group_by: ['alertname', 'severity', 'category']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default-receiver'

  routes:
    # Critical (P0) アラート - 即時通知
    - match:
        severity: critical
      receiver: 'critical-receiver'
      group_wait: 0s
      group_interval: 1m
      repeat_interval: 1h
      continue: true

    # High (P1) アラート
    - match:
        severity: high
      receiver: 'high-receiver'
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 2h
      continue: true

    # Medium (P2) アラート
    - match:
        severity: medium
      receiver: 'medium-receiver'
      group_wait: 1m
      group_interval: 10m
      repeat_interval: 4h

    # Security アラート - 追加通知
    - match:
        category: authentication
      receiver: 'security-receiver'
      continue: true

    - match:
        category: data_protection
      receiver: 'security-receiver'
      continue: true

    # Infrastructure アラート
    - match:
        category: infrastructure
      receiver: 'infra-receiver'

    - match:
        category: kubernetes
      receiver: 'infra-receiver'

    - match:
        category: database
      receiver: 'dba-receiver'

# 抑制ルール
inhibit_rules:
  # サービスダウン時は他のアラートを抑制
  - source_match:
      alertname: 'ServiceDown'
    target_match_re:
      alertname: '(ErrorRate|ResponseTime).*'
    equal: ['instance']

  # ノード障害時はPodアラートを抑制
  - source_match:
      alertname: 'NodeNotReady'
    target_match:
      category: 'kubernetes'
    equal: ['node']

  # Critical発生時は同じアラートのWarningを抑制
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'medium'
    equal: ['alertname']

# レシーバー設定
receivers:
  - name: 'default-receiver'
    slack_configs:
      - channel: '#soc-alerts-general'
        send_resolved: true
        title: '{{ template "slack.default.title" . }}'
        text: '{{ template "slack.default.text" . }}'

  - name: 'critical-receiver'
    pagerduty_configs:
      - service_key_file: '/etc/alertmanager/secrets/pagerduty_key'
        severity: critical
        description: '{{ template "pagerduty.default.description" . }}'
        details:
          firing: '{{ template "pagerduty.default.instances" .Alerts.Firing }}'
          resolved: '{{ template "pagerduty.default.instances" .Alerts.Resolved }}'
    slack_configs:
      - channel: '#soc-alerts-critical'
        send_resolved: true
        color: '{{ template "slack.color" . }}'
        title: ':rotating_light: CRITICAL ALERT :rotating_light:'
        text: '{{ template "slack.critical.text" . }}'
    webhook_configs:
      - url: 'http://soc-automation:8080/webhooks/critical'
        send_resolved: true

  - name: 'high-receiver'
    pagerduty_configs:
      - service_key_file: '/etc/alertmanager/secrets/pagerduty_key'
        severity: warning
    slack_configs:
      - channel: '#soc-alerts-high'
        send_resolved: true
        title: ':warning: HIGH Alert'
        text: '{{ template "slack.high.text" . }}'

  - name: 'medium-receiver'
    slack_configs:
      - channel: '#soc-alerts-general'
        send_resolved: true
        title: ':information_source: Medium Alert'
        text: '{{ template "slack.default.text" . }}'

  - name: 'security-receiver'
    slack_configs:
      - channel: '#security-alerts'
        send_resolved: true
        title: ':shield: Security Alert'
        text: '{{ template "slack.security.text" . }}'

  - name: 'infra-receiver'
    slack_configs:
      - channel: '#infra-alerts'
        send_resolved: true
        text: '{{ template "slack.default.text" . }}'

  - name: 'dba-receiver'
    slack_configs:
      - channel: '#dba-alerts'
        send_resolved: true
        text: '{{ template "slack.default.text" . }}'
    email_configs:
      - to: 'dba-team@example.com'
        send_resolved: true
```

### 3.2 通知テンプレート

```tmpl
# /etc/alertmanager/templates/slack.tmpl

{{ define "slack.color" }}
  {{ if eq .Status "firing" }}
    {{ if eq .CommonLabels.severity "critical" }}danger{{ end }}
    {{ if eq .CommonLabels.severity "high" }}warning{{ end }}
    {{ if eq .CommonLabels.severity "medium" }}#439FE0{{ end }}
  {{ else }}good{{ end }}
{{ end }}

{{ define "slack.default.title" }}
[{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] {{ .CommonLabels.alertname }}
{{ end }}

{{ define "slack.default.text" }}
{{ range .Alerts }}
*Alert:* {{ .Annotations.summary }}
*Severity:* {{ .Labels.severity }}
*Description:* {{ .Annotations.description }}

*Details:*
{{ range .Labels.SortedPairs }}• *{{ .Name }}:* {{ .Value }}
{{ end }}

*Links:*
{{ if .Annotations.runbook_url }}• <{{ .Annotations.runbook_url }}|Runbook>{{ end }}
{{ if .Annotations.dashboard_url }}• <{{ .Annotations.dashboard_url }}|Dashboard>{{ end }}
---
{{ end }}
{{ end }}

{{ define "slack.critical.text" }}
:rotating_light: *CRITICAL SECURITY ALERT* :rotating_light:

{{ range .Alerts }}
*Alert ID:* {{ .Labels.alert_id }}
*Alert:* {{ .Annotations.summary }}
*Time:* {{ .StartsAt.Format "2006-01-02 15:04:05" }}

*Description:*
{{ .Annotations.description }}

{{ if .Labels.mitre_attack }}*MITRE ATT&CK:* {{ .Labels.mitre_attack }}{{ end }}

*Immediate Actions Required:*
1. Acknowledge this alert immediately
2. Follow runbook: <{{ .Annotations.runbook_url }}|{{ .Labels.alert_id }}>
3. Update incident status every 15 minutes

*Escalation:* If not acknowledged within 5 minutes, escalating to CSIRT Lead

---
{{ end }}
{{ end }}

{{ define "slack.security.text" }}
:shield: *Security Alert*

{{ range .Alerts }}
*Alert:* {{ .Labels.alertname }}
*Category:* {{ .Labels.category }}
*Severity:* {{ .Labels.severity }}

{{ .Annotations.description }}

{{ if .Labels.src_ip }}*Source IP:* {{ .Labels.src_ip }}{{ end }}
{{ if .Labels.user }}*User:* {{ .Labels.user }}{{ end }}

<{{ .Annotations.runbook_url }}|View Runbook>
---
{{ end }}
{{ end }}
```

---

## 4. Grafana アラート設定

### 4.1 Grafana Alerting ルール

```yaml
# Grafana Alert Rules (JSON API format)

apiVersion: 1
groups:
  - orgId: 1
    name: SecurityAlerts
    folder: Security
    interval: 10s
    rules:
      - uid: grafana-auth-anomaly
        title: Authentication Anomaly Detection
        condition: C
        data:
          - refId: A
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: prometheus
            model:
              expr: |
                sum(increase(auth_login_failures_total{application="lifeplan-navigator"}[5m]))
              intervalMs: 1000
              maxDataPoints: 43200
          - refId: B
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: __expr__
            model:
              conditions:
                - evaluator:
                    params:
                      - 10
                    type: gt
                  operator:
                    type: and
                  query:
                    params:
                      - A
                  reducer:
                    type: last
              type: classic_conditions
          - refId: C
            datasourceUid: __expr__
            model:
              expression: B
              type: reduce
              reducer: last
        noDataState: OK
        execErrState: Error
        for: 0s
        annotations:
          summary: High number of authentication failures detected
          description: "{{ $values.A.Value }} authentication failures in the last 5 minutes"
          runbook_url: https://wiki.internal/runbook/auth-anomaly
        labels:
          severity: high
          category: security
```

### 4.2 Grafana 通知チャンネル設定

```yaml
# Grafana Contact Points

apiVersion: 1
contactPoints:
  - orgId: 1
    name: Critical-Security
    receivers:
      - uid: critical-pagerduty
        type: pagerduty
        settings:
          integrationKey: ${PAGERDUTY_INTEGRATION_KEY}
          severity: critical
          class: security
        disableResolveMessage: false
      - uid: critical-slack
        type: slack
        settings:
          recipient: '#soc-alerts-critical'
          mentionUsers: '@soc-oncall'
          text: |
            :rotating_light: *CRITICAL ALERT* :rotating_light:

            *Alert:* {{ .CommonAnnotations.summary }}
            *Description:* {{ .CommonAnnotations.description }}

            *Values:*
            {{ range .Alerts }}
            - {{ .Labels.alertname }}: {{ .ValueString }}
            {{ end }}

  - orgId: 1
    name: High-Alerts
    receivers:
      - uid: high-slack
        type: slack
        settings:
          recipient: '#soc-alerts-high'
          text: |
            :warning: *HIGH Alert*

            *Alert:* {{ .CommonAnnotations.summary }}
            {{ .CommonAnnotations.description }}

  - orgId: 1
    name: Security-Team
    receivers:
      - uid: security-slack
        type: slack
        settings:
          recipient: '#security-alerts'
          text: |
            :shield: *Security Alert*

            {{ range .Alerts }}
            *{{ .Labels.alertname }}*
            {{ .Annotations.description }}
            {{ end }}

# Notification Policies
policies:
  - orgId: 1
    receiver: High-Alerts
    group_by:
      - alertname
      - severity
    routes:
      - receiver: Critical-Security
        matchers:
          - severity = critical
        continue: true
        group_wait: 0s
        group_interval: 1m
      - receiver: Security-Team
        matchers:
          - category =~ security|authentication|data_protection
        continue: true
```

---

## 5. 自動対応アクション設定

### 5.1 Webhook Handler

```yaml
# SOC Automation Webhook Handler Configuration

handlers:
  # ブルートフォース攻撃対応
  - name: brute_force_response
    trigger:
      alert_id: SEC-001
      severity: high
    actions:
      - type: waf_block_ip
        duration: 30m
        params:
          ip: "{{ .labels.src_ip }}"
      - type: create_ticket
        params:
          project: INCIDENT
          priority: P1
          summary: "Brute Force Attack - {{ .labels.src_ip }}"
      - type: notify
        params:
          channel: csirt
          message: "Auto-blocked IP {{ .labels.src_ip }} for brute force attack"

  # セッションハイジャック対応
  - name: session_hijack_response
    trigger:
      alert_id: SEC-008
      severity: critical
    actions:
      - type: revoke_session
        params:
          session_id: "{{ .labels.session_id }}"
      - type: lock_account
        params:
          user_id: "{{ .labels.user }}"
          reason: "session_hijack_suspected"
      - type: notify_user
        params:
          user_id: "{{ .labels.user }}"
          template: "session_security_alert"
      - type: escalate
        params:
          team: csirt
          priority: P0

  # 大量データエクスポート対応
  - name: mass_export_response
    trigger:
      alert_id: SEC-011
      severity: critical
    actions:
      - type: disable_feature
        params:
          user_id: "{{ .labels.user }}"
          feature: "data_export"
      - type: revoke_session
        params:
          user_id: "{{ .labels.user }}"
      - type: create_ticket
        params:
          project: INCIDENT
          priority: P0
          summary: "Mass Data Export - {{ .labels.user }}"
      - type: escalate
        params:
          team: csirt
          priority: P0
          notify_ciso: true
```

---

## 6. アラートテスト手順

### 6.1 テストスクリプト

```bash
#!/bin/bash
# /scripts/test_alerts.sh

# テスト用メトリクス送信
send_test_metric() {
    local metric_name=$1
    local value=$2
    local labels=$3

    curl -X POST "http://pushgateway:9091/metrics/job/alert_test" \
        --data-binary "${metric_name}${labels} ${value}"
}

# SEC-001: ブルートフォーステスト
test_brute_force() {
    echo "Testing SEC-001: Brute Force Alert..."
    for i in {1..6}; do
        send_test_metric "auth_login_failures_total" "$i" '{application="lifeplan-navigator",src_ip="test_ip"}'
        sleep 10
    done
}

# SEC-008: セッション異常テスト
test_session_anomaly() {
    echo "Testing SEC-008: Session Anomaly Alert..."
    send_test_metric "session_anomaly_score" "0.9" '{application="lifeplan-navigator",session_id="test_session",user="test_user"}'
}

# APP-002: エラー率テスト
test_error_rate() {
    echo "Testing APP-002: Error Rate Alert..."
    send_test_metric "http_requests_total" "100" '{application="lifeplan-navigator",status="500"}'
    send_test_metric "http_requests_total" "1000" '{application="lifeplan-navigator",status="200"}'
}

# テスト実行
case "$1" in
    brute_force)
        test_brute_force
        ;;
    session)
        test_session_anomaly
        ;;
    error_rate)
        test_error_rate
        ;;
    all)
        test_brute_force
        test_session_anomaly
        test_error_rate
        ;;
    *)
        echo "Usage: $0 {brute_force|session|error_rate|all}"
        exit 1
        ;;
esac

echo "Test completed. Check Alertmanager for fired alerts."
```

### 6.2 アラート検証チェックリスト

```markdown
# Alert Verification Checklist

## Pre-Production Verification

### 1. Alert Firing
- [ ] Alert fires when threshold is exceeded
- [ ] Alert does not fire below threshold
- [ ] Alert resolves when condition clears

### 2. Notification Delivery
- [ ] Slack notification received
- [ ] PagerDuty incident created (for critical)
- [ ] Email delivered (where configured)

### 3. Alert Content
- [ ] Summary is clear and actionable
- [ ] Description includes all relevant details
- [ ] Runbook URL is correct and accessible
- [ ] Dashboard URL links to correct dashboard

### 4. Routing
- [ ] Critical alerts go to correct channels
- [ ] Security alerts notify security team
- [ ] Infrastructure alerts notify SRE/Infra team

### 5. Inhibition
- [ ] Lower severity suppressed when higher fires
- [ ] Related alerts properly grouped

### 6. Auto-Response
- [ ] Automated actions trigger correctly
- [ ] Actions are logged and auditable
- [ ] Rollback procedures work
```

---

## 7. 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| LifePlan_Navigator_SOC_Monitoring_Design.md | SOC監視設計書 |
| LifePlan_Navigator_Alert_Rules.md | アラートルール一覧 |
| LifePlan_Navigator_Dashboard_Design.md | ダッシュボード設計書 |
| LifePlan_Navigator_SOC_Runbook.md | SOC運用手順書 |

---

## 8. 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2025-12-11 | 初版作成 | SOC Analyst |

---

## 9. 承認

| 役割 | 氏名 | 日付 | 署名 |
|------|------|------|------|
| 作成者 | SOC Analyst | 2025-12-11 | |
| レビュー | CSIRT Team Leader | | |
| レビュー | Network Engineer | | |
| 承認 | CISO | | |
