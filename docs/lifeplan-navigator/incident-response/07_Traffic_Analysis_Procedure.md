# LifePlan Navigator - トラフィック分析手順書

**バージョン**: 1.0
**作成日**: 2025-12-11
**分類**: 機密 - インシデント対応用
**作成者**: Network Engineer
**関連文書**: 01_Incident_Response_Procedure.md, 05_Network_Isolation_Procedure.md

---

## 1. 概要

### 1.1 目的
不正通信の検知、C2（Command & Control）通信の特定、フォレンジック分析のためのトラフィック分析手順を定義します。

### 1.2 分析対象

| データソース | 用途 | 保持期間 |
|-------------|------|----------|
| VPC Flow Logs | ネットワーク接続の全体像 | 90日 |
| ALB Access Logs | HTTPリクエスト詳細 | 90日 |
| CloudFront Logs | エッジでのアクセス | 90日 |
| WAF Logs | ブロック/許可の詳細 | 90日 |
| パケットキャプチャ | 詳細分析（オンデマンド） | インシデント期間 |

### 1.3 分析ツール

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Traffic Analysis Tools                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  AWS Native:                                                                    │
│  ├── VPC Flow Logs + CloudWatch Logs Insights                                  │
│  ├── Amazon Athena (S3ログのSQL分析)                                           │
│  ├── Amazon OpenSearch (SIEM)                                                  │
│  └── AWS Network Analyzer (到達性分析)                                         │
│                                                                                  │
│  Third Party:                                                                   │
│  ├── Wireshark (パケット解析)                                                  │
│  ├── Zeek (旧Bro) (ネットワークモニタリング)                                   │
│  ├── Suricata (IDS/IPS)                                                        │
│  └── Elastic SIEM (ログ相関分析)                                               │
│                                                                                  │
│  CLI Tools:                                                                     │
│  ├── tcpdump (パケットキャプチャ)                                              │
│  ├── tshark (Wireshark CLI)                                                    │
│  ├── ngrep (ネットワークgrep)                                                  │
│  └── jq (JSON解析)                                                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. VPC Flow Logs分析

### 2.1 Flow Logs設定

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         VPC Flow Logs Configuration                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Log Group: /aws/vpc/flowlogs/lifeplan-production                               │
│  Destination: CloudWatch Logs + S3                                              │
│  Traffic Type: ALL (ACCEPT + REJECT)                                            │
│  Aggregation Interval: 1 minute                                                 │
│                                                                                  │
│  Log Format (v5 custom):                                                        │
│  ${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr}                │
│  ${srcport} ${dstport} ${protocol} ${packets} ${bytes}                         │
│  ${start} ${end} ${action} ${log-status}                                       │
│  ${vpc-id} ${subnet-id} ${instance-id} ${tcp-flags}                            │
│  ${type} ${pkt-srcaddr} ${pkt-dstaddr} ${region} ${az-id}                      │
│  ${sublocation-type} ${sublocation-id} ${pkt-src-aws-service}                  │
│  ${pkt-dst-aws-service} ${flow-direction} ${traffic-path}                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 CloudWatch Logs Insightsクエリ

#### 2.2.1 REJECT通信の検出
```sql
-- 拒否された通信のTop Source IPs
fields @timestamp, srcAddr, dstAddr, srcPort, dstPort, protocol, action
| filter action = "REJECT"
| stats count(*) as rejectCount by srcAddr
| sort rejectCount desc
| limit 50
```

#### 2.2.2 内部から外部への不審な通信
```sql
-- Data Subnetから外部への通信（本来発生しないはず）
fields @timestamp, srcAddr, dstAddr, dstPort, bytes, packets
| filter srcAddr like /^10\.0\.32\./ or srcAddr like /^10\.0\.36\./
| filter not dstAddr like /^10\./
| filter action = "ACCEPT"
| sort bytes desc
| limit 100
```

#### 2.2.3 ポートスキャン検知
```sql
-- 1分間に50以上の異なるポートへの接続試行
fields @timestamp, srcAddr, dstAddr, dstPort, action
| filter action = "REJECT"
| stats count_distinct(dstPort) as uniquePorts by srcAddr, bin(1m)
| filter uniquePorts > 50
| sort uniquePorts desc
```

