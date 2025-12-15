# LifePlan Navigator 監視ダッシュボード詳細設計書

| 項目 | 内容 |
|------|------|
| ドキュメント名 | 監視ダッシュボード詳細設計書 |
| バージョン | 1.0 |
| 作成日 | 2025-12-11 |
| 作成者 | SOC Analyst |
| レビュー | CSIRT Team Leader, CTI Analyst, Network Engineer |
| 分類 | Confidential |

---

## 1. 概要

### 1.1 目的
本ドキュメントは、LifePlan Navigator の監視ダッシュボードの詳細設計を定義する。Grafana を中心とした可視化基盤により、SOC、CSIRT、経営層の各ステークホルダーが必要な情報をリアルタイムで把握できる環境を構築する。

### 1.2 ダッシュボード体系

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ダッシュボード体系図                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Executive Layer (経営層)                          │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │   │
│  │  │ Executive        │  │ Risk Overview    │  │ Compliance      │   │   │
│  │  │ Security Summary │  │ Dashboard        │  │ Status          │   │   │
│  │  └──────────────────┘  └──────────────────┘  └─────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↑                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Operations Layer (運用層)                         │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │   │
│  │  │ SOC Overview │ │ Security     │ │ Network      │ │ Application│ │   │
│  │  │              │ │ Incidents    │ │ Security     │ │ Security   │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↑                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Technical Layer (技術層)                          │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │   │
│  │  │ Auth       │ │ WAF/IDS    │ │ Database   │ │ Kubernetes │       │   │
│  │  │ Monitor    │ │ Monitor    │ │ Monitor    │ │ Monitor    │       │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │   │
│  │  │ Log        │ │ Threat     │ │ Endpoint   │ │ Cloud      │       │   │
│  │  │ Analytics  │ │ Intel      │ │ Security   │ │ Security   │       │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Executive Security Summary Dashboard

### 2.1 概要

| 項目 | 内容 |
|------|------|
| ダッシュボードID | `exec-security-summary` |
| 対象者 | CEO, CISO, CFO, CLO, CMO |
| 更新頻度 | 1時間 |
| データ保持期間 | 90日 |

### 2.2 レイアウト設計

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Executive Security Summary                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐│
│ │ Security Score  │ │ Risk Level      │ │ Open Incidents  │ │ Compliance  ││
│ │     [87/100]    │ │    [MEDIUM]     │ │      [3]        │ │   [98.5%]   ││
│ │ ▲ +5 vs last wk │ │                 │ │ P0:0 P1:2 P2:1  │ │             ││
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │                Security Trend (30 Days)                               │  │
│ │  Score                                                                │  │
│ │  100│                          ╭──────────╮                           │  │
│ │     │     ╭────╮    ╭─────────╯          ╰─────╮                     │  │
│ │   80│─────╯    ╰────╯                          ╰───                  │  │
│ │     │                                                                │  │
│ │   60└─────────────────────────────────────────────────────►          │  │
│ │       W1      W2      W3      W4                                     │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────┐ ┌────────────────────────────────────┐  │
│ │ Top Security Risks             │ │ Compliance Status by Framework    │  │
│ │                                │ │                                    │  │
│ │ 1. Credential stuffing ████ 35│ │ NIST CSF 2.0  ████████████░░ 92%  │  │
│ │ 2. Phishing attempts   ███ 28 │ │ ISO 27001     █████████████░ 95%  │  │
│ │ 3. Vulnerable deps     ██ 15  │ │ GDPR          █████████████░ 98%  │  │
│ │ 4. Config drift        █ 8    │ │ SOC 2 Type II ████████████░░ 91%  │  │
│ └────────────────────────────────┘ └────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ Monthly Incident Summary                                               │  │
│ │                                                                        │  │
│ │ ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐         │  │
│ │ │ Category│ Oct     │ Nov     │ Dec     │ Trend   │ Status  │         │  │
│ │ ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤         │  │
│ │ │ P0      │ 1       │ 0       │ 0       │ ↓       │ ✓ Good  │         │  │
│ │ │ P1      │ 5       │ 4       │ 2       │ ↓       │ ✓ Good  │         │  │
│ │ │ P2      │ 12      │ 10      │ 8       │ ↓       │ ✓ Good  │         │  │
│ │ │ MTTR    │ 4.5h    │ 3.8h    │ 3.2h    │ ↓       │ ✓ Good  │         │  │
│ │ └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘         │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 パネル定義

