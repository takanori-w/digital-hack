# LifePlan Navigator 検知ルール一覧

| 項目 | 内容 |
|------|------|
| ドキュメント名 | 検知ルール一覧 |
| バージョン | 1.0 |
| 作成日 | 2025-12-11 |
| 作成者 | SOC Analyst |
| レビュー | CSIRT Team Leader, CTI Analyst, Network Engineer |
| 分類 | Confidential |

---

## 1. 概要

### 1.1 目的
本ドキュメントは、LifePlan Navigator における脅威検知ルールを定義する。MITRE ATT&CK フレームワークに基づき、攻撃の各段階を検知可能なルールセットを構築する。

### 1.2 検知ルール設計方針
- MITRE ATT&CK マッピングによる体系的カバレッジ
- 誤検知率の最小化（チューニング基準の明確化）
- 検知から対応までの自動化推進
- 定期的なルールレビューと更新

### 1.3 MITRE ATT&CK カバレッジ

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MITRE ATT&CK カバレッジマップ                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Initial      Execution   Persistence  Privilege   Defense    Credential│
│  Access                               Escalation   Evasion    Access    │
│  ████████     ██████░░    ████████    ██████░░    ████░░░░   ████████  │
│   (80%)       (75%)        (80%)       (75%)       (50%)      (80%)    │
│                                                                         │
│  Discovery   Lateral     Collection  Command &   Exfiltration  Impact  │
│              Movement                 Control                           │
│  ██████░░    ████░░░░    ████████    ██████░░    ████████    ████░░░░  │
│   (75%)      (50%)        (80%)       (75%)       (80%)       (50%)    │
│                                                                         │
│  ████████ = 高カバレッジ (>75%)                                          │
│  ██████░░ = 中カバレッジ (50-75%)                                        │
│  ████░░░░ = 要改善 (<50%)                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 認証・アクセス関連検知ルール

### 2.1 ブルートフォース検知

#### DET-AUTH-001: ログイン失敗連続検知（同一IP）
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-AUTH-001 |
| **ルール名** | Brute Force Attack - Same IP |
| **重要度** | High |
| **MITRE ATT&CK** | T1110.001 - Brute Force: Password Guessing |
| **データソース** | 認証ログ (Keycloak) |
| **検知条件** | 同一IPから5回以上のログイン失敗が5分以内に発生 |
| **除外条件** | 内部ネットワーク (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) |
| **対応アクション** | IPアドレス一時ブロック (30分)、SOCアラート |

**Splunk SPL:**
```spl
index=lifeplan_security sourcetype=auth_log action=login_failure
| bucket _time span=5m
| stats count by src_ip, _time
| where count >= 5
| lookup geoip_lookup ip as src_ip OUTPUT country, city
| table _time, src_ip, country, city, count
```

**Sigma ルール:**
```yaml
title: Brute Force Attack Detection - Same IP
id: det-auth-001
status: production
description: Detects multiple failed login attempts from same IP
logsource:
  product: keycloak
  service: authentication
detection:
  selection:
    action: login_failure
  timeframe: 5m
  condition: selection | count(src_ip) > 5
level: high
tags:
  - attack.credential_access
  - attack.t1110.001
```

---

#### DET-AUTH-002: ログイン失敗連続検知（同一アカウント）
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-AUTH-002 |
| **ルール名** | Brute Force Attack - Same Account |
| **重要度** | Medium |
| **MITRE ATT&CK** | T1110.001 - Brute Force: Password Guessing |
| **データソース** | 認証ログ (Keycloak) |
| **検知条件** | 同一アカウントへ3回以上のログイン失敗が5分以内に発生 |
| **除外条件** | テストアカウント (test_*) |
| **対応アクション** | アカウントロック（15分）、ユーザー通知 |

**Splunk SPL:**
```spl
index=lifeplan_security sourcetype=auth_log action=login_failure
| bucket _time span=5m
| stats count, values(src_ip) as source_ips by user, _time
| where count >= 3
| table _time, user, source_ips, count
```

---