#### 2.2.4 大量データ転送検知
```sql
-- 1時間で1GB以上のデータ送信
fields @timestamp, srcAddr, dstAddr, bytes, packets
| filter action = "ACCEPT"
| stats sum(bytes) as totalBytes by srcAddr, dstAddr, bin(1h)
| filter totalBytes > 1073741824
| sort totalBytes desc
```

#### 2.2.5 非標準ポートへの通信
```sql
-- 一般的でないポートへの外部通信
fields @timestamp, srcAddr, dstAddr, dstPort, protocol, bytes
| filter not dstAddr like /^10\./
| filter protocol = 6  -- TCP
| filter dstPort not in [80, 443, 53, 123]
| filter action = "ACCEPT"
| stats sum(bytes) as totalBytes, count(*) as connections by srcAddr, dstAddr, dstPort
| sort totalBytes desc
| limit 100
```

### 2.3 Amazon Athena分析

#### 2.3.1 Athenaテーブル作成
```sql
CREATE EXTERNAL TABLE IF NOT EXISTS vpc_flow_logs (
  version int,
  account_id string,
  interface_id string,
  srcaddr string,
  dstaddr string,
  srcport int,
  dstport int,
  protocol int,
  packets bigint,
  bytes bigint,
  start bigint,
  end bigint,
  action string,
  log_status string,
  vpc_id string,
  subnet_id string,
  instance_id string,
  tcp_flags int,
  type string,
  pkt_srcaddr string,
  pkt_dstaddr string
)
PARTITIONED BY (region string, day string)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ' '
LOCATION 's3://lifeplan-logs/vpc-flow-logs/AWSLogs/{account_id}/vpcflowlogs/'
TBLPROPERTIES ("skip.header.line.count"="1");
```

#### 2.3.2 高度な分析クエリ
```sql
-- C2通信パターン検知（ビーコニング）
WITH connection_intervals AS (
  SELECT
    srcaddr,
    dstaddr,
    dstport,
    start,
    LAG(start) OVER (PARTITION BY srcaddr, dstaddr, dstport ORDER BY start) as prev_start
  FROM vpc_flow_logs
  WHERE action = 'ACCEPT'
    AND NOT dstaddr LIKE '10.%'
    AND day = '2025/12/11'
)
SELECT
  srcaddr,
  dstaddr,
  dstport,
  COUNT(*) as connection_count,
  STDDEV(start - prev_start) as interval_stddev,
  AVG(start - prev_start) as avg_interval
FROM connection_intervals
WHERE prev_start IS NOT NULL
GROUP BY srcaddr, dstaddr, dstport
HAVING COUNT(*) > 100 AND STDDEV(start - prev_start) < 60  -- 定期的な接続
ORDER BY connection_count DESC;
```

---

## 3. パケットキャプチャ

### 3.1 キャプチャ方法