#### Panel 1: Security Score

```yaml
panel:
  title: "Security Score"
  type: gauge
  datasource: prometheus

  query: |
    security_score_total{application="lifeplan-navigator"}

  thresholds:
    - value: 0
      color: red
    - value: 60
      color: orange
    - value: 80
      color: yellow
    - value: 90
      color: green

  options:
    min: 0
    max: 100
    showThresholdLabels: true
    showThresholdMarkers: true
```

#### Panel 2: Risk Level

```yaml
panel:
  title: "Risk Level"
  type: stat
  datasource: prometheus

  query: |
    risk_level_current{application="lifeplan-navigator"}

  mappings:
    - value: 1
      text: "LOW"
      color: green
    - value: 2
      text: "MEDIUM"
      color: yellow
    - value: 3
      text: "HIGH"
      color: orange
    - value: 4
      text: "CRITICAL"
      color: red
```

#### Panel 3: Open Incidents

```yaml
panel:
  title: "Open Incidents"
  type: stat
  datasource: prometheus

  queries:
    - name: total
      query: |
        sum(incidents_open_total{application="lifeplan-navigator"})
    - name: p0
      query: |
        incidents_open_total{application="lifeplan-navigator",severity="P0"}
    - name: p1
      query: |
        incidents_open_total{application="lifeplan-navigator",severity="P1"}
    - name: p2
      query: |
        incidents_open_total{application="lifeplan-navigator",severity="P2"}
```

---

## 3. SOC Overview Dashboard

### 3.1 概要

| 項目 | 内容 |
|------|------|
| ダッシュボードID | `soc-overview` |
| 対象者 | SOC Analyst, CSIRT Team Leader |
| 更新頻度 | 10秒 |
| データ保持期間 | 30日 |

### 3.2 レイアウト設計

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOC Overview Dashboard                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 1: Key Metrics                                                           │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│
│ │ Active      │ │ Security    │ │ Threat      │ │ MTTA        │ │ MTTR    ││
│ │ Alerts [24] │ │ Score [87]  │ │ Level [MED] │ │ [8 min]     │ │ [2.5h]  ││
│ │ ▲+5 vs 1h   │ │             │ │             │ │ Target: 15m │ │ Tgt: 4h ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 2: Alert Distribution                                                    │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ Alerts by Severity              │ │ Alerts by Category                   ││
│ │                                 │ │                                      ││
│ │ ■ Critical  ██ 5               │ │ ■ Auth      ████████████ 45         ││
│ │ ■ High      ████████ 35        │ │ ■ Network   ██████ 28               ││
│ │ ■ Medium    ████████████ 52    │ │ ■ Data      ████ 18                 ││
│ │ ■ Low       ██████ 28          │ │ ■ Infra     ███ 15                  ││
│ │                                 │ │ ■ Other     ██ 14                   ││
│ └─────────────────────────────────┘ └─────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 3: Real-time Activity                                                    │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ Security Event Timeline (24h)                                          │  │
│ │  Events                                                                │  │
│ │  200│         ╭─╮                         ╭───╮                        │  │
│ │     │    ╭───╯ ╰╮      ╭──────╮     ╭────╯   ╰──                      │  │
│ │  100│────╯      ╰──────╯      ╰─────╯                                  │  │
│ │     │                                                                  │  │
│ │    0└──────────────────────────────────────────────────────►          │  │
│ │       00:00   04:00   08:00   12:00   16:00   20:00   24:00            │  │
│ │                                                                        │  │
│ │  Legend: ── Total  ── Blocked  ── Detected                            │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 4: Authentication & WAF                                                  │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ Authentication Activity         │ │ WAF/IDS Events                       ││
│ │                                 │ │                                      ││
│ │ Login Success   █████████ 1.2K │ │ Attacks Blocked  ████████████ 847    ││
│ │ Login Failed    ██ 45          │ │ SQL Injection    ████ 23             ││
│ │ Account Locked  █ 3            │ │ XSS Attempts     █████ 31            ││
│ │ MFA Triggered   ████ 156       │ │ Path Traversal   ██ 12               ││
│ │ Session Created ████████ 890   │ │ Command Inj      █ 5                 ││
│ └─────────────────────────────────┘ └─────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 5: Recent Alerts                                                         │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ Recent Security Alerts (Last 1 hour)                                   │  │
│ │                                                                        │  │
│ │ Time     | Severity | Alert ID  | Description              | Status   │  │
│ │ ─────────┼──────────┼───────────┼──────────────────────────┼────────  │  │
│ │ 10:23:45 | CRITICAL | SEC-004   | Session anomaly - admin  | New      │  │
│ │ 10:15:22 | HIGH     | SEC-001   | Brute force - 203.x.x.x  | Ack      │  │
│ │ 09:58:11 | HIGH     | SEC-019   | XSS attack - /api/search | Resolved │  │
│ │ 09:45:03 | MEDIUM   | SEC-009   | Account lockout spike    | Ack      │  │
│ │ 09:32:17 | MEDIUM   | SEC-002   | Failed logins - user123  | Resolved │  │
│ │                                                                        │  │
│ │ [View All Alerts] [Create Incident] [Export]                          │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 6: Geographic & Top Sources                                              │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ Geographic Distribution         │ │ Top Attack Sources                   ││
│ │                                 │ │                                      ││
│ │      [World Map Visualization]  │ │ 1. 203.0.113.45 (CN) ████████ 156   ││
│ │                                 │ │ 2. 198.51.100.23 (RU) ███████ 142   ││
│ │ ● Normal Traffic                │ │ 3. 192.0.2.67 (BR)   ████ 89        ││
│ │ ● Suspicious Activity           │ │ 4. 203.0.113.89 (IN) ███ 67         ││
│ │ ● Attack Source                 │ │ 5. 198.51.100.45 (KR) ██ 45         ││
│ └─────────────────────────────────┘ └─────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Grafana JSON Model (主要部分)