#### DET-AUTH-003: パスワードスプレー攻撃検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-AUTH-003 |
| **ルール名** | Password Spray Attack |
| **重要度** | High |
| **MITRE ATT&CK** | T1110.003 - Brute Force: Password Spraying |
| **データソース** | 認証ログ (Keycloak) |
| **検知条件** | 同一IPから10以上の異なるアカウントへのログイン失敗が10分以内に発生 |
| **除外条件** | SSO連携システム |
| **対応アクション** | IPアドレスブロック、CSIRT通知 |

**Splunk SPL:**
```spl
index=lifeplan_security sourcetype=auth_log action=login_failure
| bucket _time span=10m
| stats dc(user) as unique_users, count as total_attempts by src_ip, _time
| where unique_users >= 10
| table _time, src_ip, unique_users, total_attempts
```

---

### 2.2 不正アクセス検知

#### DET-AUTH-004: 異常な時間帯のログイン
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-AUTH-004 |
| **ルール名** | Login at Unusual Hours |
| **重要度** | Medium |
| **MITRE ATT&CK** | T1078 - Valid Accounts |
| **データソース** | 認証ログ (Keycloak) |
| **検知条件** | ユーザーの通常ログイン時間帯から外れたログイン（深夜2-5時など） |
| **除外条件** | シフト勤務者、管理者アカウント |
| **対応アクション** | アラート生成、セッション監視強化 |

**Splunk SPL:**
```spl
index=lifeplan_security sourcetype=auth_log action=login_success
| eval hour=strftime(_time, "%H")
| where hour >= 2 AND hour <= 5
| lookup user_profile user OUTPUT normal_hours, timezone
| where NOT match(normal_hours, hour)
| table _time, user, src_ip, hour, normal_hours
```

---

#### DET-AUTH-005: 異常な地理的位置からのログイン
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-AUTH-005 |
| **ルール名** | Login from Unusual Geolocation |
| **重要度** | High |
| **MITRE ATT&CK** | T1078 - Valid Accounts |
| **データソース** | 認証ログ (Keycloak) |
| **検知条件** | ユーザーの過去のログイン履歴にない国/地域からのログイン |
| **除外条件** | VPN使用時（承認済みVPN IP） |
| **対応アクション** | 追加認証要求、セッション無効化 |

**Splunk SPL:**
```spl
index=lifeplan_security sourcetype=auth_log action=login_success
| lookup geoip_lookup ip as src_ip OUTPUT country
| lookup user_login_history user OUTPUT known_countries
| where NOT match(known_countries, country)
| table _time, user, src_ip, country, known_countries
```

---

#### DET-AUTH-006: 不可能な移動検知 (Impossible Travel)
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-AUTH-006 |
| **ルール名** | Impossible Travel Detection |
| **重要度** | Critical |
| **MITRE ATT&CK** | T1078.004 - Valid Accounts: Cloud Accounts |
| **データソース** | 認証ログ (Keycloak) |
| **検知条件** | 物理的に不可能な速度での地理的移動（例：1時間以内に東京→ニューヨーク） |
| **除外条件** | VPN使用時 |
| **対応アクション** | 即座にセッション無効化、ユーザー通知、CSIRT通知 |

**Splunk SPL:**
```spl
index=lifeplan_security sourcetype=auth_log action=login_success
| sort user, _time
| streamstats current=t last(_time) as prev_time, last(src_ip) as prev_ip by user
| eval time_diff_hours = (_time - prev_time) / 3600
| lookup geoip_lookup ip as src_ip OUTPUT lat as curr_lat, lon as curr_lon
| lookup geoip_lookup ip as prev_ip OUTPUT lat as prev_lat, lon as prev_lon
| eval distance_km = round(6371 * acos(sin(curr_lat*3.14159/180)*sin(prev_lat*3.14159/180) + cos(curr_lat*3.14159/180)*cos(prev_lat*3.14159/180)*cos((curr_lon-prev_lon)*3.14159/180)), 0)
| eval speed_kmh = distance_km / time_diff_hours
| where speed_kmh > 1000 AND time_diff_hours > 0
| table _time, user, prev_ip, src_ip, time_diff_hours, distance_km, speed_kmh
```

---

### 2.3 セッション異常検知

