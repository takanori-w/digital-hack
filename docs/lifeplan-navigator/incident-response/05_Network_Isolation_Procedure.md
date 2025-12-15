# LifePlan Navigator - ネットワーク隔離手順書

**バージョン**: 1.0
**作成日**: 2025-12-11
**分類**: 機密 - インシデント対応用
**作成者**: Network Engineer
**関連文書**: 01_Incident_Response_Procedure.md

---

## 1. 概要

### 1.1 目的
本ドキュメントは、セキュリティインシデント発生時のネットワーク隔離手順を定義します。
迅速かつ適切な隔離により、被害の拡大を防止し、フォレンジック証拠を保全します。

### 1.2 適用範囲
- AWS VPC内の全リソース
- ECS Fargateタスク
- RDS/ElastiCache/OpenSearch
- ALB/CloudFront

### 1.3 隔離レベル定義

| レベル | 名称 | 説明 | 適用シナリオ |
|--------|------|------|-------------|
| L1 | 部分隔離 | 特定サービスへのアクセス制限 | 疑わしい活動の調査 |
| L2 | サービス隔離 | 特定サービス全体をネットワークから切断 | 侵害確認されたサービス |
| L3 | ゾーン隔離 | サブネット全体の隔離 | 複数サービス侵害 |
| L4 | 完全隔離 | VPC全体のインターネット遮断 | 大規模侵害、データ流出防止 |

---

## 2. 事前準備

### 2.1 隔離用Security Group（事前作成済み）

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Quarantine Security Groups (事前作成済み)                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  sg-quarantine-full                                                             │
│  ├── Inbound:  なし（全拒否）                                                  │
│  ├── Outbound: なし（全拒否）                                                  │
│  └── 用途: 完全隔離（フォレンジック用）                                        │
│                                                                                  │
│  sg-quarantine-forensic                                                         │
│  ├── Inbound:  SSH(22) from sg-bastion                                         │
│  ├── Outbound: なし（全拒否）                                                  │
│  └── 用途: フォレンジック調査用（踏み台経由でのみアクセス可能）               │
│                                                                                  │
│  sg-quarantine-logging                                                          │
│  ├── Inbound:  なし（全拒否）                                                  │
│  ├── Outbound: HTTPS(443) to VPC Endpoints only                                │
│  └── 用途: ログ送信のみ許可（CloudWatch等へ）                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 隔離用Terraform設定

```hcl
# 隔離用Security Groups（事前にapply済み）
resource "aws_security_group" "quarantine_full" {
  name        = "lifeplan-quarantine-full"
  description = "Complete isolation - no traffic allowed"
  vpc_id      = aws_vpc.main.id

  # インバウンド/アウトバウンドルールなし = 全拒否

  tags = {
    Name    = "lifeplan-quarantine-full"
    Purpose = "incident-response"
    Type    = "quarantine"
  }
}

resource "aws_security_group" "quarantine_forensic" {
  name        = "lifeplan-quarantine-forensic"
  description = "Forensic access only via bastion"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "SSH from Bastion for forensics"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  # アウトバウンドなし

  tags = {
    Name    = "lifeplan-quarantine-forensic"
    Purpose = "incident-response"
    Type    = "quarantine"
  }
}

resource "aws_security_group" "quarantine_logging" {
  name        = "lifeplan-quarantine-logging"
  description = "Logging only - outbound to VPC endpoints"
  vpc_id      = aws_vpc.main.id

  egress {
    description     = "CloudWatch Logs via VPC Endpoint"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.vpce.id]
  }

  tags = {
    Name    = "lifeplan-quarantine-logging"
    Purpose = "incident-response"
    Type    = "quarantine"
  }
}
```

---

## 3. 隔離手順

### 3.1 Level 1: 部分隔離（特定接続の遮断）

**シナリオ**: 特定IPからの不審なアクセスを遮断