```json
{
  "dashboard": {
    "id": null,
    "uid": "soc-overview",
    "title": "SOC Overview Dashboard",
    "tags": ["security", "soc", "monitoring"],
    "timezone": "Asia/Tokyo",
    "refresh": "10s",
    "panels": [
      {
        "id": 1,
        "title": "Active Alerts",
        "type": "stat",
        "gridPos": { "h": 4, "w": 4, "x": 0, "y": 0 },
        "targets": [
          {
            "expr": "sum(alerts_active_total{application=\"lifeplan-navigator\"})",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 10 },
                { "color": "orange", "value": 30 },
                { "color": "red", "value": 50 }
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Security Score",
        "type": "gauge",
        "gridPos": { "h": 4, "w": 4, "x": 4, "y": 0 },
        "targets": [
          {
            "expr": "security_score_total{application=\"lifeplan-navigator\"}",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "min": 0,
            "max": 100,
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "color": "red", "value": null },
                { "color": "orange", "value": 60 },
                { "color": "yellow", "value": 80 },
                { "color": "green", "value": 90 }
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "Security Event Timeline",
        "type": "timeseries",
        "gridPos": { "h": 8, "w": 24, "x": 0, "y": 8 },
        "targets": [
          {
            "expr": "sum(rate(security_events_total{application=\"lifeplan-navigator\"}[5m]))",
            "legendFormat": "Total Events",
            "refId": "A"
          },
          {
            "expr": "sum(rate(security_events_blocked_total{application=\"lifeplan-navigator\"}[5m]))",
            "legendFormat": "Blocked",
            "refId": "B"
          },
          {
            "expr": "sum(rate(security_events_detected_total{application=\"lifeplan-navigator\"}[5m]))",
            "legendFormat": "Detected",
            "refId": "C"
          }
        ],
        "options": {
          "tooltip": { "mode": "multi" },
          "legend": { "displayMode": "list", "placement": "bottom" }
        }
      },
      {
        "id": 4,
        "title": "Authentication Activity",
        "type": "stat",
        "gridPos": { "h": 6, "w": 8, "x": 0, "y": 16 },
        "targets": [
          {
            "expr": "sum(increase(auth_login_total{application=\"lifeplan-navigator\",result=\"success\"}[1h]))",
            "legendFormat": "Login Success",
            "refId": "A"
          },
          {
            "expr": "sum(increase(auth_login_total{application=\"lifeplan-navigator\",result=\"failure\"}[1h]))",
            "legendFormat": "Login Failed",
            "refId": "B"
          },
          {
            "expr": "sum(increase(auth_account_lockout_total{application=\"lifeplan-navigator\"}[1h]))",
            "legendFormat": "Account Locked",
            "refId": "C"
          }
        ]
      },
      {
        "id": 5,
        "title": "Recent Security Alerts",
        "type": "table",
        "gridPos": { "h": 8, "w": 24, "x": 0, "y": 22 },
        "targets": [
          {
            "expr": "topk(10, alerts_recent{application=\"lifeplan-navigator\"})",
            "format": "table",
            "refId": "A"
          }
        ],
        "transformations": [
          {
            "id": "organize",
            "options": {
              "excludeByName": {},
              "renameByName": {
                "Time": "時刻",
                "severity": "重要度",
                "alert_id": "アラートID",
                "description": "説明",
                "status": "ステータス"
              }
            }
          }
        ]
      }
    ]
  }
}
```