#### DET-AUTH-007: 同時セッション異常
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-AUTH-007 |
| **ルール名** | Concurrent Session Anomaly |
| **重要度** | High |
| **MITRE ATT&CK** | T1550 - Use Alternate Authentication Material |
| **データソース** | セッションログ |
| **検知条件** | 同一ユーザーの異なるIPからの同時アクティブセッション |
| **除外条件** | モバイル/デスクトップの正常な同時使用パターン |
| **対応アクション** | ユーザー確認、古いセッション終了 |

**Splunk SPL:**
```spl
index=lifeplan_security sourcetype=session_log event_type=session_active
| bucket _time span=1m
| stats dc(src_ip) as unique_ips, values(src_ip) as ip_list by user, _time
| where unique_ips > 1
| table _time, user, unique_ips, ip_list
```

---

#### DET-AUTH-008: セッションハイジャック検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-AUTH-008 |
| **ルール名** | Session Hijacking Detection |
| **重要度** | Critical |
| **MITRE ATT&CK** | T1539 - Steal Web Session Cookie |
| **データソース** | アクセスログ、セッションログ |
| **検知条件** | セッション中にUser-AgentまたはIPアドレスが急変 |
| **除外条件** | モバイルネットワーク（IP変動許容） |
| **対応アクション** | 即座にセッション無効化、再認証要求 |

**Splunk SPL:**
```spl
index=lifeplan_app sourcetype=access_log
| sort session_id, _time
| streamstats current=t last(src_ip) as prev_ip, last(user_agent) as prev_ua by session_id
| where (src_ip != prev_ip OR user_agent != prev_ua) AND isnotnull(prev_ip)
| table _time, session_id, user, prev_ip, src_ip, prev_ua, user_agent
```

---

## 3. データアクセス・漏洩検知ルール

### 3.1 大量データ取得検知

#### DET-DATA-001: 大量データエクスポート検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-DATA-001 |
| **ルール名** | Mass Data Export Detection |
| **重要度** | Critical |
| **MITRE ATT&CK** | T1567 - Exfiltration Over Web Service |
| **データソース** | 監査ログ、APIログ |
| **検知条件** | 同一ユーザーが1時間以内に1000件以上のレコードをエクスポート |
| **除外条件** | 承認済みバッチ処理、管理者操作（事前申請） |
| **対応アクション** | エクスポート機能一時停止、CSIRT通知 |

**Splunk SPL:**
```spl
index=lifeplan_audit sourcetype=audit_log action=export
| bucket _time span=1h
| stats sum(record_count) as total_exported by user, _time
| where total_exported >= 1000
| table _time, user, total_exported
```

---

#### DET-DATA-002: 異常なデータアクセスパターン
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-DATA-002 |
| **ルール名** | Anomalous Data Access Pattern |
| **重要度** | High |
| **MITRE ATT&CK** | T1530 - Data from Cloud Storage Object |
| **データソース** | 監査ログ |
| **検知条件** | ユーザーの通常アクセス量の3倍以上のデータアクセス |
| **除外条件** | 新規ユーザー（ベースライン未確立） |
| **対応アクション** | アクセス監視強化、ユーザー確認 |

**Splunk SPL:**
```spl
index=lifeplan_audit sourcetype=audit_log action=read
| bucket _time span=1h
| stats count as current_access by user, _time
| lookup user_baseline user OUTPUT avg_hourly_access, stddev_access
| eval threshold = avg_hourly_access + (3 * stddev_access)
| where current_access > threshold
| table _time, user, current_access, avg_hourly_access, threshold
```

---

#### DET-DATA-003: 他ユーザーデータへの不正アクセス
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-DATA-003 |
| **ルール名** | Unauthorized Access to Other User's Data |
| **重要度** | Critical |
| **MITRE ATT&CK** | T1213 - Data from Information Repositories |
| **データソース** | 監査ログ |
| **検知条件** | ユーザーが自身以外のユーザーのデータにアクセス（管理者除く） |
| **除外条件** | 管理者権限、共有設定データ |
| **対応アクション** | 即座にセッション終了、CSIRT通知 |