#### 3.1.1 VPCトラフィックミラーリング
```bash
#!/bin/bash
# Traffic Mirroring Setup for Incident Response
# 特定のENIからのトラフィックをキャプチャ用インスタンスにミラーリング

TARGET_ENI=$1  # ミラーリング対象のENI
CAPTURE_ENI=$2  # キャプチャ用インスタンスのENI
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# ミラーリングターゲット作成
TARGET_ID=$(aws ec2 create-traffic-mirror-target \
  --network-interface-id $CAPTURE_ENI \
  --description "Incident-Capture-$TIMESTAMP" \
  --query 'TrafficMirrorTarget.TrafficMirrorTargetId' \
  --output text)

# ミラーリングフィルター作成（全トラフィック）
FILTER_ID=$(aws ec2 create-traffic-mirror-filter \
  --description "Capture-All-$TIMESTAMP" \
  --query 'TrafficMirrorFilter.TrafficMirrorFilterId' \
  --output text)

# フィルタールール追加（Inbound）
aws ec2 create-traffic-mirror-filter-rule \
  --traffic-mirror-filter-id $FILTER_ID \
  --traffic-direction ingress \
  --rule-number 100 \
  --rule-action accept \
  --protocol -1 \
  --source-cidr-block 0.0.0.0/0 \
  --destination-cidr-block 0.0.0.0/0

# フィルタールール追加（Outbound）
aws ec2 create-traffic-mirror-filter-rule \
  --traffic-mirror-filter-id $FILTER_ID \
  --traffic-direction egress \
  --rule-number 100 \
  --rule-action accept \
  --protocol -1 \
  --source-cidr-block 0.0.0.0/0 \
  --destination-cidr-block 0.0.0.0/0

# ミラーリングセッション作成
SESSION_ID=$(aws ec2 create-traffic-mirror-session \
  --network-interface-id $TARGET_ENI \
  --traffic-mirror-target-id $TARGET_ID \
  --traffic-mirror-filter-id $FILTER_ID \
  --session-number 1 \
  --description "Incident-Session-$TIMESTAMP" \
  --query 'TrafficMirrorSession.TrafficMirrorSessionId' \
  --output text)

echo "Traffic Mirror Session Created: $SESSION_ID"
echo "Target: $TARGET_ID"
echo "Filter: $FILTER_ID"

# 設定情報保存
echo "{
  \"timestamp\": \"$TIMESTAMP\",
  \"target_eni\": \"$TARGET_ENI\",
  \"capture_eni\": \"$CAPTURE_ENI\",
  \"session_id\": \"$SESSION_ID\",
  \"target_id\": \"$TARGET_ID\",
  \"filter_id\": \"$FILTER_ID\"
}" > /var/log/incident/traffic_mirror_$TIMESTAMP.json
```

#### 3.1.2 tcpdumpによるキャプチャ
```bash
#!/bin/bash
# パケットキャプチャスクリプト（キャプチャ用インスタンスで実行）
# Usage: ./packet_capture.sh <interface> <duration_seconds> <incident_id>

INTERFACE=$1
DURATION=$2
INCIDENT_ID=$3
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_FILE="/data/captures/${INCIDENT_ID}_${TIMESTAMP}.pcap"

echo "Starting packet capture..."
echo "Interface: $INTERFACE"
echo "Duration: $DURATION seconds"
echo "Output: $OUTPUT_FILE"

# キャプチャ実行
sudo tcpdump -i $INTERFACE \
  -w $OUTPUT_FILE \
  -G $DURATION \
  -W 1 \
  -Z root \
  -n \
  'not port 22'  # SSHトラフィック除外

echo "Capture complete: $OUTPUT_FILE"

# ファイルサイズ確認
ls -lh $OUTPUT_FILE

# 基本統計
echo "=== Basic Statistics ==="
tcpdump -r $OUTPUT_FILE -n | head -100 | tail -20

# S3へのアップロード（オプション）
# aws s3 cp $OUTPUT_FILE s3://lifeplan-forensics/captures/
```

### 3.2 パケット分析

#### 3.2.1 Wireshark/tsharkによる分析
```bash
# HTTP/HTTPSトラフィック抽出
tshark -r capture.pcap -Y "http or ssl" -T fields \
  -e frame.time -e ip.src -e ip.dst -e tcp.dstport -e http.host -e ssl.handshake.extensions_server_name

# DNS クエリ抽出
tshark -r capture.pcap -Y "dns.flags.response == 0" -T fields \
  -e frame.time -e ip.src -e dns.qry.name -e dns.qry.type

# 不審なUser-Agent検出
tshark -r capture.pcap -Y "http.user_agent" -T fields \
  -e ip.src -e http.host -e http.user_agent | sort | uniq -c | sort -rn

# TLS SNI（Server Name Indication）抽出
tshark -r capture.pcap -Y "ssl.handshake.extensions_server_name" -T fields \
  -e ip.src -e ip.dst -e ssl.handshake.extensions_server_name

# 大量データ転送の検出
tshark -r capture.pcap -q -z conv,tcp | sort -k 10 -rn | head -20
```

#### 3.2.2 Zeekによる分析
```bash
# Zeekでpcapを処理
zeek -r capture.pcap local

# 接続ログ分析
cat conn.log | zeek-cut ts id.orig_h id.resp_h id.resp_p proto service duration orig_bytes resp_bytes | \
  awk '$8 > 10000000 || $9 > 10000000'  # 10MB以上の転送

# HTTP分析
cat http.log | zeek-cut ts id.orig_h host uri user_agent

# DNS分析
cat dns.log | zeek-cut ts id.orig_h query qtype_name answers

# SSL/TLS分析
cat ssl.log | zeek-cut ts id.orig_h id.resp_h server_name ja3 ja3s
```