#### 手順
```bash
# Step 1: 不審IPの特定（VPC Flow Logs分析済み）
SUSPICIOUS_IP="203.0.113.100"

# Step 2: WAFにIPブロックルール追加
aws wafv2 update-ip-set \
  --name lifeplan-blocked-ips \
  --scope CLOUDFRONT \
  --id $IP_SET_ID \
  --addresses "$SUSPICIOUS_IP/32" \
  --lock-token $LOCK_TOKEN

# Step 3: Security Groupへの即時ブロック追加（NACLでも可）
# ※ WAF適用前の通信を遮断
aws ec2 authorize-security-group-ingress \
  --group-id sg-alb-xxxx \
  --ip-permissions "IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges=[{CidrIp=$SUSPICIOUS_IP/32,Description=BLOCKED-$(date +%Y%m%d-%H%M)}]" \
  2>/dev/null || echo "Rule may already exist"

# ※ AWS SGにはDenyルールがないため、NACLでブロック
aws ec2 create-network-acl-entry \
  --network-acl-id acl-public-xxxx \
  --rule-number 50 \
  --protocol tcp \
  --port-range From=443,To=443 \
  --cidr-block "$SUSPICIOUS_IP/32" \
  --rule-action deny \
  --ingress

# Step 4: ブロック確認
aws wafv2 get-ip-set --name lifeplan-blocked-ips --scope CLOUDFRONT --id $IP_SET_ID

# Step 5: アラートとログ
echo "[$(date)] BLOCKED IP: $SUSPICIOUS_IP - Reason: Suspicious activity" >> /var/log/incident/isolation.log
```

#### ロールバック
```bash
# NACLルール削除
aws ec2 delete-network-acl-entry \
  --network-acl-id acl-public-xxxx \
  --rule-number 50 \
  --ingress

# WAF IPセットから削除
# ※ 現在のリストから該当IPを除外したリストで更新
```

---

### 3.2 Level 2: サービス隔離（ECSタスク隔離）

**シナリオ**: 侵害されたコンテナを隔離

#### 手順

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ECS Task Isolation Flow                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [1] タスク特定        [2] SG変更           [3] 新タスク起動                   │
│       │                      │                     │                            │
│       ▼                      ▼                     ▼                            │
│  ┌──────────┐          ┌──────────┐          ┌──────────┐                      │
│  │ Identify │───────►  │ Attach   │          │ Service  │                      │
│  │ Task ID  │          │ Quarantine│         │ Update   │                      │
│  │          │          │ SG       │          │ (Replace)│                      │
│  └──────────┘          └──────────┘          └──────────┘                      │
│       │                      │                     │                            │
│       │                      ▼                     ▼                            │
│       │               ┌──────────┐          ┌──────────┐                      │
│       │               │ Remove   │          │ New Task │                      │
│       └──────────────►│ Original │          │ Healthy  │                      │
│                       │ SG       │          │          │                      │
│                       └──────────┘          └──────────┘                      │
│                              │                     │                            │
│                              ▼                     │                            │
│                       ┌──────────┐                │                            │
│                       │ Task     │◄───────────────┘                            │
│                       │ Isolated │                                              │
│                       │ (Running)│  ← フォレンジック用に稼働継続               │
│                       └──────────┘                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### コマンド例
```bash
#!/bin/bash
# ECS Task Isolation Script
# Usage: ./isolate_ecs_task.sh <cluster-name> <service-name> <task-id>

CLUSTER=$1
SERVICE=$2
TASK_ID=$3
QUARANTINE_SG="sg-quarantine-forensic"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "[$TIMESTAMP] Starting isolation of task: $TASK_ID"

# Step 1: タスク情報取得
TASK_INFO=$(aws ecs describe-tasks --cluster $CLUSTER --tasks $TASK_ID --query 'tasks[0]')
TASK_ENI=$(echo $TASK_INFO | jq -r '.attachments[0].details[] | select(.name=="networkInterfaceId") | .value')
CURRENT_SG=$(aws ec2 describe-network-interfaces --network-interface-ids $TASK_ENI --query 'NetworkInterfaces[0].Groups[*].GroupId' --output text)

echo "Task ENI: $TASK_ENI"
echo "Current SG: $CURRENT_SG"

# Step 2: 隔離用SGに変更
aws ec2 modify-network-interface-attribute \
  --network-interface-id $TASK_ENI \
  --groups $QUARANTINE_SG

echo "[$TIMESTAMP] Task $TASK_ID isolated with SG: $QUARANTINE_SG"

# Step 3: サービスの新タスク起動（隔離タスクの代替）
aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --force-new-deployment

echo "[$TIMESTAMP] Service $SERVICE updated - new healthy tasks will be deployed"

# Step 4: 隔離タスクのメタデータ保存
echo "{
  \"timestamp\": \"$TIMESTAMP\",
  \"task_id\": \"$TASK_ID\",
  \"task_eni\": \"$TASK_ENI\",
  \"original_sg\": \"$CURRENT_SG\",
  \"quarantine_sg\": \"$QUARANTINE_SG\",
  \"cluster\": \"$CLUSTER\",
  \"service\": \"$SERVICE\"
}" > /var/log/incident/isolated_task_${TASK_ID}_${TIMESTAMP}.json

# Step 5: CloudWatch Logsにイベント記録
aws logs put-log-events \
  --log-group-name /lifeplan/incident-response \
  --log-stream-name network-isolation \
  --log-events timestamp=$(date +%s000),message="TASK_ISOLATED: $TASK_ID"

echo "[$TIMESTAMP] Isolation complete. Task is running in isolated state for forensics."
```