**Splunk SPL:**
```spl
index=lifeplan_audit sourcetype=audit_log
| where actor_user_id != target_owner_id
| lookup user_role user_id as actor_user_id OUTPUT role
| where role != "admin" AND role != "support"
| table _time, actor_user_id, target_owner_id, resource_type, action
```

---

### 3.2 データ改ざん検知

#### DET-DATA-004: 大量データ削除検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-DATA-004 |
| **ルール名** | Mass Data Deletion Detection |
| **重要度** | Critical |
| **MITRE ATT&CK** | T1485 - Data Destruction |
| **データソース** | 監査ログ、データベースログ |
| **検知条件** | 1時間以内に100件以上のレコード削除 |
| **除外条件** | 承認済みデータクリーンアップ処理 |
| **対応アクション** | 削除操作一時停止、バックアップ確認、CSIRT通知 |

**Splunk SPL:**
```spl
index=lifeplan_audit sourcetype=audit_log action=delete
| bucket _time span=1h
| stats count as delete_count by user, _time
| where delete_count >= 100
| table _time, user, delete_count
```

---

#### DET-DATA-005: 重要設定変更検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-DATA-005 |
| **ルール名** | Critical Configuration Change |
| **重要度** | High |
| **MITRE ATT&CK** | T1562.001 - Impair Defenses: Disable or Modify Tools |
| **データソース** | 監査ログ、CloudTrail |
| **検知条件** | セキュリティ関連設定の変更（MFA無効化、パスワードポリシー変更等） |
| **除外条件** | 変更管理プロセス承認済み |
| **対応アクション** | 変更ロールバック検討、CISO通知 |

**Splunk SPL:**
```spl
index=lifeplan_audit sourcetype=audit_log action IN (config_change, setting_update)
| where resource_type IN ("security_policy", "mfa_settings", "password_policy", "access_control")
| table _time, user, resource_type, action, old_value, new_value
```

---

## 4. ネットワーク攻撃検知ルール

### 4.1 Webアプリケーション攻撃

#### DET-WEB-001: SQLインジェクション検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-WEB-001 |
| **ルール名** | SQL Injection Attack Detection |
| **重要度** | Critical |
| **MITRE ATT&CK** | T1190 - Exploit Public-Facing Application |
| **データソース** | WAFログ、アクセスログ |
| **検知条件** | SQLインジェクションパターンの検出 |
| **除外条件** | なし |
| **対応アクション** | IPブロック、攻撃元調査、脆弱性確認 |

**Splunk SPL:**
```spl
index=lifeplan_security sourcetype=waf_log attack_type="sql_injection"
OR
index=lifeplan_app sourcetype=access_log
| regex uri_query="(?i)(union\s+select|or\s+1\s*=\s*1|'\s*or\s*'|;\s*drop\s+table|--\s*$|/\*|\*/)"
| table _time, src_ip, uri_path, uri_query, attack_type
```

**WAF ルール (ModSecurity):**
```conf
SecRule REQUEST_URI|ARGS|ARGS_NAMES "@detectSQLi" \
    "id:1001,\
    phase:2,\
    block,\
    capture,\
    t:none,t:urlDecodeUni,t:lowercase,\
    msg:'SQL Injection Attack Detected',\
    logdata:'Matched Data: %{TX.0}',\
    tag:'attack-sqli',\
    tag:'OWASP_CRS/WEB_ATTACK/SQL_INJECTION',\
    severity:'CRITICAL'"
```

---

#### DET-WEB-002: クロスサイトスクリプティング (XSS) 検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-WEB-002 |
| **ルール名** | Cross-Site Scripting (XSS) Attack Detection |
| **重要度** | High |
| **MITRE ATT&CK** | T1189 - Drive-by Compromise |
| **データソース** | WAFログ、アクセスログ |
| **検知条件** | XSSパターンの検出 |
| **除外条件** | なし |
| **対応アクション** | リクエストブロック、攻撃元調査 |

**Splunk SPL:**
```spl
index=lifeplan_security sourcetype=waf_log attack_type="xss"
OR
index=lifeplan_app sourcetype=access_log
| regex uri_query="(?i)(<script|javascript:|on\w+\s*=|<img[^>]+onerror)"
| table _time, src_ip, uri_path, uri_query, attack_type
```