---

## 4. Authentication Monitor Dashboard

### 4.1 概要

| 項目 | 内容 |
|------|------|
| ダッシュボードID | `auth-monitor` |
| 対象者 | SOC Analyst, CSIRT Engineer |
| 更新頻度 | リアルタイム (5秒) |
| データ保持期間 | 90日 |

### 4.2 レイアウト設計

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Authentication Monitor Dashboard                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 1: Authentication KPIs                                                   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│
│ │ Login Rate  │ │ Success     │ │ Active      │ │ Account     │ │ MFA     ││
│ │ [45/min]    │ │ Rate [98%]  │ │ Sessions    │ │ Lockouts    │ │ Usage   ││
│ │             │ │             │ │ [1,234]     │ │ [3]         │ │ [89%]   ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 2: Login Trends                                                          │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ Login Activity (Last 24 Hours)                                         │  │
│ │                                                                        │  │
│ │  Logins                                                                │  │
│ │  100│    ╭───╮           ╭─────────────╮                              │  │
│ │     │ ───╯   ╰───────────╯             ╰─────                          │  │
│ │   50│                                                                  │  │
│ │     │                                                                  │  │
│ │    0└─────────────────────────────────────────────────────►           │  │
│ │       00:00  04:00  08:00  12:00  16:00  20:00  24:00                  │  │
│ │                                                                        │  │
│ │  ── Success  ── Failure  ── MFA Challenge                             │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 3: Failed Login Analysis                                                 │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ Failed Logins by Reason         │ │ Top Failed Login Sources            ││
│ │                                 │ │                                      ││
│ │ ■ Invalid Password  ████████ 78│ │ IP: 203.0.113.45      ████████ 23   ││
│ │ ■ Account Locked    ████ 34    │ │ IP: 198.51.100.23     ██████ 18     ││
│ │ ■ Invalid Username  ███ 25     │ │ IP: 192.0.2.67        ████ 12       ││
│ │ ■ MFA Failed        ██ 15      │ │ User: admin           ███ 9          ││
│ │ ■ Expired Password  █ 8        │ │ User: test            ██ 7           ││
│ └─────────────────────────────────┘ └─────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 4: Session Analysis                                                      │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ Session Duration Distribution   │ │ Concurrent Sessions by User         ││
│ │                                 │ │                                      ││
│ │ < 5 min     ████████████ 45%   │ │ user_a@example.com    ███ 3          ││
│ │ 5-30 min    ██████████ 35%     │ │ user_b@example.com    ██ 2           ││
│ │ 30-60 min   ████ 12%           │ │ user_c@example.com    ██ 2           ││
│ │ > 60 min    ██ 8%              │ │ (Normal: 1-2 sessions)               ││
│ └─────────────────────────────────┘ └─────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 5: Anomaly Detection                                                     │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ Authentication Anomalies                                               │  │
│ │                                                                        │  │
│ │ Time     | User           | Type                | Risk   | Action     │  │
│ │ ─────────┼────────────────┼─────────────────────┼────────┼──────────  │  │
│ │ 10:23:45 | admin          | Impossible Travel   | HIGH   | Blocked    │  │
│ │ 10:15:22 | user123        | Unusual Location    | MEDIUM | Alert      │  │
│ │ 09:58:11 | service_acct   | Off-hours Login     | LOW    | Logged     │  │
│ │ 09:45:03 | user456        | Multiple Sessions   | MEDIUM | Alert      │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 主要クエリ定義