#### サービス影響評価

| コンポーネント | 影響 | 対策 |
|---------------|------|------|
| Frontend | 1タスク停止時: 影響なし（他タスクが処理） | Auto Scaling有効 |
| Backend | 1タスク停止時: 影響なし | 新タスク自動起動 |
| Worker | ジョブ処理遅延の可能性 | キューで遅延吸収 |

---

### 3.3 Level 3: ゾーン隔離（サブネット隔離）

**シナリオ**: アプリケーションサブネット全体が侵害された可能性

#### 手順

```bash
#!/bin/bash
# Subnet Isolation Script
# Usage: ./isolate_subnet.sh <subnet-id> <reason>

SUBNET_ID=$1
REASON=$2
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ISOLATION_NACL="acl-isolation-xxxx"  # 事前作成済み

echo "[$TIMESTAMP] CRITICAL: Starting subnet isolation: $SUBNET_ID"
echo "Reason: $REASON"

# Step 1: 現在のNACL関連付けを保存
CURRENT_NACL=$(aws ec2 describe-network-acls \
  --filters "Name=association.subnet-id,Values=$SUBNET_ID" \
  --query 'NetworkAcls[0].NetworkAclId' --output text)
ASSOCIATION_ID=$(aws ec2 describe-network-acls \
  --filters "Name=association.subnet-id,Values=$SUBNET_ID" \
  --query 'NetworkAcls[0].Associations[?SubnetId==`'$SUBNET_ID'`].NetworkAclAssociationId' --output text)

echo "Current NACL: $CURRENT_NACL"
echo "Association ID: $ASSOCIATION_ID"

# Step 2: ロールバック情報の保存
echo "{
  \"timestamp\": \"$TIMESTAMP\",
  \"subnet_id\": \"$SUBNET_ID\",
  \"original_nacl\": \"$CURRENT_NACL\",
  \"association_id\": \"$ASSOCIATION_ID\",
  \"reason\": \"$REASON\"
}" > /var/log/incident/subnet_isolation_${SUBNET_ID}_${TIMESTAMP}.json

# Step 3: 隔離用NACLに関連付け変更
aws ec2 replace-network-acl-association \
  --association-id $ASSOCIATION_ID \
  --network-acl-id $ISOLATION_NACL

echo "[$TIMESTAMP] Subnet $SUBNET_ID now associated with isolation NACL: $ISOLATION_NACL"

# Step 4: ALBターゲット登録解除（サービス継続用）
# ※ 該当サブネットのターゲットを解除
aws elbv2 describe-target-health \
  --target-group-arn $TARGET_GROUP_ARN \
  --query 'TargetHealthDescriptions[?TargetHealth.State==`healthy`].Target.Id' \
  --output text | while read TARGET; do
  # ターゲットのサブネット確認
  TARGET_SUBNET=$(aws ec2 describe-network-interfaces \
    --filters "Name=private-ip-address,Values=$TARGET" \
    --query 'NetworkInterfaces[0].SubnetId' --output text)
  if [ "$TARGET_SUBNET" == "$SUBNET_ID" ]; then
    aws elbv2 deregister-targets \
      --target-group-arn $TARGET_GROUP_ARN \
      --targets Id=$TARGET
    echo "Deregistered target: $TARGET from target group"
  fi
done

# Step 5: エスカレーション通知
aws sns publish \
  --topic-arn arn:aws:sns:ap-northeast-1:ACCOUNT_ID:incident-critical \
  --subject "[CRITICAL] Subnet Isolated: $SUBNET_ID" \
  --message "Subnet $SUBNET_ID has been isolated due to: $REASON. Time: $TIMESTAMP"

echo "[$TIMESTAMP] Subnet isolation complete. Services in other subnets continue to operate."
```