---

#### DET-WEB-003: パストラバーサル検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-WEB-003 |
| **ルール名** | Path Traversal Attack Detection |
| **重要度** | High |
| **MITRE ATT&CK** | T1083 - File and Directory Discovery |
| **データソース** | WAFログ、アクセスログ |
| **検知条件** | ディレクトリトラバーサルパターンの検出 |
| **除外条件** | なし |
| **対応アクション** | リクエストブロック、脆弱性確認 |

**Splunk SPL:**
```spl
index=lifeplan_app sourcetype=access_log
| regex uri_path="(\.\./|\.\.\\|%2e%2e%2f|%2e%2e/|\.%2e/|%2e\./)+"
| table _time, src_ip, uri_path
```

---

#### DET-WEB-004: コマンドインジェクション検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-WEB-004 |
| **ルール名** | Command Injection Attack Detection |
| **重要度** | Critical |
| **MITRE ATT&CK** | T1059 - Command and Scripting Interpreter |
| **データソース** | WAFログ、アクセスログ |
| **検知条件** | OSコマンドインジェクションパターンの検出 |
| **除外条件** | なし |
| **対応アクション** | 即座にIPブロック、CSIRT通知 |

**Splunk SPL:**
```spl
index=lifeplan_app sourcetype=access_log
| regex uri_query="(?i)(;|\||`|\$\(|&&).*?(cat|ls|pwd|whoami|id|wget|curl|nc|bash|sh|python|perl|ruby)"
| table _time, src_ip, uri_path, uri_query
```

---

### 4.2 DDoS・DoS検知

#### DET-NET-001: DDoS攻撃検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-NET-001 |
| **ルール名** | DDoS Attack Detection |
| **重要度** | Critical |
| **MITRE ATT&CK** | T1498 - Network Denial of Service |
| **データソース** | ネットワークログ、WAFログ |
| **検知条件** | 異常なトラフィック量の急増（ベースライン比5倍以上） |
| **除外条件** | 予告済みの高負荷（キャンペーン等） |
| **対応アクション** | CDN/WAFでのレート制限強化、CSIRT通知 |

**Splunk SPL:**
```spl
index=lifeplan_network sourcetype=alb_log
| bucket _time span=1m
| stats count as request_count by _time
| streamstats avg(request_count) as baseline, stdev(request_count) as std_dev
| eval threshold = baseline + (5 * std_dev)
| where request_count > threshold AND request_count > 10000
| table _time, request_count, baseline, threshold
```

---

#### DET-NET-002: アプリケーションレイヤDDoS検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-NET-002 |
| **ルール名** | Application Layer DDoS Detection |
| **重要度** | High |
| **MITRE ATT&CK** | T1499 - Endpoint Denial of Service |
| **データソース** | アクセスログ |
| **検知条件** | 特定エンドポイントへの異常集中アクセス |
| **除外条件** | 静的コンテンツへのアクセス |
| **対応アクション** | エンドポイント別レート制限、CAPTCHAチャレンジ |

**Splunk SPL:**
```spl
index=lifeplan_app sourcetype=access_log
| bucket _time span=1m
| stats count as request_count by uri_path, _time
| where request_count > 1000
| table _time, uri_path, request_count
```

---

### 4.3 スキャン・偵察検知

#### DET-RECON-001: ポートスキャン検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-RECON-001 |
| **ルール名** | Port Scan Detection |
| **重要度** | Medium |
| **MITRE ATT&CK** | T1046 - Network Service Scanning |
| **データソース** | VPCフローログ、ファイアウォールログ |
| **検知条件** | 同一IPから10以上の異なるポートへの接続試行 |
| **除外条件** | 内部監視システム、承認済みスキャナ |
| **対応アクション** | IP監視、潜在的攻撃者としてマーク |

**Splunk SPL:**
```spl
index=lifeplan_network sourcetype=vpc_flow action=REJECT
| bucket _time span=5m
| stats dc(dest_port) as unique_ports by src_ip, _time
| where unique_ports >= 10
| table _time, src_ip, unique_ports
```

---

#### DET-RECON-002: Webアプリケーションスキャン検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-RECON-002 |
| **ルール名** | Web Application Scan Detection |
| **重要度** | Medium |
| **MITRE ATT&CK** | T1595.002 - Active Scanning: Vulnerability Scanning |
| **データソース** | アクセスログ、WAFログ |
| **検知条件** | 既知のスキャナUser-Agent、異常なリクエストパターン |
| **除外条件** | 承認済み脆弱性スキャン |
| **対応アクション** | アクセス制限、脅威インテリジェンス連携 |

**Splunk SPL:**
```spl
index=lifeplan_app sourcetype=access_log
| regex user_agent="(?i)(nikto|sqlmap|nmap|dirbuster|gobuster|wpscan|acunetix|nessus|burp|zap)"
| stats count by src_ip, user_agent
| table src_ip, user_agent, count
```

---

## 5. マルウェア・不正活動検知ルール

### 5.1 マルウェア通信検知

#### DET-MAL-001: C2通信検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-MAL-001 |
| **ルール名** | Command and Control Communication Detection |
| **重要度** | Critical |
| **MITRE ATT&CK** | T1071 - Application Layer Protocol |
| **データソース** | DNSログ、ネットワークログ |
| **検知条件** | 既知のC2ドメイン/IPへの通信、DGA（ドメイン生成アルゴリズム）パターン |
| **除外条件** | なし |
| **対応アクション** | 通信遮断、感染端末隔離、CSIRT通知 |

**Splunk SPL:**
```spl
index=lifeplan_network sourcetype=dns_log
| lookup threat_intel_domains domain OUTPUT threat_type, confidence
| where isnotnull(threat_type)
| table _time, src_ip, domain, threat_type, confidence
```

---

#### DET-MAL-002: DGAドメイン検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-MAL-002 |
| **ルール名** | DGA Domain Detection |
| **重要度** | High |
| **MITRE ATT&CK** | T1568.002 - Dynamic Resolution: Domain Generation Algorithms |
| **データソース** | DNSログ |
| **検知条件** | 高エントロピードメイン、ランダム文字列パターン |
| **除外条件** | CDNドメイン、既知の正規ドメイン |
| **対応アクション** | DNS応答ブロック、感染調査 |

**Splunk SPL:**
```spl
index=lifeplan_network sourcetype=dns_log
| rex field=domain "^(?<subdomain>[^.]+)\."
| eval entropy=0
| foreach * [eval entropy=entropy+if(match(subdomain,"<<MATCHSEG>>"),1,0)]
| eval domain_length=len(subdomain)
| where domain_length > 15 AND entropy > 3.5
| table _time, src_ip, domain, entropy, domain_length
```

---

### 5.2 内部脅威検知

#### DET-INSIDER-001: 権限昇格検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-INSIDER-001 |
| **ルール名** | Privilege Escalation Detection |
| **重要度** | Critical |
| **MITRE ATT&CK** | T1078.003 - Valid Accounts: Local Accounts |
| **データソース** | 監査ログ、IAMログ |
| **検知条件** | 承認プロセス外での権限変更 |
| **除外条件** | 承認済み変更管理 |
| **対応アクション** | 変更ロールバック、調査開始 |

**Splunk SPL:**
```spl
index=lifeplan_audit sourcetype=audit_log action=role_change
| lookup change_requests user, timestamp OUTPUTNEW approval_status
| where isnull(approval_status) OR approval_status != "approved"
| table _time, user, old_role, new_role, actor
```

---

#### DET-INSIDER-002: 退職予定者の異常行動
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-INSIDER-002 |
| **ルール名** | Departing Employee Anomaly |
| **重要度** | High |
| **MITRE ATT&CK** | T1567 - Exfiltration Over Web Service |
| **データソース** | 監査ログ、HRシステム連携 |
| **検知条件** | 退職予定者による通常以上のデータアクセス/ダウンロード |
| **除外条件** | 引継ぎ文書化作業（承認済み） |
| **対応アクション** | アクセス監視強化、上長通知 |

**Splunk SPL:**
```spl
index=lifeplan_audit sourcetype=audit_log
| lookup hr_system user OUTPUT employment_status, termination_date
| where employment_status="pending_termination" OR termination_date < relative_time(now(), "+30d")
| stats count as access_count, sum(data_volume) as total_volume by user, _time
| lookup user_baseline user OUTPUT avg_daily_access
| where access_count > (avg_daily_access * 2)
| table _time, user, access_count, total_volume, termination_date
```

---

## 6. クラウド・インフラ検知ルール

### 6.1 AWS固有検知

#### DET-AWS-001: 不正なIAMポリシー変更
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-AWS-001 |
| **ルール名** | Unauthorized IAM Policy Change |
| **重要度** | Critical |
| **MITRE ATT&CK** | T1098 - Account Manipulation |
| **データソース** | CloudTrail |
| **検知条件** | 承認外のIAMポリシー作成/変更/削除 |
| **除外条件** | 変更管理承認済み、Infrastructure as Code実行 |
| **対応アクション** | 変更ロールバック、調査開始 |

**Splunk SPL:**
```spl
index=lifeplan_audit sourcetype=cloudtrail
eventName IN (CreatePolicy, DeletePolicy, AttachUserPolicy, DetachUserPolicy, PutUserPolicy, DeleteUserPolicy)
| lookup change_requests request_id OUTPUTNEW approval_status
| where isnull(approval_status)
| table _time, userIdentity.userName, eventName, requestParameters.policyArn
```

---

#### DET-AWS-002: セキュリティグループ開放検知
| 項目 | 内容 |
|------|------|
| **ルールID** | DET-AWS-002 |
| **ルール名** | Security Group Open to Internet |
| **重要度** | High |
| **MITRE ATT&CK** | T1562.007 - Impair Defenses: Disable or Modify Cloud Firewall |
| **データソース** | CloudTrail |
| **検知条件** | 0.0.0.0/0 を許可するセキュリティグループルール追加 |
| **除外条件** | ALB/NLBのセキュリティグループ |
| **対応アクション** | ルール削除、設定レビュー |

**Splunk SPL:**
```spl
index=lifeplan_audit sourcetype=cloudtrail eventName=AuthorizeSecurityGroupIngress
| spath path=requestParameters.ipPermissions{}.ipRanges{}.cidrIp OUTPUT cidr
| where cidr="0.0.0.0/0"
| table _time, userIdentity.userName, requestParameters.groupId, cidr
```

---

## 7. 検知ルール管理

### 7.1 ルール有効性レビュー

| レビュー項目 | 頻度 | 担当 |
|-------------|------|------|
| 誤検知率分析 | 週次 | SOC Analyst |
| 検知漏れ分析 | 月次 | CTI Analyst |
| 閾値チューニング | 月次 | SOC Analyst |
| 新規脅威対応 | 随時 | CTI Analyst |
| ルール棚卸し | 四半期 | CSIRT Team Leader |

### 7.2 ルールライフサイクル

```
[提案] → [レビュー] → [テスト] → [本番] → [監視] → [チューニング] → [廃止]
   │         │          │         │         │           │            │
   │         │          │         │         │           │            ↓
   │         │          │         │         │           │        [アーカイブ]
   │         │          │         │         │           │
   │         │          │         │         │           ↓
   │         │          │         │         │    [閾値調整/条件変更]
   │         │          │         │         │
   │         │          │         │         ↓
   │         │          │         │    [誤検知/検知漏れ分析]
   │         │          │         │
   │         │          │         ↓
   │         │          │    [本番環境適用]
   │         │          │
   │         │          ↓
   │         │    [ステージング検証]
   │         │
   │         ↓
   │    [セキュリティレビュー]
   │
   ↓
[新規脅威情報/インシデント知見]
```

---

## 8. 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| LifePlan_Navigator_SOC_Monitoring_Design.md | SOC監視設計書 |
| LifePlan_Navigator_Log_Management.md | ログ管理設計書 |
| LifePlan_Navigator_Alert_Rules.md | アラートルール一覧 |
| LifePlan_Navigator_SOC_Runbook.md | SOC運用手順書 |

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