```yaml
# Login Rate per Minute
- name: login_rate_per_minute
  query: |
    sum(rate(auth_login_total{application="lifeplan-navigator"}[1m])) * 60

# Login Success Rate
- name: login_success_rate
  query: |
    sum(auth_login_total{application="lifeplan-navigator",result="success"})
    /
    sum(auth_login_total{application="lifeplan-navigator"}) * 100

# Active Sessions
- name: active_sessions
  query: |
    sum(session_active_total{application="lifeplan-navigator"})

# Account Lockouts (Last Hour)
- name: account_lockouts_1h
  query: |
    sum(increase(auth_account_lockout_total{application="lifeplan-navigator"}[1h]))

# MFA Usage Rate
- name: mfa_usage_rate
  query: |
    sum(auth_mfa_challenges_total{application="lifeplan-navigator",result="success"})
    /
    sum(auth_login_total{application="lifeplan-navigator",result="success"}) * 100

# Failed Logins by Reason
- name: failed_logins_by_reason
  query: |
    sum by (reason) (increase(auth_login_total{application="lifeplan-navigator",result="failure"}[1h]))

# Top Failed Login Sources
- name: top_failed_sources
  query: |
    topk(5, sum by (src_ip) (increase(auth_login_total{application="lifeplan-navigator",result="failure"}[1h])))
```

---

## 5. Network Security Dashboard

### 5.1 概要

| 項目 | 内容 |
|------|------|
| ダッシュボードID | `network-security` |
| 対象者 | Network Engineer, SOC Analyst |
| 更新頻度 | 10秒 |
| データ保持期間 | 30日 |

### 5.2 レイアウト設計

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Network Security Dashboard                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 1: Traffic Overview                                                      │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│
│ │ Inbound     │ │ Outbound    │ │ Blocked     │ │ WAF Blocks  │ │ IDS     ││
│ │ Traffic     │ │ Traffic     │ │ Connections │ │ (Today)     │ │ Alerts  ││
│ │ [1.2 GB/s]  │ │ [890 MB/s]  │ │ [234]       │ │ [847]       │ │ [12]    ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 2: Traffic Trends                                                        │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ Network Traffic (Last 24 Hours)                                        │  │
│ │                                                                        │  │
│ │  GB/s                                                                  │  │
│ │  2.0│       ╭──────╮                    ╭─────╮                        │  │
│ │     │ ──────╯      ╰────────────────────╯     ╰────                    │  │
│ │  1.0│                                                                  │  │
│ │     │                                                                  │  │
│ │  0.0└─────────────────────────────────────────────────────►           │  │
│ │       00:00   06:00   12:00   18:00   24:00                            │  │
│ │                                                                        │  │
│ │  ── Inbound  ── Outbound  ── Blocked  --- Baseline                    │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 3: WAF Analysis                                                          │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ WAF Events by Attack Type       │ │ WAF Events by Target                 ││
│ │                                 │ │                                      ││
│ │ SQL Injection  █████████ 234   │ │ /api/users       ████████████ 156   ││
│ │ XSS            ███████ 189     │ │ /api/auth/login  ████████ 98        ││
│ │ Path Traversal ████ 89         │ │ /api/data        █████ 67            ││
│ │ Command Inj    ██ 45           │ │ /api/search      ████ 56             ││
│ │ Other          ███ 67          │ │ Other            ██ 34               ││
│ └─────────────────────────────────┘ └─────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 4: Firewall & DDoS                                                       │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ Firewall Rule Hits              │ │ DDoS Mitigation Status              ││
│ │                                 │ │                                      ││
│ │ ALLOW rules    █████████ 12.5K │ │ Status: ✓ Normal                     ││
│ │ DENY rules     ████ 234        │ │ Current Traffic: 1.2 GB/s            ││
│ │ Rate Limited   ██ 89           │ │ Baseline: 1.0 GB/s                   ││
│ │ Geo Blocked    █ 45            │ │ Threshold: 5.0 GB/s                  ││
│ │                                 │ │                                      ││
│ │ Top Denied:                     │ │ [████████░░░░░░░░] 24% of threshold ││
│ │ - Port Scan (67%)               │ │                                      ││
│ │ - Malware Sig (23%)             │ │ Last DDoS: 2025-11-15 (Mitigated)   ││
│ │ - Policy (10%)                  │ │                                      ││
│ └─────────────────────────────────┘ └─────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 5: IDS/IPS Events                                                        │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ IDS/IPS Event Log                                                      │  │
│ │                                                                        │  │
│ │ Time     | Signature         | Source         | Dest        | Action  │  │
│ │ ─────────┼───────────────────┼────────────────┼─────────────┼───────  │  │
│ │ 10:23:45 | CVE-2024-1234     | 203.0.113.45   | 10.0.1.50   | Blocked │  │
│ │ 10:15:22 | Suspicious DNS    | 10.0.2.100     | 8.8.8.8     | Alert   │  │
│ │ 09:58:11 | Port Scan         | 198.51.100.23  | 10.0.0.0/16 | Blocked │  │
│ │ 09:45:03 | C2 Communication  | 10.0.3.50      | 192.0.2.67  | Blocked │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Application Security Dashboard