#### 隔離用NACL設定
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  NACL: acl-isolation (隔離用)                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  INBOUND RULES:                                                                 │
│  ┌──────┬──────────┬──────────┬──────────────┬────────────────────┬──────────┐│
│  │ Rule │ Type     │ Protocol │ Port Range   │ Source             │ Action   ││
│  ├──────┼──────────┼──────────┼──────────────┼────────────────────┼──────────┤│
│  │ 100  │ SSH      │ TCP (6)  │ 22           │ 10.0.48.0/22       │ ALLOW    ││
│  │      │          │          │              │ (Management CIDR)  │          ││
│  │ *    │ ALL      │ ALL      │ ALL          │ 0.0.0.0/0          │ DENY     ││
│  └──────┴──────────┴──────────┴──────────────┴────────────────────┴──────────┘│
│                                                                                  │
│  OUTBOUND RULES:                                                                │
│  ┌──────┬──────────┬──────────┬──────────────┬────────────────────┬──────────┐│
│  │ Rule │ Type     │ Protocol │ Port Range   │ Destination        │ Action   ││
│  ├──────┼──────────┼──────────┼──────────────┼────────────────────┼──────────┤│
│  │ 100  │ HTTPS    │ TCP (6)  │ 443          │ 10.0.48.0/22       │ ALLOW    ││
│  │      │          │          │              │ (VPC Endpoint CIDR)│          ││
│  │ *    │ ALL      │ ALL      │ ALL          │ 0.0.0.0/0          │ DENY     ││
│  └──────┴──────────┴──────────┴──────────────┴────────────────────┴──────────┘│
│                                                                                  │
│  ※ 管理サブネットからのSSHとVPCエンドポイントへのログ送信のみ許可            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.4 Level 4: 完全隔離（VPC全体）

**シナリオ**: 大規模侵害、データ流出の緊急停止