---

## 4. C2通信検知

### 4.1 C2通信の特徴

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         C2 Communication Indicators                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. ビーコニング (Beaconing)                                                    │
│     ├── 定期的な外部接続（1分、5分、15分間隔など）                             │
│     ├── 接続間隔の標準偏差が小さい                                             │
│     └── 深夜・早朝も継続                                                       │
│                                                                                  │
│  2. 異常なDNSパターン                                                           │
│     ├── DNSトンネリング（長いサブドメイン）                                    │
│     ├── 高頻度のDNSクエリ                                                      │
│     ├── 新規ドメインへの大量アクセス                                           │
│     └── TXT/CNAME/MXの異常な使用                                               │
│                                                                                  │
│  3. 暗号化通信パターン                                                          │
│     ├── 非標準ポートでのTLS                                                    │
│     ├── 自己署名証明書                                                         │
│     ├── JA3/JA3Sフィンガープリント                                             │
│     └── 証明書の有効期限が極端に短い/長い                                      │
│                                                                                  │
│  4. データ転送パターン                                                          │
│     ├── 業務時間外の大量送信                                                   │
│     ├── 圧縮/エンコードされたデータ                                            │
│     └── 定期的な小データ送信後の大量データ送信                                 │
│                                                                                  │
│  5. 接続先の特徴                                                                │
│     ├── 動的DNS (DynDNS, No-IP等)                                              │
│     ├── クラウドストレージ（Pastebin, GitHub, Discord等）                      │
│     ├── 新規登録ドメイン                                                       │
│     └── 低評判IP/ドメイン                                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 検知シグネチャ

#### 4.2.1 Suricataルール例
```yaml
# C2ビーコニング検知
alert tcp $HOME_NET any -> $EXTERNAL_NET any (
  msg:"Possible C2 Beaconing - Regular Interval";
  flow:established,to_server;
  detection_filter:track by_src, count 10, seconds 3600;
  threshold:type both, track by_src, count 5, seconds 600;
  classtype:trojan-activity;
  sid:1000001;
  rev:1;
)

# DNSトンネリング検知
alert dns $HOME_NET any -> any 53 (
  msg:"Possible DNS Tunneling - Long Subdomain";
  dns.query;
  content:".";
  pcre:"/^[a-z0-9]{30,}\./i";
  classtype:policy-violation;
  sid:1000002;
  rev:1;
)

# 非標準ポートTLS
alert tls $HOME_NET any -> $EXTERNAL_NET !443 (
  msg:"TLS on Non-Standard Port";
  flow:established,to_server;
  tls.sni;
  classtype:policy-violation;
  sid:1000003;
  rev:1;
)

# 既知C2ドメイン（IOC連携）
alert dns $HOME_NET any -> any 53 (
  msg:"Known C2 Domain Access";
  dns.query;
  content:"malicious-c2.example.com";
  classtype:trojan-activity;
  sid:1000004;
  rev:1;
)
```

#### 4.2.2 JA3/JA3Sフィンガープリント