### 6.1 概要

| 項目 | 内容 |
|------|------|
| ダッシュボードID | `app-security` |
| 対象者 | App Engineer, SOC Analyst |
| 更新頻度 | 10秒 |
| データ保持期間 | 30日 |

### 6.2 レイアウト設計

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Application Security Dashboard                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 1: Application Health                                                    │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│
│ │ Uptime      │ │ Error Rate  │ │ P95 Latency │ │ Active      │ │ API     ││
│ │ [99.99%]    │ │ [0.12%]     │ │ [245ms]     │ │ Users [987] │ │ Calls/s ││
│ │ ▲ SLA: 99.9%│ │ ✓ < 1%      │ │ ✓ < 500ms   │ │             │ │ [1,234] ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 2: API Security                                                          │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ API Request/Error Rate (Last 24 Hours)                                 │  │
│ │                                                                        │  │
│ │  Req/s                                                       Errors   │  │
│ │  2000│    ╭─────────╮                      ╭──╮            │50       │  │
│ │      │ ───╯         ╰──────────────────────╯  ╰──          │         │  │
│ │  1000│                                                     │25       │  │
│ │      │                                                     │         │  │
│ │     0└─────────────────────────────────────────────────────│0        │  │
│ │        00:00   06:00   12:00   18:00   24:00                          │  │
│ │                                                                        │  │
│ │  ── Requests  ── 4xx Errors  ── 5xx Errors                            │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 3: Data Access Patterns                                                  │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ Data Access by Type             │ │ Sensitive Data Access               ││
│ │                                 │ │                                      ││
│ │ Read     ██████████████ 8,234  │ │ PII Access    ████████ 234           ││
│ │ Create   ████████ 3,456        │ │ Financial     ██████ 156             ││
│ │ Update   ██████ 2,123          │ │ Health        ████ 89                ││
│ │ Delete   █ 234                 │ │ Confidential  ██ 45                  ││
│ │                                 │ │                                      ││
│ │ ⚠ Delete spike: +50% vs avg   │ │ ⚠ High-volume PII access detected   ││
│ └─────────────────────────────────┘ └─────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 4: Input Validation & Rate Limiting                                      │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ Input Validation Failures       │ │ Rate Limiting Events                ││
│ │                                 │ │                                      ││
│ │ XSS Filter      ████████ 156   │ │ API Rate Limit  █████████ 234       ││
│ │ SQL Pattern     ██████ 98      │ │ Login Throttle  ██████ 156          ││
│ │ Path Traversal  ███ 45         │ │ Export Limit    ██ 45               ││
│ │ Invalid Format  █████ 89       │ │ Search Limit    █ 23                ││
│ │                                 │ │                                      ││
│ │ [View Details]                  │ │ [View Details]                       ││
│ └─────────────────────────────────┘ └─────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 5: Security Events Log                                                   │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ Application Security Events                                            │  │
│ │                                                                        │  │
│ │ Time     | Event Type           | User    | Endpoint    | Details     │  │
│ │ ─────────┼──────────────────────┼─────────┼─────────────┼───────────  │  │
│ │ 10:23:45 | Data Export (Large)  | user123 | /api/export | 1,500 rows  │  │
│ │ 10:15:22 | Rate Limit Hit       | user456 | /api/search | 100 req/min │  │
│ │ 09:58:11 | Validation Failure   | anon    | /api/users  | XSS pattern │  │
│ │ 09:45:03 | Privilege Escalation | user789 | /api/admin  | Blocked     │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Infrastructure Health Dashboard

