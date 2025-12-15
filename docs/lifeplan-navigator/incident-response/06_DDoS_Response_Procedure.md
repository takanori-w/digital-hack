# LifePlan Navigator - DDoS対策・対応手順書

**バージョン**: 1.0
**作成日**: 2025-12-11
**分類**: 機密 - インシデント対応用
**作成者**: Network Engineer
**関連文書**: 01_Incident_Response_Procedure.md, 05_Network_Isolation_Procedure.md

---

## 1. 概要

### 1.1 目的
DDoS攻撃に対する検知・対応・復旧手順を定義し、サービス可用性を維持します。

### 1.2 DDoS攻撃分類

| レイヤー | 攻撃タイプ | 説明 | 対策コンポーネント |
|---------|-----------|------|-------------------|
| L3/L4 | Volumetric | UDP Flood, SYN Flood, ICMP Flood | Shield, CloudFront |
| L4 | Protocol | SYN-ACK反射、断片化攻撃 | Shield, ALB |
| L7 | Application | HTTP Flood, Slowloris, RUDY | WAF, ALB, CloudFront |

### 1.3 対策アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DDoS Protection Architecture                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [攻撃者] ──► Internet ──► Route 53 (Shield) ──► CloudFront (Shield + WAF)     │
│                                                        │                         │
│                                                        ▼                         │
│                                               ┌────────────────┐                │
│                                               │  AWS Shield    │                │
│                                               │  Advanced      │                │
│                                               │  - L3/L4保護   │                │
│                                               │  - DRT連携    │                │
│                                               └────────┬───────┘                │
│                                                        │                         │
│                                                        ▼                         │
│                                               ┌────────────────┐                │
│                                               │    AWS WAF     │                │
│                                               │  - L7保護      │                │
│                                               │  - Rate Limit  │                │
│                                               │  - Bot検知     │                │
│                                               └────────┬───────┘                │
│                                                        │                         │
│                                                        ▼                         │
│                                               ┌────────────────┐                │
│                                               │      ALB       │                │
│                                               │  - タイムアウト │                │
│                                               │  - 接続制限    │                │
│                                               └────────┬───────┘                │
│                                                        │                         │
│                                                        ▼                         │
│                                               ┌────────────────┐                │
│                                               │  ECS Services  │                │
│                                               │  - Auto Scale  │                │
│                                               └────────────────┘                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. レートリミット設定基準値

### 2.1 WAFレートリミット