#### 手順

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  VPC Complete Isolation Procedure                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ⚠️ 警告: この操作はサービス全停止を引き起こします                              │
│  ⚠️ CISO + CTO の承認が必須です                                                 │
│                                                                                  │
│  Phase 1: 承認取得 (必須)                                                       │
│  ├── CISO承認: ______________ (署名/日時)                                      │
│  └── CTO承認:  ______________ (署名/日時)                                      │
│                                                                                  │
│  Phase 2: サービス停止アナウンス                                                │
│  └── 顧客・ステークホルダーへの緊急通知                                        │
│                                                                                  │
│  Phase 3: 隔離実行                                                              │
│  ├── Step 1: CloudFront → ALBルーティング停止                                  │
│  ├── Step 2: Internet Gateway デタッチ                                         │
│  ├── Step 3: NAT Gateway 削除                                                  │
│  ├── Step 4: 全Security Group → 隔離SG変更                                     │
│  └── Step 5: VPN/踏み台経由でのみアクセス可能に                                │
│                                                                                  │
│  Phase 4: 証拠保全                                                              │
│  ├── EBSスナップショット取得                                                   │
│  ├── RDSスナップショット取得                                                   │
│  └── CloudWatch Logs エクスポート                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 完全隔離スクリプト
```bash
#!/bin/bash
# CRITICAL: VPC Complete Isolation
# This script requires CISO + CTO approval

# 二重確認
echo "⚠️  WARNING: This will completely isolate the VPC and stop all services."
echo "⚠️  Approval required from CISO and CTO."
read -p "Enter CISO approval code: " CISO_CODE
read -p "Enter CTO approval code: " CTO_CODE

# 承認コード検証（実際の実装では認証システムと連携）
if [ "$CISO_CODE" != "$EXPECTED_CISO_CODE" ] || [ "$CTO_CODE" != "$EXPECTED_CTO_CODE" ]; then
  echo "ERROR: Invalid approval codes. Aborting."
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
VPC_ID="vpc-lifeplan-production"

echo "[$TIMESTAMP] CRITICAL: Starting VPC complete isolation"

# Step 1: CloudFront Origin停止（503を返す）
aws cloudfront update-distribution \
  --id $CLOUDFRONT_ID \
  --if-match $ETAG \
  --distribution-config file://cloudfront-maintenance-config.json

# Step 2: Internet Gateway デタッチ
IGW_ID=$(aws ec2 describe-internet-gateways \
  --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
  --query 'InternetGateways[0].InternetGatewayId' --output text)
aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID

echo "[$TIMESTAMP] Internet Gateway detached: $IGW_ID"

# Step 3: NAT Gateway削除
NAT_GWS=$(aws ec2 describe-nat-gateways \
  --filter "Name=vpc-id,Values=$VPC_ID" "Name=state,Values=available" \
  --query 'NatGateways[*].NatGatewayId' --output text)
for NAT in $NAT_GWS; do
  aws ec2 delete-nat-gateway --nat-gateway-id $NAT
  echo "NAT Gateway deleted: $NAT"
done

# Step 4: 状態保存
echo "{
  \"timestamp\": \"$TIMESTAMP\",
  \"vpc_id\": \"$VPC_ID\",
  \"igw_id\": \"$IGW_ID\",
  \"nat_gateways\": \"$NAT_GWS\",
  \"ciso_approval\": \"$CISO_CODE\",
  \"cto_approval\": \"$CTO_CODE\"
}" > /var/log/incident/vpc_isolation_${TIMESTAMP}.json

# Step 5: 緊急通知
aws sns publish \
  --topic-arn arn:aws:sns:ap-northeast-1:ACCOUNT_ID:incident-critical \
  --subject "[CRITICAL] VPC ISOLATED - All services stopped" \
  --message "VPC $VPC_ID has been completely isolated at $TIMESTAMP. Approved by CISO and CTO."

echo "[$TIMESTAMP] VPC isolation complete. All external connectivity terminated."
echo "Access only available via VPN → Bastion"
```

---

## 4. 隔離解除手順

### 4.1 解除前チェックリスト

| # | チェック項目 | 確認者 | 完了 |
|---|-------------|--------|------|
| 1 | フォレンジック調査完了 | CSIRT Engineer | ☐ |
| 2 | 侵害の根本原因特定 | CTI Analyst | ☐ |
| 3 | 脆弱性の修正完了 | App/Network Engineer | ☐ |
| 4 | マルウェア駆除確認 | CSIRT Engineer | ☐ |
| 5 | 新規イメージでのデプロイ | App Engineer | ☐ |
| 6 | セキュリティスキャン合格 | SOC Analyst | ☐ |
| 7 | CSIRT Leader承認 | CSIRT Team Leader | ☐ |

### 4.2 段階的解除手順

