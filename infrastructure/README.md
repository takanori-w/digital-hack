# LifePlan Navigator - Infrastructure

## 概要

LifePlan NavigatorのAWSインフラストラクチャをTerraformで管理します。

## ディレクトリ構成

```
infrastructure/
├── terraform/
│   ├── environments/           # 環境別設定
│   │   ├── development/        # 開発環境
│   │   ├── staging/            # ステージング環境
│   │   ├── production/         # 本番環境
│   │   └── dr/                 # DRリージョン
│   └── modules/                # 再利用可能なモジュール
│       ├── vpc/                # VPC・サブネット
│       ├── security-groups/    # セキュリティグループ
│       ├── alb/                # Application Load Balancer
│       ├── ecs/                # ECS Fargate
│       ├── rds/                # RDS PostgreSQL
│       ├── elasticache/        # ElastiCache Redis
│       ├── waf/                # AWS WAF
│       ├── cloudfront/         # CloudFront CDN
│       └── monitoring/         # CloudWatch
├── docker/                     # Dockerfiles
│   ├── Dockerfile.frontend     # Next.js Frontend
│   ├── Dockerfile.backend      # FastAPI Backend
│   ├── Dockerfile.worker       # Celery Worker
│   ├── docker-compose.yml      # ローカル開発用
│   └── docker-compose.prod.yml # 本番ビルドテスト用
├── scripts/                    # デプロイスクリプト
│   ├── deploy.sh               # Terraformデプロイ
│   └── build-and-push.sh       # Docker Build & ECR Push
└── README.md
```

## 前提条件

- Terraform >= 1.5.0
- AWS CLI >= 2.0
- Docker >= 24.0
- jq

## セットアップ

### 1. Terraformバックエンド作成

```bash
# S3バケット（状態管理用）
aws s3api create-bucket \
    --bucket lifeplan-terraform-state \
    --region ap-northeast-1 \
    --create-bucket-configuration LocationConstraint=ap-northeast-1

# バージョニング有効化
aws s3api put-bucket-versioning \
    --bucket lifeplan-terraform-state \
    --versioning-configuration Status=Enabled

# DynamoDBテーブル（ロック用）
aws dynamodb create-table \
    --table-name lifeplan-terraform-locks \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region ap-northeast-1
```

### 2. 環境変数設定

```bash
# terraform.tfvars.example をコピーして編集
cp terraform/environments/production/terraform.tfvars.example \
   terraform/environments/production/terraform.tfvars

# 必要な環境変数を設定
export TF_VAR_domain_name="lifeplan-navigator.example.com"
export TF_VAR_origin_verify_header="$(openssl rand -base64 32)"
```

## デプロイ手順

### 開発環境

```bash
# プラン確認
./scripts/deploy.sh -e development -a plan

# 適用
./scripts/deploy.sh -e development -a apply
```

### ステージング環境

```bash
./scripts/deploy.sh -e staging -a plan
./scripts/deploy.sh -e staging -a apply
```

### 本番環境

```bash
# 必ずプランを確認
./scripts/deploy.sh -e production -a plan

# 確認後、手動で適用（-y フラグは使用禁止）
./scripts/deploy.sh -e production -a apply
```

## Docker イメージビルド

### ローカルビルド

```bash
# 全イメージビルド
./scripts/build-and-push.sh -e development -t v1.0.0

# フロントエンドのみ
./scripts/build-and-push.sh --frontend-only -t latest
```

### ECRへプッシュ

```bash
# ステージング
./scripts/build-and-push.sh -e staging -t v1.0.0 -p

# 本番
./scripts/build-and-push.sh -e production -t v1.0.0 -p
```

## ローカル開発

```bash
cd infrastructure/docker

# 起動
docker-compose up -d

# ログ確認
docker-compose logs -f

# 停止
docker-compose down

# 全削除（データ含む）
docker-compose down -v
```

## 環境別設定

| 環境 | VPC CIDR | AZ数 | NAT GW | WAF | 用途 |
|------|----------|------|--------|-----|------|
| development | 10.10.0.0/16 | 2 | 1 | なし | 開発・テスト |
| staging | 10.20.0.0/16 | 3 | 2 | あり | リリース前検証 |
| production | 10.0.0.0/16 | 3 | 2 | あり | 本番運用 |
| dr | 10.1.0.0/16 | 3 | 2 | あり | 災害復旧 |

## セキュリティ

### ネットワーク構成

- **Public Subnet**: ALB, NAT Gateway, Bastion
- **Application Subnet**: ECS (Frontend/Backend/Worker)
- **Data Subnet**: RDS, ElastiCache, OpenSearch（インターネット接続不可）
- **Management Subnet**: VPCエンドポイント

### セキュリティグループ

- 最小権限の原則に基づいた厳格なルール
- データベースは特定のセキュリティグループからのみアクセス可能
- Bastionは VPN CIDR からのみ SSH 許可

### WAF ルール

- AWS Managed Rules (IP Reputation, CRS, SQLi, Known Bad Inputs)
- カスタムレートリミット (2000 req/5min/IP)
- ログイン/登録/パスワードリセット用の厳格なレートリミット

## トラブルシューティング

### Terraform

```bash
# 状態確認
cd terraform/environments/production
terraform state list

# 特定リソースの詳細
terraform state show module.vpc.aws_vpc.main

# 強制リフレッシュ
terraform refresh
```

### Docker

```bash
# コンテナログ
docker logs lifeplan-backend

# コンテナ内でシェル起動
docker exec -it lifeplan-backend /bin/bash

# イメージサイズ確認
docker images | grep lifeplan
```

## 関連ドキュメント

- [ネットワーク・インフラ設計書](../docs/lifeplan-navigator/05_network_infrastructure_design.md)
- [ファイアウォールポリシー](../docs/lifeplan-navigator/06_firewall_policy.md)

## 注意事項

1. **本番環境の変更は必ずCAB承認を得てから実施**
2. **terraform destroy は本番環境では自動実行禁止**
3. **機密情報（API キー、パスワード）は terraform.tfvars に直接記載せず、環境変数または Secrets Manager を使用**
