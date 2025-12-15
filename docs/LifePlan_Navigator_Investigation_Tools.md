# LifePlan Navigator インシデント調査ツールキット

| 項目 | 内容 |
|------|------|
| ドキュメント名 | インシデント調査ツールキット |
| バージョン | 1.0 |
| 作成日 | 2025-12-11 |
| 作成者 | CSIRT Engineer |
| レビュー | CSIRT Team Leader, SOC Analyst |
| 分類 | Confidential |

---

## 1. 概要

### 1.1 目的
本ドキュメントは、LifePlan Navigator のセキュリティインシデント調査に使用するツールキットを定義する。迅速かつ正確な調査を実施するための標準化されたツールと手順を提供する。

### 1.2 ツールキット構成

```
┌─────────────────────────────────────────────────────────────────────┐
│               インシデント調査ツールキット                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │   ログ分析   │  │  フォレンジック │  │  自動化      │                │
│  │   ツール     │  │   ツール     │  │  スクリプト   │                │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │
│         │                │                │                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   調査自動化プラットフォーム                  │  │
│  │                   (Velociraptor / SOAR)                     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. ログ分析ツール

### 2.1 監査ログ検索CLIツール

```bash
#!/bin/bash
# audit-log-search.sh - 監査ログ検索ツール
# Usage: ./audit-log-search.sh [options]

set -euo pipefail

# 設定
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-lifeplan}"
DB_USER="${DB_USER:-audit_reader}"
ES_HOST="${ES_HOST:-localhost:9200}"

# デフォルト値
START_DATE=""
END_DATE=""
EVENT_TYPE=""
USER_ID=""
IP_ADDRESS=""
OUTPUT_FORMAT="table"
LIMIT=100

# ヘルプ表示
show_help() {
    cat << EOF
監査ログ検索ツール - LifePlan Navigator

Usage: $0 [options]

Options:
    -s, --start-date DATE     開始日時 (ISO 8601形式)
    -e, --end-date DATE       終了日時 (ISO 8601形式)
    -t, --event-type TYPE     イベントタイプ (AUTH, DATA, ADMIN, SEC, SYS)
    -c, --event-code CODE     イベントコード
    -u, --user-id ID          ユーザーID
    -i, --ip-address IP       IPアドレス
    -f, --format FORMAT       出力形式 (table, json, csv)
    -l, --limit NUM           取得件数上限 (default: 100)
    -o, --output FILE         出力ファイル
    -h, --help                ヘルプ表示

Examples:
    # 過去24時間の認証失敗を検索
    $0 -s "$(date -d '24 hours ago' -Iseconds)" -c AUTH_LOGIN_FAILURE

    # 特定IPからのアクセスを検索
    $0 -i 192.168.1.100 -f json -o results.json

    # 特定ユーザーの全操作を検索
    $0 -u usr_12345 -s "2025-12-01" -e "2025-12-11" -f csv

EOF
}

# 引数パース
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--start-date) START_DATE="$2"; shift 2 ;;
            -e|--end-date) END_DATE="$2"; shift 2 ;;
            -t|--event-type) EVENT_TYPE="$2"; shift 2 ;;
            -c|--event-code) EVENT_CODE="$2"; shift 2 ;;
            -u|--user-id) USER_ID="$2"; shift 2 ;;
            -i|--ip-address) IP_ADDRESS="$2"; shift 2 ;;
            -f|--format) OUTPUT_FORMAT="$2"; shift 2 ;;
            -l|--limit) LIMIT="$2"; shift 2 ;;
            -o|--output) OUTPUT_FILE="$2"; shift 2 ;;
            -h|--help) show_help; exit 0 ;;
            *) echo "Unknown option: $1"; show_help; exit 1 ;;
        esac
    done
}

# SQLクエリ構築
build_sql_query() {
    local conditions=()

    if [[ -n "$START_DATE" ]]; then
        conditions+=("timestamp >= '$START_DATE'")
    fi

    if [[ -n "$END_DATE" ]]; then
        conditions+=("timestamp <= '$END_DATE'")
    fi

    if [[ -n "$EVENT_TYPE" ]]; then
        conditions+=("event_type = '$EVENT_TYPE'")
    fi

    if [[ -n "${EVENT_CODE:-}" ]]; then
        conditions+=("event_code = '$EVENT_CODE'")
    fi

    if [[ -n "$USER_ID" ]]; then
        conditions+=("actor_user_id = '$USER_ID'")
    fi

    if [[ -n "$IP_ADDRESS" ]]; then
        conditions+=("actor_ip_address = '$IP_ADDRESS'")
    fi

    local where_clause=""
    if [[ ${#conditions[@]} -gt 0 ]]; then
        where_clause="WHERE $(IFS=' AND '; echo "${conditions[*]}")"
    fi

    cat << EOF
SELECT
    id,
    timestamp,
    event_type,
    event_code,
    event_name,
    actor_user_id,
    actor_username,
    actor_ip_address,
    target_type,
    target_id,
    response_status_code,
    response_success,
    severity
FROM audit_logs
$where_clause
ORDER BY timestamp DESC
LIMIT $LIMIT;
EOF
}

# PostgreSQL検索実行
search_postgres() {
    local query=$(build_sql_query)

    case $OUTPUT_FORMAT in
        json)
            PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                -c "COPY ($query) TO STDOUT WITH (FORMAT CSV, HEADER)" | \
                python3 -c "import csv,json,sys; print(json.dumps([dict(r) for r in csv.DictReader(sys.stdin)]))"
            ;;
        csv)
            PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                -c "COPY ($query) TO STDOUT WITH (FORMAT CSV, HEADER)"
            ;;
        *)
            PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                -c "$query"
            ;;
    esac
}