```bash
#!/bin/bash
# Network Isolation Release Script
# Usage: ./release_isolation.sh <isolation-record-file>

RECORD_FILE=$1
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# 隔離記録の読み込み
ISOLATION_INFO=$(cat $RECORD_FILE)
ISOLATION_TYPE=$(echo $ISOLATION_INFO | jq -r '.type')

case $ISOLATION_TYPE in
  "task")
    TASK_ID=$(echo $ISOLATION_INFO | jq -r '.task_id')
    TASK_ENI=$(echo $ISOLATION_INFO | jq -r '.task_eni')
    ORIGINAL_SG=$(echo $ISOLATION_INFO | jq -r '.original_sg')

    # 元のSGに戻す（通常は新タスクが既に稼働中なので、隔離タスクは停止）
    echo "Stopping isolated task: $TASK_ID"
    aws ecs stop-task --cluster $CLUSTER --task $TASK_ID --reason "Forensics complete - task replaced"
    ;;

  "subnet")
    SUBNET_ID=$(echo $ISOLATION_INFO | jq -r '.subnet_id')
    ORIGINAL_NACL=$(echo $ISOLATION_INFO | jq -r '.original_nacl')

    # 元のNACLに戻す
    CURRENT_ASSOCIATION=$(aws ec2 describe-network-acls \
      --filters "Name=association.subnet-id,Values=$SUBNET_ID" \
      --query 'NetworkAcls[0].Associations[?SubnetId==`'$SUBNET_ID'`].NetworkAclAssociationId' --output text)

    aws ec2 replace-network-acl-association \
      --association-id $CURRENT_ASSOCIATION \
      --network-acl-id $ORIGINAL_NACL

    echo "[$TIMESTAMP] Subnet $SUBNET_ID restored to NACL: $ORIGINAL_NACL"
    ;;

  "vpc")
    # VPC完全隔離の解除は手動で実施（IGW再接続、NAT GW再作成等）
    echo "VPC isolation release requires manual steps. See runbook."
    ;;
esac

# 解除記録
echo "{
  \"release_timestamp\": \"$TIMESTAMP\",
  \"isolation_record\": $ISOLATION_INFO,
  \"release_status\": \"completed\"
}" > /var/log/incident/release_${TIMESTAMP}.json

echo "[$TIMESTAMP] Isolation release complete."
```

---

## 5. サービス影響評価マトリクス

### 5.1 隔離レベル別影響

| 隔離レベル | ユーザー影響 | データ影響 | 復旧時間 |
|-----------|-------------|-----------|----------|
| L1 (部分) | なし～軽微 | なし | 即時 |
| L2 (サービス) | 一部機能低下 | なし | 5-15分 |
| L3 (ゾーン) | 部分停止 | なし | 15-60分 |
| L4 (完全) | 全停止 | バックアップ依存 | 2-4時間 |

### 5.2 コンポーネント別復旧優先度

| 優先度 | コンポーネント | 理由 |
|--------|---------------|------|
| 1 | RDS | データの整合性が最重要 |
| 2 | Backend API | 全機能の基盤 |
| 3 | Redis | セッション・キャッシュ復旧 |
| 4 | Frontend | ユーザーインターフェース |
| 5 | Worker | バックグラウンド処理は後回し可 |

---

## 6. 連絡先・エスカレーション

### 6.1 隔離実行時の連絡先

| レベル | 連絡先 | 連絡方法 |
|--------|--------|----------|
| L1/L2 | SOC Analyst | Slack #incident-response |
| L2/L3 | CSIRT Team Leader | PagerDuty |
| L3/L4 | CISO + CTO | 電話 (緊急連絡網) |

### 6.2 外部連絡先

| 連絡先 | 用途 | 連絡先情報 |
|--------|------|-----------|
| AWS Support | AWSリソース関連 | Enterprise Support |
| Cloudflare | CDN/DDoS対応 | support@cloudflare.com |
| ISP | 上流遮断依頼 | 緊急連絡先（別紙） |

---

## 7. 改訂履歴

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