### 7.1 概要

| 項目 | 内容 |
|------|------|
| ダッシュボードID | `infra-health` |
| 対象者 | SRE, Network Engineer |
| 更新頻度 | 30秒 |
| データ保持期間 | 30日 |

### 7.2 主要パネル

```yaml
panels:
  # Row 1: Kubernetes Overview
  - title: "Cluster Status"
    type: stat
    query: |
      kube_node_status_condition{condition="Ready",status="true"}

  - title: "Pod Health"
    type: gauge
    query: |
      sum(kube_pod_status_phase{phase="Running"})
      /
      sum(kube_pod_status_phase) * 100

  - title: "Pod Restarts"
    type: stat
    query: |
      sum(increase(kube_pod_container_status_restarts_total[1h]))
    thresholds:
      - value: 0
        color: green
      - value: 3
        color: yellow
      - value: 10
        color: red

  # Row 2: Resource Utilization
  - title: "CPU Utilization"
    type: gauge
    query: |
      avg(node_cpu_utilization{application="lifeplan-navigator"}) * 100

  - title: "Memory Utilization"
    type: gauge
    query: |
      avg(node_memory_utilization{application="lifeplan-navigator"}) * 100

  - title: "Disk Utilization"
    type: gauge
    query: |
      avg(node_disk_utilization{application="lifeplan-navigator"}) * 100

  # Row 3: Database Health
  - title: "DB Connection Pool"
    type: gauge
    query: |
      pg_stat_activity_count{datname="lifeplan"}
      /
      pg_settings_max_connections * 100

  - title: "Replication Lag"
    type: stat
    query: |
      pg_replication_lag_seconds{application="lifeplan-navigator"}
    unit: seconds
    thresholds:
      - value: 0
        color: green
      - value: 5
        color: yellow
      - value: 30
        color: red
```

---

## 8. Threat Intelligence Dashboard

### 8.1 概要

| 項目 | 内容 |
|------|------|
| ダッシュボードID | `threat-intel` |
| 対象者 | CTI Analyst, SOC Analyst |
| 更新頻度 | 5分 |
| データ保持期間 | 365日 |

### 8.2 レイアウト

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Threat Intelligence Dashboard                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 1: IOC Overview                                                          │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│
│ │ Active IOCs │ │ Matched     │ │ New IOCs    │ │ Threat      │ │ Intel   ││
│ │ [12,456]    │ │ Today [34]  │ │ (24h) [567] │ │ Actors [23] │ │ Feeds   ││
│ │             │ │             │ │             │ │             │ │ [Active]││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 2: IOC Matches                                                           │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ IOC Matches by Type             │ │ IOC Matches Timeline                ││
│ │                                 │ │                                      ││
│ │ IP Address    █████████ 156    │ │    ▲                                 ││
│ │ Domain        ███████ 98       │ │ 50│    ╭─╮     ╭──╮                  ││
│ │ Hash (MD5)    ████ 67          │ │   │───╯ ╰─────╯  ╰───               ││
│ │ URL           ███ 45           │ │  0└─────────────────────►           ││
│ │ Email         █ 12             │ │     Mon Tue Wed Thu Fri              ││
│ └─────────────────────────────────┘ └─────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 3: Threat Actor Activity                                                 │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ Active Threat Campaigns Targeting Our Industry                         │  │
│ │                                                                        │  │
│ │ Campaign      | Actor       | Target     | TTPs       | Status        │  │
│ │ ──────────────┼─────────────┼────────────┼────────────┼─────────────  │  │
│ │ Operation X   | APT28       | FinTech    | T1566,T1078| ⚠ Active      │  │
│ │ DarkCloud     | FIN7        | Financial  | T1059,T1486| ⚠ Active      │  │
│ │ PhishKing     | Unknown     | Generic    | T1566      | ✓ Mitigated   │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 4: MITRE ATT&CK Coverage                                                 │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ Detection Coverage by MITRE ATT&CK Tactic                              │  │
│ │                                                                        │  │
│ │ Initial Access      ████████████████░░░░ 80%                          │  │
│ │ Execution           ███████████████░░░░░ 75%                          │  │
│ │ Persistence         ████████████████░░░░ 80%                          │  │
│ │ Privilege Escalation██████████████░░░░░░ 70%                          │  │
│ │ Defense Evasion     ██████████░░░░░░░░░░ 50%                          │  │
│ │ Credential Access   ████████████████░░░░ 80%                          │  │
│ │ Discovery           ███████████████░░░░░ 75%                          │  │
│ │ Lateral Movement    ██████████░░░░░░░░░░ 50%                          │  │
│ │ Collection          ████████████████░░░░ 80%                          │  │
│ │ Exfiltration        ████████████████░░░░ 80%                          │  │
│ │                                                                        │  │
│ │ Overall Coverage: 72% | Target: 85% by Q2 2026                        │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. ダッシュボード変数設定