# メイン処理
main() {
    parse_args "$@"

    echo "[*] Searching audit logs..."

    local result
    result=$(search_postgres)

    if [[ -n "${OUTPUT_FILE:-}" ]]; then
        echo "$result" > "$OUTPUT_FILE"
        echo "[*] Results saved to: $OUTPUT_FILE"
    else
        echo "$result"
    fi
}

main "$@"
```

### 2.2 ログ相関分析スクリプト

```python
#!/usr/bin/env python3
"""
log_correlator.py - ログ相関分析ツール
複数のログソースを統合し、攻撃パターンを検出
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Optional, Any
import hashlib

class LogCorrelator:
    """ログ相関分析エンジン"""

    def __init__(self):
        self.events: List[Dict[str, Any]] = []
        self.alerts: List[Dict[str, Any]] = []

    def load_audit_logs(self, filepath: str) -> None:
        """監査ログの読み込み"""
        with open(filepath, 'r') as f:
            logs = json.load(f)
            for log in logs:
                self.events.append({
                    'source': 'audit',
                    'timestamp': datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')),
                    'event_type': log.get('eventType'),
                    'event_code': log.get('eventCode'),
                    'user_id': log.get('actor', {}).get('userId'),
                    'ip_address': log.get('actor', {}).get('ipAddress'),
                    'success': log.get('response', {}).get('success'),
                    'raw': log
                })

    def load_web_logs(self, filepath: str) -> None:
        """Webサーバーログの読み込み"""
        with open(filepath, 'r') as f:
            for line in f:
                try:
                    log = json.loads(line)
                    self.events.append({
                        'source': 'web',
                        'timestamp': datetime.fromisoformat(log.get('@timestamp', '')),
                        'ip_address': log.get('remote_addr'),
                        'path': log.get('request_uri'),
                        'status': log.get('status'),
                        'user_agent': log.get('http_user_agent'),
                        'raw': log
                    })
                except (json.JSONDecodeError, ValueError):
                    continue

    def detect_brute_force(self, threshold: int = 5, window_minutes: int = 5) -> List[Dict]:
        """ブルートフォース攻撃の検出"""
        alerts = []
        auth_failures = defaultdict(list)

        for event in self.events:
            if event.get('event_code') == 'AUTH_LOGIN_FAILURE':
                ip = event.get('ip_address')
                auth_failures[ip].append(event['timestamp'])

        for ip, timestamps in auth_failures.items():
            timestamps.sort()
            for i, ts in enumerate(timestamps):
                window_end = ts + timedelta(minutes=window_minutes)
                count = sum(1 for t in timestamps[i:] if t <= window_end)
                if count >= threshold:
                    alerts.append({
                        'alert_type': 'BRUTE_FORCE_DETECTED',
                        'severity': 'HIGH',
                        'ip_address': ip,
                        'attempt_count': count,
                        'start_time': ts.isoformat(),
                        'window_minutes': window_minutes
                    })
                    break

        return alerts

    def detect_data_exfiltration(self, threshold_mb: float = 100) -> List[Dict]:
        """データ窃取の兆候検出"""
        alerts = []
        data_access = defaultdict(lambda: {'count': 0, 'total_size': 0})

        for event in self.events:
            if event.get('event_code', '').startswith('DATA_'):
                user_id = event.get('user_id')
                if user_id:
                    data_access[user_id]['count'] += 1
                    size = event.get('raw', {}).get('response', {}).get('dataSize', 0) or 0
                    data_access[user_id]['total_size'] += size

        for user_id, stats in data_access.items():
            total_mb = stats['total_size'] / (1024 * 1024)
            if total_mb >= threshold_mb:
                alerts.append({
                    'alert_type': 'POTENTIAL_DATA_EXFILTRATION',
                    'severity': 'HIGH',
                    'user_id': user_id,
                    'access_count': stats['count'],
                    'total_data_mb': round(total_mb, 2)
                })

        return alerts

    def detect_privilege_escalation(self) -> List[Dict]:
        """権限昇格の検出"""
        alerts = []

        for event in self.events:
            if event.get('event_code') == 'ADMIN_ROLE_CHANGE':
                raw = event.get('raw', {})
                target = raw.get('target', {})
                new_roles = target.get('newState', {}).get('roles', [])

                if 'admin' in new_roles or 'superadmin' in new_roles:
                    alerts.append({
                        'alert_type': 'PRIVILEGE_ESCALATION',
                        'severity': 'MEDIUM',
                        'actor_user_id': event.get('user_id'),
                        'target_user_id': target.get('id'),
                        'new_roles': new_roles,
                        'timestamp': event['timestamp'].isoformat()
                    })

        return alerts

    def detect_suspicious_access_patterns(self) -> List[Dict]:
        """不審なアクセスパターンの検出"""
        alerts = []
        user_ips = defaultdict(set)
        user_locations = defaultdict(set)

        for event in self.events:
            user_id = event.get('user_id')
            ip = event.get('ip_address')
            if user_id and ip:
                user_ips[user_id].add(ip)

                # 地理情報があれば収集
                geo = event.get('raw', {}).get('actor', {}).get('geoLocation', {})
                if geo.get('country'):
                    user_locations[user_id].add(geo.get('country'))

        # 複数国からのアクセス
        for user_id, countries in user_locations.items():
            if len(countries) > 1:
                alerts.append({
                    'alert_type': 'MULTI_COUNTRY_ACCESS',
                    'severity': 'MEDIUM',
                    'user_id': user_id,
                    'countries': list(countries)
                })

        # 多数のIPからのアクセス
        for user_id, ips in user_ips.items():
            if len(ips) > 10:
                alerts.append({
                    'alert_type': 'EXCESSIVE_IP_DIVERSITY',
                    'severity': 'LOW',
                    'user_id': user_id,
                    'unique_ips': len(ips)
                })

        return alerts

    def correlate_security_events(self) -> List[Dict]:
        """セキュリティイベントの相関分析"""
        alerts = []

        # 認証失敗後の成功を検出（アカウント侵害の可能性）
        ip_auth_events = defaultdict(list)

        for event in self.events:
            if event.get('event_code') in ['AUTH_LOGIN_SUCCESS', 'AUTH_LOGIN_FAILURE']:
                ip = event.get('ip_address')
                ip_auth_events[ip].append({
                    'success': event.get('success'),
                    'timestamp': event['timestamp'],
                    'user_id': event.get('user_id')
                })

        for ip, events in ip_auth_events.items():
            events.sort(key=lambda x: x['timestamp'])
            failure_count = 0

            for i, evt in enumerate(events):
                if not evt['success']:
                    failure_count += 1
                else:
                    if failure_count >= 3:
                        alerts.append({
                            'alert_type': 'SUCCESSFUL_AUTH_AFTER_FAILURES',
                            'severity': 'HIGH',
                            'ip_address': ip,
                            'failure_count': failure_count,
                            'success_user_id': evt['user_id'],
                            'success_time': evt['timestamp'].isoformat()
                        })
                    failure_count = 0

        return alerts

    def generate_timeline(self, user_id: Optional[str] = None,
                          ip_address: Optional[str] = None) -> List[Dict]:
        """タイムライン生成"""
        filtered = self.events

        if user_id:
            filtered = [e for e in filtered if e.get('user_id') == user_id]

        if ip_address:
            filtered = [e for e in filtered if e.get('ip_address') == ip_address]

        filtered.sort(key=lambda x: x['timestamp'])

        return [{
            'timestamp': e['timestamp'].isoformat(),
            'source': e['source'],
            'event_type': e.get('event_type'),
            'event_code': e.get('event_code'),
            'user_id': e.get('user_id'),
            'ip_address': e.get('ip_address'),
            'success': e.get('success')
        } for e in filtered]

    def run_all_detections(self) -> Dict[str, List[Dict]]:
        """全検出ルールの実行"""
        return {
            'brute_force': self.detect_brute_force(),
            'data_exfiltration': self.detect_data_exfiltration(),
            'privilege_escalation': self.detect_privilege_escalation(),
            'suspicious_patterns': self.detect_suspicious_access_patterns(),
            'correlated_events': self.correlate_security_events()
        }


def main():
    parser = argparse.ArgumentParser(description='ログ相関分析ツール')
    parser.add_argument('--audit-logs', help='監査ログファイル (JSON)')
    parser.add_argument('--web-logs', help='Webサーバーログファイル (JSONL)')
    parser.add_argument('--output', '-o', help='出力ファイル')
    parser.add_argument('--user-id', help='特定ユーザーのタイムライン生成')
    parser.add_argument('--ip-address', help='特定IPのタイムライン生成')
    parser.add_argument('--detect', action='store_true', help='攻撃パターン検出実行')
    parser.add_argument('--timeline', action='store_true', help='タイムライン生成')

    args = parser.parse_args()

    correlator = LogCorrelator()

    # ログ読み込み
    if args.audit_logs:
        print(f"[*] Loading audit logs: {args.audit_logs}")
        correlator.load_audit_logs(args.audit_logs)

    if args.web_logs:
        print(f"[*] Loading web logs: {args.web_logs}")
        correlator.load_web_logs(args.web_logs)

    print(f"[*] Total events loaded: {len(correlator.events)}")

    result = {}

    # 検出実行
    if args.detect:
        print("[*] Running detection rules...")
        result['detections'] = correlator.run_all_detections()

        total_alerts = sum(len(alerts) for alerts in result['detections'].values())
        print(f"[*] Total alerts generated: {total_alerts}")

    # タイムライン生成
    if args.timeline:
        print("[*] Generating timeline...")
        result['timeline'] = correlator.generate_timeline(
            user_id=args.user_id,
            ip_address=args.ip_address
        )
        print(f"[*] Timeline events: {len(result['timeline'])}")

    # 出力
    output = json.dumps(result, indent=2, default=str)

    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        print(f"[*] Results saved to: {args.output}")
    else:
        print(output)


if __name__ == '__main__':
    main()
```

---

## 3. フォレンジック収集ツール

### 3.1 クイックトリアージスクリプト

```bash
#!/bin/bash
# quick-triage.sh - クイックトリアージ収集スクリプト
# 揮発性データの迅速な収集

set -euo pipefail

INCIDENT_ID="${1:-INC-$(date +%Y%m%d-%H%M%S)}"
OUTPUT_DIR="/forensics/triage/${INCIDENT_ID}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "========================================"
echo "LifePlan Navigator Quick Triage Tool"
echo "Incident ID: ${INCIDENT_ID}"
echo "Timestamp: ${TIMESTAMP}"
echo "========================================"

# 出力ディレクトリ作成
mkdir -p "${OUTPUT_DIR}"/{system,network,processes,logs,docker}

# 権限チェック
if [[ $EUID -ne 0 ]]; then
    echo "[!] Warning: Running without root privileges. Some data may not be collected."
fi

echo "[*] Collecting system information..."

# システム情報
{
    echo "=== Hostname ==="
    hostname -f
    echo ""
    echo "=== Date/Time ==="
    date -Iseconds
    timedatectl 2>/dev/null || true
    echo ""
    echo "=== Uptime ==="
    uptime
    echo ""
    echo "=== Kernel ==="
    uname -a
    echo ""
    echo "=== OS Release ==="
    cat /etc/os-release 2>/dev/null || true
} > "${OUTPUT_DIR}/system/system_info.txt"

# ユーザー情報
{
    echo "=== Current Users ==="
    who
    echo ""
    echo "=== Last Logins ==="
    last -a -n 50 2>/dev/null || true
    echo ""
    echo "=== Failed Logins ==="
    lastb -a -n 50 2>/dev/null || true
    echo ""
    echo "=== User Accounts ==="
    cat /etc/passwd
    echo ""
    echo "=== Groups ==="
    cat /etc/group
} > "${OUTPUT_DIR}/system/users.txt"

echo "[*] Collecting process information..."

# プロセス情報
{
    echo "=== Process Tree ==="
    ps auxf
    echo ""
    echo "=== Process with Network Connections ==="
    ps aux --sort=-%mem | head -50
} > "${OUTPUT_DIR}/processes/process_list.txt"

# 開いているファイル
lsof -n 2>/dev/null | head -1000 > "${OUTPUT_DIR}/processes/open_files.txt" || true

echo "[*] Collecting network information..."

# ネットワーク情報
{
    echo "=== Network Interfaces ==="
    ip addr
    echo ""
    echo "=== Routing Table ==="
    ip route
    echo ""
    echo "=== ARP Table ==="
    ip neigh
    echo ""
    echo "=== DNS Configuration ==="
    cat /etc/resolv.conf
} > "${OUTPUT_DIR}/network/network_config.txt"

# ネットワーク接続
{
    echo "=== TCP Connections ==="
    ss -tulpn
    echo ""
    echo "=== All Connections ==="
    ss -anp
    echo ""
    echo "=== Listening Ports ==="
    netstat -tulpn 2>/dev/null || ss -tulpn
} > "${OUTPUT_DIR}/network/connections.txt"

# iptables
iptables -L -n -v > "${OUTPUT_DIR}/network/iptables.txt" 2>/dev/null || true

echo "[*] Collecting Docker information..."

# Docker情報（インストールされている場合）
if command -v docker &> /dev/null; then
    {
        echo "=== Running Containers ==="
        docker ps -a
        echo ""
        echo "=== Docker Images ==="
        docker images
        echo ""
        echo "=== Docker Networks ==="
        docker network ls
    } > "${OUTPUT_DIR}/docker/docker_info.txt"

    # LifePlan関連コンテナのログ
    for container in $(docker ps --format '{{.Names}}' | grep -i lifeplan); do
        echo "[*] Collecting logs for container: ${container}"
        docker logs --tail 1000 "${container}" > "${OUTPUT_DIR}/docker/${container}_logs.txt" 2>&1 || true
    done
fi

echo "[*] Collecting log files..."

# 重要なログファイルのコピー
LOG_FILES=(
    "/var/log/auth.log"
    "/var/log/syslog"
    "/var/log/messages"
    "/var/log/secure"
    "/var/log/nginx/access.log"
    "/var/log/nginx/error.log"
)

for log_file in "${LOG_FILES[@]}"; do
    if [[ -f "$log_file" ]]; then
        cp "$log_file" "${OUTPUT_DIR}/logs/" 2>/dev/null || true
    fi
done

# アプリケーションログ
if [[ -d "/var/log/lifeplan-navigator" ]]; then
    cp -r /var/log/lifeplan-navigator "${OUTPUT_DIR}/logs/" 2>/dev/null || true
fi

# systemdジャーナル
journalctl --since "24 hours ago" -o json > "${OUTPUT_DIR}/logs/journal_24h.json" 2>/dev/null || true

echo "[*] Collecting scheduled tasks..."

# スケジュールタスク
{
    echo "=== Crontabs ==="
    for user in $(cut -f1 -d: /etc/passwd); do
        echo "--- User: $user ---"
        crontab -u "$user" -l 2>/dev/null || echo "No crontab"
    done
    echo ""
    echo "=== System Cron ==="
    cat /etc/crontab
    echo ""
    echo "=== Cron.d ==="
    ls -la /etc/cron.d/
    cat /etc/cron.d/* 2>/dev/null || true
    echo ""
    echo "=== Systemd Timers ==="
    systemctl list-timers --all
} > "${OUTPUT_DIR}/system/scheduled_tasks.txt"

echo "[*] Collecting service information..."

# サービス情報
{
    echo "=== Systemd Services ==="
    systemctl list-units --type=service --all
    echo ""
    echo "=== Failed Services ==="
    systemctl --failed
} > "${OUTPUT_DIR}/system/services.txt"

echo "[*] Calculating file hashes..."

# ハッシュ計算
find "${OUTPUT_DIR}" -type f -exec sha256sum {} \; > "${OUTPUT_DIR}/file_hashes.txt"

echo "[*] Creating archive..."

# アーカイブ作成
ARCHIVE_NAME="triage_${INCIDENT_ID}_${TIMESTAMP}.tar.gz"
tar -czf "/forensics/${ARCHIVE_NAME}" -C "/forensics/triage" "${INCIDENT_ID}"

# アーカイブのハッシュ
sha256sum "/forensics/${ARCHIVE_NAME}" > "/forensics/${ARCHIVE_NAME}.sha256"

echo ""
echo "========================================"
echo "Triage collection complete!"
echo "Archive: /forensics/${ARCHIVE_NAME}"
echo "Hash: $(cat /forensics/${ARCHIVE_NAME}.sha256)"
echo "========================================"
```

### 3.2 AWS証拠収集スクリプト

```bash
#!/bin/bash
# aws-evidence-collector.sh - AWS環境からの証拠収集
# CloudTrail, VPC Flow Logs, RDS監査ログの収集

set -euo pipefail

INCIDENT_ID="${1:-INC-$(date +%Y%m%d-%H%M%S)}"
START_DATE="${2:-$(date -d '7 days ago' +%Y-%m-%d)}"
END_DATE="${3:-$(date +%Y-%m-%d)}"
OUTPUT_DIR="/forensics/aws/${INCIDENT_ID}"
S3_EVIDENCE_BUCKET="${S3_EVIDENCE_BUCKET:-lifeplan-forensics-evidence}"

echo "========================================"
echo "AWS Evidence Collector"
echo "Incident ID: ${INCIDENT_ID}"
echo "Date Range: ${START_DATE} to ${END_DATE}"
echo "========================================"

mkdir -p "${OUTPUT_DIR}"/{cloudtrail,flowlogs,rds,iam,ec2,s3}

echo "[*] Collecting CloudTrail logs..."

# CloudTrailログ取得
aws cloudtrail lookup-events \
    --start-time "${START_DATE}T00:00:00Z" \
    --end-time "${END_DATE}T23:59:59Z" \
    --max-results 1000 \
    --output json > "${OUTPUT_DIR}/cloudtrail/events.json"

# 重要なイベントのフィルタリング
cat "${OUTPUT_DIR}/cloudtrail/events.json" | jq '[.Events[] | select(
    .EventName == "ConsoleLogin" or
    .EventName == "CreateUser" or
    .EventName == "DeleteUser" or
    .EventName == "CreateAccessKey" or
    .EventName == "DeleteAccessKey" or
    .EventName == "AttachUserPolicy" or
    .EventName == "PutBucketPolicy" or
    .EventName == "AuthorizeSecurityGroupIngress" or
    .EventName == "CreateDBSnapshot" or
    .EventName == "ModifyDBInstance"
)]' > "${OUTPUT_DIR}/cloudtrail/critical_events.json"

echo "[*] Collecting IAM information..."

# IAM情報
{
    echo "=== IAM Users ==="
    aws iam list-users --output json
    echo ""
    echo "=== IAM Roles ==="
    aws iam list-roles --output json
    echo ""
    echo "=== IAM Policies ==="
    aws iam list-policies --scope Local --output json
} > "${OUTPUT_DIR}/iam/iam_inventory.json"

# クレデンシャルレポート
aws iam generate-credential-report >/dev/null 2>&1 || true
sleep 5
aws iam get-credential-report --query 'Content' --output text | base64 -d > "${OUTPUT_DIR}/iam/credential_report.csv" 2>/dev/null || true

echo "[*] Collecting EC2 information..."

# EC2インスタンス情報
aws ec2 describe-instances \
    --filters "Name=tag:Application,Values=lifeplan-navigator" \
    --output json > "${OUTPUT_DIR}/ec2/instances.json"

# セキュリティグループ
aws ec2 describe-security-groups \
    --output json > "${OUTPUT_DIR}/ec2/security_groups.json"

echo "[*] Collecting S3 bucket information..."

# S3バケット情報
for bucket in $(aws s3api list-buckets --query 'Buckets[].Name' --output text | tr '\t' '\n' | grep lifeplan); do
    echo "[*] Processing bucket: ${bucket}"
    mkdir -p "${OUTPUT_DIR}/s3/${bucket}"

    aws s3api get-bucket-policy --bucket "${bucket}" > "${OUTPUT_DIR}/s3/${bucket}/policy.json" 2>/dev/null || true
    aws s3api get-bucket-acl --bucket "${bucket}" > "${OUTPUT_DIR}/s3/${bucket}/acl.json" 2>/dev/null || true
    aws s3api get-bucket-logging --bucket "${bucket}" > "${OUTPUT_DIR}/s3/${bucket}/logging.json" 2>/dev/null || true
done

echo "[*] Collecting RDS information..."

# RDS情報
aws rds describe-db-instances \
    --output json > "${OUTPUT_DIR}/rds/instances.json"

# RDSスナップショット
aws rds describe-db-snapshots \
    --output json > "${OUTPUT_DIR}/rds/snapshots.json"

echo "[*] Creating EC2 forensic snapshot..."

# 対象EC2のEBSスナップショット作成
for instance_id in $(jq -r '.Reservations[].Instances[].InstanceId' "${OUTPUT_DIR}/ec2/instances.json"); do
    echo "[*] Creating snapshot for instance: ${instance_id}"

    # ボリュームID取得
    volume_ids=$(aws ec2 describe-instances \
        --instance-ids "${instance_id}" \
        --query 'Reservations[].Instances[].BlockDeviceMappings[].Ebs.VolumeId' \
        --output text)

    for volume_id in $volume_ids; do
        aws ec2 create-snapshot \
            --volume-id "${volume_id}" \
            --description "Forensic snapshot - ${INCIDENT_ID}" \
            --tag-specifications "ResourceType=snapshot,Tags=[{Key=IncidentId,Value=${INCIDENT_ID}},{Key=Purpose,Value=Forensics}]" \
            > "${OUTPUT_DIR}/ec2/snapshot_${volume_id}.json"
    done
done

echo "[*] Uploading evidence to S3..."

# 証拠のS3アップロード
ARCHIVE_NAME="aws_evidence_${INCIDENT_ID}_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "/tmp/${ARCHIVE_NAME}" -C "${OUTPUT_DIR}" .

# ハッシュ計算
sha256sum "/tmp/${ARCHIVE_NAME}" > "/tmp/${ARCHIVE_NAME}.sha256"

# S3にアップロード（暗号化）
aws s3 cp "/tmp/${ARCHIVE_NAME}" "s3://${S3_EVIDENCE_BUCKET}/incidents/${INCIDENT_ID}/" \
    --sse aws:kms \
    --metadata "incident-id=${INCIDENT_ID},collected-at=$(date -Iseconds)"

aws s3 cp "/tmp/${ARCHIVE_NAME}.sha256" "s3://${S3_EVIDENCE_BUCKET}/incidents/${INCIDENT_ID}/"

echo ""
echo "========================================"
echo "AWS evidence collection complete!"
echo "Local: ${OUTPUT_DIR}"
echo "S3: s3://${S3_EVIDENCE_BUCKET}/incidents/${INCIDENT_ID}/"
echo "========================================"
```

---

## 4. 自動分析スクリプト

### 4.1 不審アクティビティ検出

```python
#!/usr/bin/env python3
"""
suspicious_activity_detector.py - 不審アクティビティ検出
監査ログから不審なパターンを自動検出
"""

import json
import sys
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List, Dict, Any

class SuspiciousActivityDetector:
    """不審アクティビティ検出エンジン"""

    def __init__(self, config: Dict = None):
        self.config = config or {
            'brute_force_threshold': 5,
            'brute_force_window_minutes': 5,
            'data_access_threshold': 100,
            'unusual_time_start': 22,  # 22:00
            'unusual_time_end': 6,      # 06:00
            'geo_anomaly_enabled': True,
        }
        self.findings = []

    def analyze(self, logs: List[Dict]) -> List[Dict]:
        """全分析の実行"""
        self.findings = []

        self._detect_brute_force(logs)
        self._detect_unusual_time_access(logs)
        self._detect_data_exfiltration(logs)
        self._detect_privilege_abuse(logs)
        self._detect_account_takeover(logs)
        self._detect_lateral_movement(logs)

        return self.findings

    def _detect_brute_force(self, logs: List[Dict]) -> None:
        """ブルートフォース攻撃検出"""
        failures_by_ip = defaultdict(list)

        for log in logs:
            if log.get('eventCode') == 'AUTH_LOGIN_FAILURE':
                ip = log.get('actor', {}).get('ipAddress')
                ts = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
                failures_by_ip[ip].append(ts)

        threshold = self.config['brute_force_threshold']
        window = timedelta(minutes=self.config['brute_force_window_minutes'])

        for ip, timestamps in failures_by_ip.items():
            timestamps.sort()
            for i, ts in enumerate(timestamps):
                count = sum(1 for t in timestamps[i:] if t - ts <= window)
                if count >= threshold:
                    self.findings.append({
                        'finding_type': 'BRUTE_FORCE_ATTACK',
                        'severity': 'HIGH',
                        'confidence': 'HIGH',
                        'ip_address': ip,
                        'attempt_count': count,
                        'first_attempt': timestamps[0].isoformat(),
                        'last_attempt': timestamps[-1].isoformat(),
                        'recommendation': 'IPアドレスをブロックし、対象アカウントの確認を実施'
                    })
                    break

    def _detect_unusual_time_access(self, logs: List[Dict]) -> None:
        """深夜・早朝アクセス検出"""
        for log in logs:
            if log.get('eventCode') in ['AUTH_LOGIN_SUCCESS', 'DATA_LIFEPLAN_VIEW']:
                ts = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
                hour = ts.hour

                if hour >= self.config['unusual_time_start'] or hour < self.config['unusual_time_end']:
                    self.findings.append({
                        'finding_type': 'UNUSUAL_TIME_ACCESS',
                        'severity': 'MEDIUM',
                        'confidence': 'MEDIUM',
                        'user_id': log.get('actor', {}).get('userId'),
                        'ip_address': log.get('actor', {}).get('ipAddress'),
                        'timestamp': log['timestamp'],
                        'event_code': log.get('eventCode'),
                        'recommendation': 'ユーザーに確認し、正当なアクセスか検証'
                    })

    def _detect_data_exfiltration(self, logs: List[Dict]) -> None:
        """データ窃取の兆候検出"""
        access_by_user = defaultdict(lambda: {'count': 0, 'data_size': 0, 'events': []})

        for log in logs:
            if log.get('eventCode', '').startswith('DATA_'):
                user_id = log.get('actor', {}).get('userId')
                if user_id:
                    access_by_user[user_id]['count'] += 1
                    size = log.get('response', {}).get('dataSize', 0) or 0
                    access_by_user[user_id]['data_size'] += size
                    access_by_user[user_id]['events'].append(log['eventCode'])

        threshold = self.config['data_access_threshold']

        for user_id, stats in access_by_user.items():
            if stats['count'] >= threshold:
                self.findings.append({
                    'finding_type': 'POTENTIAL_DATA_EXFILTRATION',
                    'severity': 'HIGH',
                    'confidence': 'MEDIUM',
                    'user_id': user_id,
                    'access_count': stats['count'],
                    'total_data_bytes': stats['data_size'],
                    'event_types': list(set(stats['events'])),
                    'recommendation': 'ユーザーアクティビティを詳細調査し、必要に応じてアカウント停止'
                })

    def _detect_privilege_abuse(self, logs: List[Dict]) -> None:
        """権限濫用検出"""
        for log in logs:
            # 他ユーザーのデータへのアクセス
            if log.get('eventCode') in ['DATA_USER_PROFILE_VIEW', 'DATA_LIFEPLAN_VIEW']:
                actor_id = log.get('actor', {}).get('userId')
                target_owner = log.get('target', {}).get('ownerId')

                if actor_id and target_owner and actor_id != target_owner:
                    # 管理者でない場合は不審
                    roles = log.get('actor', {}).get('roles', [])
                    if 'admin' not in roles and 'superadmin' not in roles:
                        self.findings.append({
                            'finding_type': 'UNAUTHORIZED_DATA_ACCESS',
                            'severity': 'HIGH',
                            'confidence': 'HIGH',
                            'actor_user_id': actor_id,
                            'target_owner_id': target_owner,
                            'target_type': log.get('target', {}).get('type'),
                            'target_id': log.get('target', {}).get('id'),
                            'timestamp': log['timestamp'],
                            'recommendation': '即座にアクセスを遮断し、調査を開始'
                        })

    def _detect_account_takeover(self, logs: List[Dict]) -> None:
        """アカウント乗っ取り検出"""
        user_login_ips = defaultdict(set)
        user_login_locations = defaultdict(set)

        for log in logs:
            if log.get('eventCode') == 'AUTH_LOGIN_SUCCESS':
                user_id = log.get('actor', {}).get('userId')
                ip = log.get('actor', {}).get('ipAddress')
                country = log.get('actor', {}).get('geoLocation', {}).get('country')

                if user_id:
                    user_login_ips[user_id].add(ip)
                    if country:
                        user_login_locations[user_id].add(country)

        # 複数国からのログイン
        for user_id, countries in user_login_locations.items():
            if len(countries) > 1:
                self.findings.append({
                    'finding_type': 'MULTI_COUNTRY_LOGIN',
                    'severity': 'HIGH',
                    'confidence': 'MEDIUM',
                    'user_id': user_id,
                    'countries': list(countries),
                    'recommendation': 'アカウント所有者に確認し、不正の場合はパスワードリセット'
                })

    def _detect_lateral_movement(self, logs: List[Dict]) -> None:
        """横展開検出（複数アカウントへのアクセス試行）"""
        ip_target_users = defaultdict(set)

        for log in logs:
            if log.get('eventCode') in ['AUTH_LOGIN_SUCCESS', 'AUTH_LOGIN_FAILURE']:
                ip = log.get('actor', {}).get('ipAddress')
                # ターゲットユーザー（ログイン試行対象）
                target_email = log.get('metadata', {}).get('attemptedEmail')
                target_user = log.get('actor', {}).get('userId')

                if ip:
                    if target_email:
                        ip_target_users[ip].add(target_email)
                    if target_user:
                        ip_target_users[ip].add(target_user)

        for ip, users in ip_target_users.items():
            if len(users) > 5:
                self.findings.append({
                    'finding_type': 'LATERAL_MOVEMENT_ATTEMPT',
                    'severity': 'HIGH',
                    'confidence': 'HIGH',
                    'ip_address': ip,
                    'target_user_count': len(users),
                    'recommendation': 'IPアドレスをブロックし、全対象アカウントを調査'
                })

    def generate_report(self) -> Dict:
        """レポート生成"""
        severity_counts = defaultdict(int)
        for finding in self.findings:
            severity_counts[finding['severity']] += 1

        return {
            'analysis_timestamp': datetime.now().isoformat(),
            'total_findings': len(self.findings),
            'severity_summary': dict(severity_counts),
            'findings': sorted(
                self.findings,
                key=lambda x: {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}.get(x['severity'], 4)
            )
        }


def main():
    if len(sys.argv) < 2:
        print("Usage: python suspicious_activity_detector.py <audit_logs.json> [output.json]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    print(f"[*] Loading logs from: {input_file}")

    with open(input_file, 'r') as f:
        logs = json.load(f)

    print(f"[*] Analyzing {len(logs)} log entries...")

    detector = SuspiciousActivityDetector()
    detector.analyze(logs)
    report = detector.generate_report()

    print(f"[*] Analysis complete. Found {report['total_findings']} suspicious activities.")
    print(f"    - CRITICAL: {report['severity_summary'].get('CRITICAL', 0)}")
    print(f"    - HIGH: {report['severity_summary'].get('HIGH', 0)}")
    print(f"    - MEDIUM: {report['severity_summary'].get('MEDIUM', 0)}")
    print(f"    - LOW: {report['severity_summary'].get('LOW', 0)}")

    output = json.dumps(report, indent=2, default=str)

    if output_file:
        with open(output_file, 'w') as f:
            f.write(output)
        print(f"[*] Report saved to: {output_file}")
    else:
        print(output)


if __name__ == '__main__':
    main()
```

---

## 5. ツール配置とセットアップ

### 5.1 ディレクトリ構造

```
/opt/forensics-toolkit/
├── bin/
│   ├── audit-log-search.sh
│   ├── quick-triage.sh
│   ├── aws-evidence-collector.sh
│   └── memory-dump.sh
├── python/
│   ├── log_correlator.py
│   ├── suspicious_activity_detector.py
│   └── timeline_generator.py
├── config/
│   ├── tool_config.yaml
│   └── detection_rules.yaml
├── templates/
│   ├── incident_report.md
│   └── evidence_chain.md
└── README.md
```

### 5.2 セットアップスクリプト

```bash
#!/bin/bash
# setup-forensics-toolkit.sh

set -euo pipefail

TOOLKIT_DIR="/opt/forensics-toolkit"

echo "[*] Setting up Forensics Toolkit..."

# ディレクトリ作成
sudo mkdir -p "${TOOLKIT_DIR}"/{bin,python,config,templates}

# スクリプトのコピー
sudo cp bin/*.sh "${TOOLKIT_DIR}/bin/"
sudo cp python/*.py "${TOOLKIT_DIR}/python/"
sudo cp config/*.yaml "${TOOLKIT_DIR}/config/"
sudo cp templates/*.md "${TOOLKIT_DIR}/templates/"

# 実行権限付与
sudo chmod +x "${TOOLKIT_DIR}/bin/"*.sh
sudo chmod +x "${TOOLKIT_DIR}/python/"*.py

# PATHに追加
echo "export PATH=\$PATH:${TOOLKIT_DIR}/bin" | sudo tee /etc/profile.d/forensics-toolkit.sh

# Python依存関係
pip3 install --user pyyaml elasticsearch psycopg2-binary

echo "[*] Setup complete. Please restart your shell or run: source /etc/profile.d/forensics-toolkit.sh"
```

---

## 6. 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| LifePlan_Navigator_Forensic_Procedures.md | フォレンジック手順書 |
| LifePlan_Navigator_Investigation_Capabilities.md | 調査能力構築ガイド |
| LifePlan_Navigator_Investigation_Checklist.md | 調査チェックリスト |
| LifePlan_Navigator_Audit_Log_Technical_Spec.md | 監査ログ技術仕様 |

---

## 7. 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2025-12-11 | 初版作成 | CSIRT Engineer |

---

**Document Classification**: Confidential
**Review Cycle**: Quarterly
**Next Review**: 2026-03-11