```python
#!/usr/bin/env python3
# JA3フィンガープリント分析スクリプト

import json
import sys
from collections import Counter

# 既知の悪意あるJA3フィンガープリント
MALICIOUS_JA3 = {
    "a0e9f5d64349fb13191bc781f81f42e1": "Cobalt Strike",
    "72a589da586844d7f0818ce684948eea": "Emotet",
    "e7d705a3286e19ea42f587b344ee6865": "TrickBot",
    # ... 追加
}

def analyze_ja3(zeek_ssl_log):
    """Zeek SSL logからJA3を分析"""
    with open(zeek_ssl_log, 'r') as f:
        ja3_counts = Counter()
        suspicious = []

        for line in f:
            if line.startswith('#'):
                continue
            fields = line.strip().split('\t')
            if len(fields) >= 15:
                ja3 = fields[14] if fields[14] != '-' else None
                if ja3:
                    ja3_counts[ja3] += 1
                    if ja3 in MALICIOUS_JA3:
                        suspicious.append({
                            'timestamp': fields[0],
                            'src_ip': fields[2],
                            'dst_ip': fields[4],
                            'ja3': ja3,
                            'malware': MALICIOUS_JA3[ja3]
                        })

        return ja3_counts, suspicious

if __name__ == "__main__":
    counts, suspicious = analyze_ja3(sys.argv[1])

    print("=== JA3 Fingerprint Analysis ===")
    print("\nTop 10 JA3 Fingerprints:")
    for ja3, count in counts.most_common(10):
        label = MALICIOUS_JA3.get(ja3, "Unknown")
        print(f"  {ja3}: {count} ({label})")

    if suspicious:
        print("\n!!! SUSPICIOUS JA3 DETECTED !!!")
        for s in suspicious:
            print(json.dumps(s, indent=2))
```

### 4.3 IOC管理

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              IOC Management                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  IOC Sources:                                                                   │
│  ├── 内部: インシデント調査から抽出                                            │
│  ├── CTI Analyst: 脅威インテリジェンスフィード                                 │
│  ├── MISP: Open Source Threat Intelligence Platform                            │
│  ├── AlienVault OTX                                                            │
│  └── VirusTotal                                                                │
│                                                                                  │
│  IOC Types:                                                                     │
│  ├── IP Address                                                                │
│  ├── Domain                                                                    │
│  ├── URL                                                                       │
│  ├── File Hash (MD5, SHA256)                                                   │
│  ├── JA3/JA3S Fingerprint                                                      │
│  ├── User-Agent String                                                         │
│  └── Registry Key (Windows)                                                    │
│                                                                                  │
│  Update Frequency:                                                              │
│  ├── Critical IOC: 即時反映                                                    │
│  ├── High Confidence: 日次更新                                                 │
│  └── Low Confidence: 週次レビュー                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### IOC検知スクリプト
```bash
#!/bin/bash
# IOC Hunting Script
# Usage: ./ioc_hunt.sh <ioc_file> <log_directory>

IOC_FILE=$1
LOG_DIR=$2
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS="/var/log/incident/ioc_hunt_$TIMESTAMP.json"

echo "=== IOC Hunting: $TIMESTAMP ==="
echo "IOC File: $IOC_FILE"
echo "Log Directory: $LOG_DIR"

# IOCファイル読み込み
declare -A IOCS
while IFS=, read -r type value description; do
  IOCS["$type:$value"]="$description"
done < "$IOC_FILE"

# VPC Flow Logsで IP IOC検索
echo "Searching VPC Flow Logs for IP IOCs..."
for key in "${!IOCS[@]}"; do
  if [[ $key == ip:* ]]; then
    IP="${key#ip:}"
    MATCHES=$(zgrep "$IP" "$LOG_DIR"/vpc-flow-logs/*.gz 2>/dev/null | wc -l)
    if [ "$MATCHES" -gt 0 ]; then
      echo "FOUND: $IP ($MATCHES matches) - ${IOCS[$key]}"
    fi
  fi
done

# CloudWatch Logs Insightsでドメイン検索
echo "Searching DNS logs for Domain IOCs..."
for key in "${!IOCS[@]}"; do
  if [[ $key == domain:* ]]; then
    DOMAIN="${key#domain:}"
    aws logs filter-log-events \
      --log-group-name /aws/route53/lifeplan \
      --filter-pattern "\"$DOMAIN\"" \
      --start-time $(date -d '24 hours ago' +%s)000 \
      --query 'events[*].message' \
      --output text >> "$RESULTS.domains"
  fi
done

echo "Results saved to: $RESULTS"
```

---

## 5. 分析レポートテンプレート

### 5.1 トラフィック分析レポート