### 9.1 共通変数

```yaml
variables:
  - name: environment
    type: query
    datasource: prometheus
    query: label_values(up, environment)
    options:
      - production
      - staging
      - development
    current: production

  - name: application
    type: constant
    value: lifeplan-navigator

  - name: timerange
    type: interval
    options:
      - 5m
      - 15m
      - 1h
      - 6h
      - 24h
      - 7d
    current: 1h

  - name: severity
    type: custom
    options:
      - all
      - critical
      - high
      - medium
      - low
    current: all
    multi: true
```

### 9.2 アラート通知設定

```yaml
alert_notifications:
  - name: "Critical Alert Channel"
    type: slack
    settings:
      url: "${SLACK_WEBHOOK_CRITICAL}"
      channel: "#soc-alerts-critical"
      mention: "@here"
    frequency: 0  # Immediate

  - name: "High Alert Channel"
    type: slack
    settings:
      url: "${SLACK_WEBHOOK_HIGH}"
      channel: "#soc-alerts-high"
    frequency: 60  # 1 minute

  - name: "PagerDuty Critical"
    type: pagerduty
    settings:
      integrationKey: "${PAGERDUTY_KEY}"
      severity: critical
    frequency: 0

  - name: "Email Digest"
    type: email
    settings:
      addresses:
        - soc-team@example.com
        - security-team@example.com
    frequency: 3600  # 1 hour digest
```

---

## 10. アクセス制御

### 10.1 ロールベースアクセス

| ダッシュボード | Viewer | Editor | Admin |
|--------------|--------|--------|-------|
| Executive Summary | CISO, CEO, CFO | - | Security Admin |
| SOC Overview | SOC Team, CSIRT | SOC Lead | Security Admin |
| Auth Monitor | SOC Team, CSIRT | SOC Lead | Security Admin |
| Network Security | Network Team, SOC | Network Lead | Security Admin |
| App Security | Dev Team, SOC | Dev Lead | Security Admin |
| Infra Health | SRE, SOC | SRE Lead | Security Admin |
| Threat Intel | CTI, SOC | CTI Lead | Security Admin |

### 10.2 フォルダ構成

```
Grafana Folders:
├── Executive/
│   ├── Executive Security Summary
│   └── Risk Overview
├── SOC/
│   ├── SOC Overview
│   ├── Authentication Monitor
│   └── Security Incidents
├── Network/
│   └── Network Security
├── Application/
│   └── Application Security
├── Infrastructure/
│   └── Infrastructure Health
└── Intelligence/
    └── Threat Intelligence
```

---

## 11. 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| LifePlan_Navigator_SOC_Monitoring_Design.md | SOC監視設計書 |
| LifePlan_Navigator_Log_Management.md | ログ管理設計書 |
| LifePlan_Navigator_Detection_Rules.md | 検知ルール一覧 |
| LifePlan_Navigator_Alert_Rules.md | アラートルール一覧 |
| LifePlan_Navigator_SOC_Runbook.md | SOC運用手順書 |

---

## 12. 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2025-12-11 | 初版作成 | SOC Analyst |

---

## 13. 承認

| 役割 | 氏名 | 日付 | 署名 |
|------|------|------|------|
| 作成者 | SOC Analyst | 2025-12-11 | |
| レビュー | CSIRT Team Leader | | |
| レビュー | CTI Analyst | | |
| レビュー | Network Engineer | | |
| 承認 | CISO | | |