| 対象 | 制限値 | 期間 | 根拠 |
|------|--------|------|------|
| グローバル (IP単位) | 2,000 req | 5分 | 通常ピークの2倍 |
| /api/auth/login | 5 req | 1分 | ブルートフォース対策 |
| /api/auth/register | 3 req | 1時間 | アカウント大量作成防止 |
| /api/auth/password-reset | 3 req | 1時間 | 列挙攻撃防止 |
| /api/simulation/* | 10 req | 1分 | 高負荷API保護 |
| /api/* (その他) | 100 req | 1分 | 一般的なAPI保護 |

### 2.2 緊急時レートリミット

| 攻撃強度 | グローバル制限 | 適用条件 |
|---------|--------------|----------|
| 軽度 | 1,000 req/5min | エラー率5%超過 |
| 中度 | 500 req/5min | エラー率10%超過 |
| 重度 | 100 req/5min | サービス応答不可 |
| 極度 | 全IPブロック | CISO承認時 |

### 2.3 CloudFrontレートリミット

```json
{
  "CloudFrontDistribution": {
    "DefaultCacheBehavior": {
      "OriginRequestPolicy": {
        "QueryStringsConfig": {
          "QueryStringBehavior": "whitelist",
          "QueryStrings": ["page", "limit", "sort"]
        }
      }
    },
    "CacheBehaviors": [
      {
        "PathPattern": "/api/*",
        "DefaultTTL": 0,
        "MaxTTL": 0,
        "MinTTL": 0
      },
      {
        "PathPattern": "/static/*",
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
      }
    ]
  }
}
```

---

## 3. DDoS検知

### 3.1 検知指標

| 指標 | しきい値 | アラート | 対応 |
|------|----------|----------|------|
| CloudFront 5xx Error Rate | > 5% (5分) | P2 | 調査開始 |
| CloudFront Request Count | 通常の3倍 (急増) | P2 | 監視強化 |
| ALB Active Connection Count | > 10,000 | P1 | 緊急対応 |
| ALB Target Response Time | > 5s (p99) | P1 | スケールアウト |
| WAF Block Rate | > 50% | P2 | ルール調査 |
| Shield Detected Events | Any | P1 | DRT連携検討 |

### 3.2 CloudWatchアラーム設定

```json
{
  "AlarmName": "DDoS-CloudFront-ErrorRate",
  "MetricName": "5xxErrorRate",
  "Namespace": "AWS/CloudFront",
  "Statistic": "Average",
  "Period": 300,
  "EvaluationPeriods": 2,
  "Threshold": 5,
  "ComparisonOperator": "GreaterThanThreshold",
  "AlarmActions": [
    "arn:aws:sns:ap-northeast-1:ACCOUNT_ID:ddos-alert"
  ],
  "Dimensions": [
    {
      "Name": "DistributionId",
      "Value": "EXAMPLEID12345"
    }
  ]
}
```

```json
{
  "AlarmName": "DDoS-ALB-ConnectionCount",
  "MetricName": "ActiveConnectionCount",
  "Namespace": "AWS/ApplicationELB",
  "Statistic": "Sum",
  "Period": 60,
  "EvaluationPeriods": 3,
  "Threshold": 10000,
  "ComparisonOperator": "GreaterThanThreshold",
  "AlarmActions": [
    "arn:aws:sns:ap-northeast-1:ACCOUNT_ID:ddos-critical"
  ]
}
```

---

## 4. DDoS対応手順

### 4.1 対応フロー

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DDoS Response Flow                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [検知] ──► [初期評価] ──► [エスカレーション] ──► [緩和措置] ──► [監視継続]    │
│     │           │               │                    │              │           │
│     │           │               │                    │              │           │
│     ▼           ▼               ▼                    ▼              ▼           │
│  ┌──────┐  ┌──────────┐  ┌────────────┐  ┌────────────────┐  ┌──────────┐     │
│  │Alert │  │ 攻撃分類 │  │ 重大度判定 │  │ WAF/Shield     │  │ 正常化  │     │
│  │発報  │  │ L3/4/7   │  │ P0-P3      │  │ 設定変更       │  │ 確認    │     │
│  └──────┘  │ 規模推定 │  │ 連絡先選定 │  │ CDN設定変更    │  │ 報告    │     │
│            └──────────┘  └────────────┘  │ ISPエスカレ    │  └──────────┘     │
│                                          └────────────────┘                     │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ タイムライン目標                                                           ││
│  │ 検知→初期評価: 5分以内                                                    ││
│  │ 初期評価→緩和開始: 15分以内                                               ││
│  │ 緩和開始→効果確認: 30分以内                                               ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Phase 1: 検知・初期評価 (0-5分)

```bash
#!/bin/bash
# DDoS Initial Assessment Script
# 実行: ./ddos_assess.sh

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
echo "=== DDoS Initial Assessment: $TIMESTAMP ==="

# 1. CloudFrontメトリクス確認
echo "[1] CloudFront Metrics (Last 15 minutes)"
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Sum \
  --dimensions Name=DistributionId,Value=$CLOUDFRONT_ID

aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name 5xxErrorRate \
  --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Average \
  --dimensions Name=DistributionId,Value=$CLOUDFRONT_ID

# 2. WAFブロック状況確認
echo "[2] WAF Block Count (Last 15 minutes)"
aws wafv2 get-sampled-requests \
  --web-acl-arn $WAF_ACL_ARN \
  --rule-metric-name RateLimitPerIP \
  --scope CLOUDFRONT \
  --time-window StartTime=$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ),EndTime=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --max-items 100

# 3. Shield検知イベント確認
echo "[3] Shield Detected Events"
aws shield list-attacks \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ)

# 4. ALB接続状況確認
echo "[4] ALB Connection Count"
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name ActiveConnectionCount \
  --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Sum \
  --dimensions Name=LoadBalancer,Value=$ALB_NAME

# 5. Top Source IPs (WAFログから)
echo "[5] Top Source IPs (from WAF logs)"
aws logs filter-log-events \
  --log-group-name aws-waf-logs-lifeplan \
  --start-time $(date -u -d '15 minutes ago' +%s)000 \
  --filter-pattern '{ $.action = "BLOCK" }' \
  --query 'events[*].message' \
  | jq -r '.[] | fromjson | .httpRequest.clientIp' \
  | sort | uniq -c | sort -rn | head -20

echo "=== Assessment Complete ==="
```

### 4.3 Phase 2: 緩和措置

#### 4.3.1 WAF緊急設定変更

```bash
#!/bin/bash
# WAF Emergency Rate Limit Update
# Usage: ./waf_emergency.sh <severity: mild|moderate|severe>

SEVERITY=$1
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

case $SEVERITY in
  "mild")
    NEW_LIMIT=1000
    ;;
  "moderate")
    NEW_LIMIT=500
    ;;
  "severe")
    NEW_LIMIT=100
    ;;
  *)
    echo "Usage: $0 <mild|moderate|severe>"
    exit 1
    ;;
esac

echo "[$TIMESTAMP] Updating WAF rate limit to: $NEW_LIMIT requests/5min"

# 現在のWeb ACL取得
aws wafv2 get-web-acl \
  --name lifeplan-production-waf \
  --scope CLOUDFRONT \
  --id $WEB_ACL_ID > /tmp/current_waf.json

LOCK_TOKEN=$(cat /tmp/current_waf.json | jq -r '.LockToken')

# レートリミットルール更新
cat /tmp/current_waf.json | jq --argjson limit $NEW_LIMIT '
  .WebACL.Rules |= map(
    if .Name == "RateLimitPerIP" then
      .Statement.RateBasedStatement.Limit = $limit
    else
      .
    end
  )
' > /tmp/updated_waf.json

# Web ACL更新
aws wafv2 update-web-acl \
  --name lifeplan-production-waf \
  --scope CLOUDFRONT \
  --id $WEB_ACL_ID \
  --lock-token $LOCK_TOKEN \
  --default-action Allow={} \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=lifeplan-waf \
  --rules file:///tmp/updated_rules.json

echo "[$TIMESTAMP] WAF rate limit updated successfully"

# 変更記録
echo "{
  \"timestamp\": \"$TIMESTAMP\",
  \"action\": \"WAF_RATE_LIMIT_UPDATE\",
  \"severity\": \"$SEVERITY\",
  \"new_limit\": $NEW_LIMIT
}" >> /var/log/incident/ddos_response.log
```

#### 4.3.2 特定IP/CIDR即時ブロック

```bash
#!/bin/bash
# Block Attacking IPs
# Usage: ./block_ips.sh <ip-list-file>

IP_LIST_FILE=$1
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# IP Setの現在の内容取得
aws wafv2 get-ip-set \
  --name lifeplan-blocked-ips \
  --scope CLOUDFRONT \
  --id $IP_SET_ID > /tmp/current_ipset.json

LOCK_TOKEN=$(cat /tmp/current_ipset.json | jq -r '.LockToken')
CURRENT_IPS=$(cat /tmp/current_ipset.json | jq -r '.IPSet.Addresses[]')

# 新規IPを追加
NEW_IPS=$(cat $IP_LIST_FILE | while read IP; do
  echo "\"$IP/32\""
done | tr '\n' ',' | sed 's/,$//')

ALL_IPS="[$CURRENT_IPS,$NEW_IPS]"

# IP Set更新
aws wafv2 update-ip-set \
  --name lifeplan-blocked-ips \
  --scope CLOUDFRONT \
  --id $IP_SET_ID \
  --lock-token $LOCK_TOKEN \
  --addresses $(echo $ALL_IPS | jq -c '.')

echo "[$TIMESTAMP] Blocked IPs from $IP_LIST_FILE"

# ブロック記録
cat $IP_LIST_FILE | while read IP; do
  echo "{
    \"timestamp\": \"$TIMESTAMP\",
    \"action\": \"IP_BLOCKED\",
    \"ip\": \"$IP\",
    \"reason\": \"DDoS_Attack\"
  }" >> /var/log/incident/blocked_ips.log
done
```

#### 4.3.3 CloudFront緊急設定

```bash
#!/bin/bash
# CloudFront Emergency Config
# Usage: ./cloudfront_emergency.sh <action: geo_restrict|maintenance|restore>

ACTION=$1
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# 現在の設定取得
aws cloudfront get-distribution-config --id $CLOUDFRONT_ID > /tmp/cf_config.json
ETAG=$(cat /tmp/cf_config.json | jq -r '.ETag')

case $ACTION in
  "geo_restrict")
    # 日本からのアクセスのみ許可
    cat /tmp/cf_config.json | jq '
      .DistributionConfig.Restrictions.GeoRestriction = {
        "RestrictionType": "whitelist",
        "Quantity": 1,
        "Items": ["JP"]
      }
    ' > /tmp/cf_config_updated.json
    ;;

  "maintenance")
    # メンテナンスページを返す（S3静的ページ）
    cat /tmp/cf_config.json | jq '
      .DistributionConfig.Origins.Items[0].DomainName = "lifeplan-maintenance.s3.amazonaws.com"
    ' > /tmp/cf_config_updated.json
    ;;

  "restore")
    # 元の設定に戻す（バックアップから）
    cp /var/backup/cloudfront_normal_config.json /tmp/cf_config_updated.json
    ;;
esac

# 設定更新
aws cloudfront update-distribution \
  --id $CLOUDFRONT_ID \
  --if-match $ETAG \
  --distribution-config file:///tmp/cf_config_updated.json

echo "[$TIMESTAMP] CloudFront config updated: $ACTION"
```

### 4.4 Phase 3: 上流エスカレーション

#### 4.4.1 AWS Shield DRT連携

```bash
#!/bin/bash
# AWS Shield DRT Engagement
# Shield Advancedでのみ利用可能

TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# DRTへのサポートケース作成
aws support create-case \
  --subject "[DDoS] LifePlan Navigator under attack - DRT engagement requested" \
  --communication-body "
Attack Details:
- Start Time: $TIMESTAMP
- Distribution: $CLOUDFRONT_ID
- ALB: $ALB_ARN
- Attack Type: (L3/L4/L7を記載)
- Current Impact: (サービス影響を記載)
- Actions Taken: WAF rate limit tightened to $NEW_LIMIT

Requesting DRT assistance for:
1. Attack pattern analysis
2. Custom mitigation recommendations
3. Proactive engagement if attack escalates
" \
  --severity-code critical \
  --category-code ddos-attack \
  --service-code shield \
  --issue-type customer-service

echo "[$TIMESTAMP] DRT engagement case created"
```

#### 4.4.2 Cloudflare連携（CDN/WAF追加レイヤー）

```bash
#!/bin/bash
# Cloudflare Emergency Settings (if using Cloudflare in front)
# API経由での設定変更

CF_ZONE_ID="your_zone_id"
CF_API_TOKEN="your_api_token"

# Under Attack Modeの有効化
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/settings/security_level" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"value":"under_attack"}'

echo "Cloudflare Under Attack Mode enabled"
```

#### 4.4.3 ISPエスカレーション

| ISP/上流 | 連絡先 | 対応内容 |
|----------|--------|----------|
| AWS | Shield DRT | L3/L4 DDoS緩和 |
| Cloudflare | Enterprise Support | L7 DDoS緩和 |
| NTT Communications | NOC緊急連絡先 | 上流BGPブラックホール |
| IIJ | SOC | トラフィックスクラビング |

---

## 5. 攻撃タイプ別対応

### 5.1 HTTP Flood対応

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          HTTP Flood Response                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  特徴:                                                                          │
│  - 大量のHTTP GET/POSTリクエスト                                               │
│  - 正常なHTTPリクエストに偽装                                                  │
│  - ボットネットからの分散攻撃                                                  │
│                                                                                  │
│  対策手順:                                                                      │
│  1. WAFレートリミット強化                                                      │
│  2. CAPTCHA/JS Challenge導入                                                   │
│  3. Bot検知ルール有効化                                                        │
│  4. 地理的制限検討                                                             │
│                                                                                  │
│  WAF追加ルール例:                                                               │
│  {                                                                               │
│    "Name": "HTTPFlood-JSChallenge",                                            │
│    "Statement": {                                                               │
│      "RateBasedStatement": {                                                    │
│        "Limit": 500,                                                            │
│        "AggregateKeyType": "IP"                                                │
│      }                                                                          │
│    },                                                                           │
│    "Action": {                                                                  │
│      "Challenge": {}                                                            │
│    }                                                                            │
│  }                                                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Slowloris対応

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Slowloris Response                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  特徴:                                                                          │
│  - 不完全なHTTPリクエストを長時間維持                                          │
│  - 接続を枯渇させる                                                            │
│  - 低帯域でも効果的                                                            │
│                                                                                  │
│  対策手順:                                                                      │
│  1. ALBアイドルタイムアウト短縮 (60s → 30s)                                    │
│  2. 接続ごとのリクエスト制限                                                   │
│  3. リクエストヘッダータイムアウト設定                                         │
│                                                                                  │
│  ALB設定変更:                                                                   │
│  aws elbv2 modify-load-balancer-attributes \                                    │
│    --load-balancer-arn $ALB_ARN \                                              │
│    --attributes Key=idle_timeout.timeout_seconds,Value=30                       │
│                                                                                  │
│  CloudFront Origin設定:                                                         │
│  - Origin Read Timeout: 30s (60sから短縮)                                      │
│  - Origin Keep-Alive Timeout: 5s                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Application Layer攻撃対応

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      Application Layer Attack Response                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  対象エンドポイント別対策:                                                      │
│                                                                                  │
│  /api/auth/login (ログインフラッド):                                           │
│  - レートリミット: 5 req/min/IP                                                │
│  - 3回失敗でCAPTCHA表示                                                        │
│  - 5回失敗で一時ブロック                                                       │
│                                                                                  │
│  /api/simulation/* (高負荷API):                                                │
│  - レートリミット: 10 req/min/user                                             │
│  - 認証必須                                                                     │
│  - リソース制限 (タイムアウト30s)                                              │
│                                                                                  │
│  /api/search/* (検索フラッド):                                                 │
│  - レートリミット: 30 req/min/IP                                               │
│  - 結果キャッシュ (5分)                                                        │
│  - クエリ複雑度制限                                                            │
│                                                                                  │
│  WAFカスタムルール例 (ログイン保護):                                           │
│  {                                                                               │
│    "Name": "LoginProtection",                                                   │
│    "Statement": {                                                               │
│      "AndStatement": {                                                          │
│        "Statements": [                                                          │
│          {                                                                      │
│            "ByteMatchStatement": {                                              │
│              "FieldToMatch": {"UriPath": {}},                                  │
│              "SearchString": "/api/auth/login",                                │
│              "PositionalConstraint": "EXACTLY"                                 │
│            }                                                                    │
│          },                                                                     │
│          {                                                                      │
│            "RateBasedStatement": {                                              │
│              "Limit": 5,                                                        │
│              "AggregateKeyType": "IP"                                          │
│            }                                                                    │
│          }                                                                      │
│        ]                                                                        │
│      }                                                                          │
│    },                                                                           │
│    "Action": {"Block": {}}                                                      │
│  }                                                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. 復旧手順

### 6.1 復旧チェックリスト

| # | チェック項目 | 確認方法 | 完了 |
|---|-------------|----------|------|
| 1 | 攻撃トラフィック減少確認 | CloudFrontメトリクス | ☐ |
| 2 | エラー率正常化 | CloudWatch (< 1%) | ☐ |
| 3 | レスポンスタイム正常化 | ALBメトリクス (< 200ms p99) | ☐ |
| 4 | WAFブロック率減少 | WAFメトリクス | ☐ |
| 5 | サービス正常動作確認 | スモークテスト | ☐ |

### 6.2 段階的復旧

```bash
#!/bin/bash
# DDoS Recovery - Gradual Restore
# Usage: ./ddos_recover.sh <phase: 1|2|3>

PHASE=$1
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

case $PHASE in
  "1")
    echo "[$TIMESTAMP] Phase 1: Monitoring (30分)"
    # 緊急設定維持、監視継続
    ;;

  "2")
    echo "[$TIMESTAMP] Phase 2: Gradual Restore"
    # WAFレートリミット緩和 (500 → 1000)
    ./waf_emergency.sh restore_partial

    # 地理的制限緩和（必要な場合）
    # ./cloudfront_emergency.sh restore_geo
    ;;

  "3")
    echo "[$TIMESTAMP] Phase 3: Full Restore"
    # WAFレートリミット通常化 (→ 2000)
    ./waf_emergency.sh restore_full

    # CloudFront設定復旧
    ./cloudfront_emergency.sh restore

    # 一時ブロックIPの再評価
    echo "Review blocked IPs in /var/log/incident/blocked_ips.log"
    ;;
esac
```

---

## 7. 訓練計画

### 7.1 DDoS対応演習

| 演習 | 頻度 | 参加者 | 内容 |
|------|------|--------|------|
| Tabletop演習 | 四半期 | CSIRT全員 | シナリオベースのディスカッション |
| WAF設定演習 | 月次 | Network Engineer, SOC | レートリミット変更手順確認 |
| Shield DRT演習 | 年次 | Network Engineer | DRT連携手順の実践 |
| フルシミュレーション | 年次 | 全チーム | 実際の攻撃シミュレーション |

### 7.2 訓練シナリオ例

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  DDoS Training Scenario: HTTP Flood Attack                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  シナリオ概要:                                                                  │
│  - 攻撃開始時刻: 平日 14:00 (業務時間)                                         │
│  - 攻撃種別: HTTP GET Flood                                                    │
│  - 攻撃規模: 100,000 req/sec                                                   │
│  - 攻撃元: 世界各地のボットネット (5,000+ IP)                                  │
│  - 対象: /api/search エンドポイント                                            │
│                                                                                  │
│  評価ポイント:                                                                  │
│  □ 検知までの時間 (目標: 5分以内)                                              │
│  □ 初動対応までの時間 (目標: 15分以内)                                         │
│  □ 適切なエスカレーション                                                      │
│  □ 緩和措置の効果                                                              │
│  □ コミュニケーション (ステークホルダー通知)                                   │
│  □ 文書化 (対応記録)                                                           │
│                                                                                  │
│  想定タイムライン:                                                              │
│  14:00 - 攻撃開始                                                              │
│  14:05 - CloudWatchアラート発報                                                │
│  14:10 - SOC Analyst初期評価開始                                               │
│  14:15 - Network Engineerエスカレーション                                      │
│  14:20 - WAFレートリミット強化                                                 │
│  14:30 - 攻撃緩和確認                                                          │
│  15:00 - 監視継続、段階的復旧検討                                              │
│  16:00 - 復旧完了、報告書作成                                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. 連絡先

### 8.1 内部連絡先

| 役割 | 連絡方法 | 連絡先 |
|------|----------|--------|
| SOC Analyst (当番) | Slack / PagerDuty | @soc-oncall |
| Network Engineer | PagerDuty | @network-oncall |
| CSIRT Team Leader | 電話 | (緊急連絡先) |
| CISO | 電話 | (緊急連絡先) |

### 8.2 外部連絡先

| 連絡先 | 用途 | 連絡先情報 |
|--------|------|-----------|
| AWS Enterprise Support | Shield DRT | AWS Console → Support |
| AWS Shield DRT | DDoS緊急対応 | proactive-response@aws |
| Cloudflare Enterprise | CDN緊急対応 | (契約書記載) |

---

## 9. 改訂履歴

| バージョン | 日付 | 変更内容 | 承認者 |
|-----------|------|----------|--------|
| 1.0 | 2025-12-11 | 初版作成 | Network Engineer |

---

**承認**

| 役職 | 氏名 | 署名 | 日付 |
|------|------|------|------|
| CSIRT Team Leader | | | |
| CISO | | | |
| Network Engineer | | | |