```markdown
# トラフィック分析レポート

## 基本情報
- 分析期間: YYYY-MM-DD HH:MM - YYYY-MM-DD HH:MM
- インシデントID: INC-XXXX
- 分析者: Network Engineer
- 分析日: YYYY-MM-DD

## エグゼクティブサマリー
[1-2文で要約]

## 分析対象
- VPC Flow Logs: ☑
- ALB Access Logs: ☑
- CloudFront Logs: ☑
- WAF Logs: ☑
- パケットキャプチャ: ☑/☐

## 発見事項

### 1. 不審な通信
| 送信元IP | 送信先IP | ポート | 通信量 | 特徴 |
|----------|----------|--------|--------|------|
| x.x.x.x | y.y.y.y | 443 | 10GB | ビーコニング |

### 2. C2通信の兆候
- [ ] ビーコニング検知
- [ ] DNSトンネリング検知
- [ ] 不審なTLS通信
- [ ] 既知IOCとの一致

### 3. データ流出の兆候
- 外部への大量データ転送: あり/なし
- 転送先: [IP/ドメイン]
- 推定データ量: XX GB

## IOC（Indicators of Compromise）
| Type | Value | Confidence | Notes |
|------|-------|------------|-------|
| IP | x.x.x.x | High | C2 Server |
| Domain | evil.com | Medium | DNS Tunnel |
| JA3 | abc123... | High | Cobalt Strike |

## 推奨アクション
1. [アクション1]
2. [アクション2]
3. [アクション3]

## 添付資料
- pcap file: [リンク]
- Flow Logs extract: [リンク]
- Athena query results: [リンク]
```

---

## 6. 訓練・演習

### 6.1 トラフィック分析訓練

| 訓練 | 頻度 | 参加者 | 内容 |
|------|------|--------|------|
| VPC Flow Logs分析 | 月次 | SOC, Network Eng | CloudWatch Insightsクエリ演習 |
| パケット解析基礎 | 四半期 | CSIRT全員 | Wireshark/tshark使用方法 |
| C2検知演習 | 四半期 | SOC, CTI, Network Eng | 模擬C2トラフィックの分析 |
| IOCハンティング | 月次 | CTI, SOC | 新規IOCの検証 |

### 6.2 訓練シナリオ

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Training Scenario: C2 Communication Detection                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  シナリオ:                                                                      │
│  標的型攻撃により、アプリケーションサーバーにバックドアが設置された。            │
│  攻撃者はC2サーバーと定期的に通信し、コマンドを受信している。                    │
│                                                                                  │
│  与えられたデータ:                                                              │
│  - VPC Flow Logs (24時間分)                                                    │
│  - ALB Access Logs                                                              │
│  - パケットキャプチャ (1時間分)                                                │
│                                                                                  │
│  課題:                                                                          │
│  1. 不審な外部通信を特定せよ                                                   │
│  2. C2サーバーのIPアドレスを特定せよ                                           │
│  3. 通信間隔を分析し、ビーコニングを証明せよ                                   │
│  4. 侵害されたホストを特定せよ                                                 │
│  5. 推奨される隔離措置を提案せよ                                               │
│                                                                                  │
│  評価基準:                                                                      │
│  □ C2サーバー特定 (30点)                                                       │
│  □ 侵害ホスト特定 (30点)                                                       │
│  □ ビーコニング分析 (20点)                                                     │
│  □ 対応提案 (20点)                                                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. 連絡先・エスカレーション

### 7.1 分析支援依頼先

| 役割 | 連絡先 | 支援内容 |
|------|--------|----------|
| CTI Analyst | Slack #cti | IOC提供、脅威情報 |
| CSIRT Engineer | PagerDuty | フォレンジック支援 |
| SOC Analyst | Slack #soc | ログ分析支援 |

### 7.2 外部リソース

| リソース | URL | 用途 |
|----------|-----|------|
| VirusTotal | virustotal.com | ハッシュ/IP/ドメイン検索 |
| Shodan | shodan.io | IP情報調査 |
| AbuseIPDB | abuseipdb.com | IP評判調査 |
| URLhaus | urlhaus.abuse.ch | 悪意あるURL |

---

## 8. 改訂履歴

| バージョン | 日付 | 変更内容 | 承認者 |
|-----------|------|----------|--------|
| 1.0 | 2025-12-11 | 初版作成 | Network Engineer |

---

**承認**

| 役職 | 氏名 | 署名 | 日付 |
|------|------|------|------|
| CSIRT Team Leader | | | |
| CTI Analyst | | | |
| Network Engineer | | | |
