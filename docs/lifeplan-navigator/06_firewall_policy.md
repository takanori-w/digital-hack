# LifePlan Navigator - ファイアウォールポリシー

**バージョン**: 1.0
**作成日**: 2025-12-11
**分類**: 機密 - 社内限定
**準拠規格**: NIST SP 800-41, CIS Controls v8

---

## 1. 概要

### 1.1 目的
本ドキュメントは、LifePlan Navigatorのネットワークファイアウォールポリシーを定義し、最小権限の原則に基づいたトラフィック制御を実現します。

### 1.2 適用範囲
- AWS Security Groups
- Network ACLs
- AWS WAF Rules
- ALB/CloudFront Rules

### 1.3 ポリシー原則
1. **Deny All, Permit by Exception**: デフォルトで全て拒否、必要なもののみ許可
2. **最小権限**: 業務に必要最小限のアクセスのみ許可
3. **多層防御**: 複数レイヤーでのフィルタリング
4. **監査可能性**: 全ルールの理由と承認者を記録

---

## 2. ネットワークゾーン定義

### 2.1 ゾーン構成

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Zone Architecture                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Zone 0: INTERNET (Untrusted)                                                   │
│  ├── 信頼レベル: 0 (最低)                                                       │
│  ├── アクセス元: 全世界                                                         │
│  └── 許可通信: HTTPS(443)のみ → Zone 1                                         │
│                                                                                  │
│  Zone 1: DMZ (Semi-Trusted)                                                     │
│  ├── 信頼レベル: 25                                                             │
│  ├── コンポーネント: ALB, NAT Gateway, Bastion                                  │
│  ├── 許可通信 (In):  HTTPS(443), HTTP(80) from Zone 0                          │
│  └── 許可通信 (Out): 3000, 8000 → Zone 2                                       │
│                                                                                  │
│  Zone 2: APPLICATION (Trusted)                                                  │
│  ├── 信頼レベル: 50                                                             │
│  ├── コンポーネント: ECS (Frontend, Backend, Workers)                          │
│  ├── 許可通信 (In):  3000, 8000 from Zone 1                                    │
│  └── 許可通信 (Out): 5432, 6379, 443 → Zone 3                                  │
│                                                                                  │
│  Zone 3: DATA (Highly Trusted)                                                  │
│  ├── 信頼レベル: 75                                                             │
│  ├── コンポーネント: RDS, ElastiCache, OpenSearch                              │
│  ├── 許可通信 (In):  DB ports from Zone 2 only                                 │
│  └── 許可通信 (Out): なし (インターネット接続不可)                             │
│                                                                                  │
│  Zone 4: MANAGEMENT (Most Trusted)                                              │
│  ├── 信頼レベル: 100                                                            │
│  ├── コンポーネント: SSM, CloudWatch, Secrets Manager                          │
│  ├── 許可通信 (In):  VPC Endpoint経由のみ                                      │
│  └── 許可通信 (Out): AWS Services                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 ゾーン間通信マトリクス

```
                    ┌──────────┬──────────┬──────────┬──────────┬──────────┐
                    │ Internet │   DMZ    │   APP    │   DATA   │   MGMT   │
┌───────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Internet (Zone 0) │    -     │  443,80  │    ✗     │    ✗     │    ✗     │
├───────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ DMZ (Zone 1)      │   443*   │    -     │ 3000,8000│    ✗     │    ✗     │
├───────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ APP (Zone 2)      │   443*   │    ✗     │    -     │5432,6379 │   443    │
│                   │          │          │          │   443    │          │
├───────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ DATA (Zone 3)     │    ✗     │    ✗     │    ✗     │    -     │    ✗     │
├───────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ MGMT (Zone 4)     │    ✗     │    ✗     │   443    │   443    │    -     │
└───────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

凡例:
✗     : 通信禁止
443*  : NAT Gateway経由（外部API呼び出し用）
数字  : 許可ポート番号
```

---

## 3. Security Group ポリシー

### 3.1 sg-alb (Application Load Balancer)

**目的**: 外部からのHTTPS接続を受け付け、内部サービスに転送

#### Inbound Rules
| Rule ID | Type | Protocol | Port | Source | Description | 承認者 | 承認日 |
|---------|------|----------|------|--------|-------------|--------|--------|
| ALB-IN-001 | HTTPS | TCP | 443 | pl-cloudfront* | CloudFront経由のHTTPS | Network Eng | 2025-12-11 |
| ALB-IN-002 | HTTP | TCP | 80 | pl-cloudfront* | HTTPS Redirect用 | Network Eng | 2025-12-11 |

*pl-cloudfront: AWS管理プレフィックスリスト (com.amazonaws.global.cloudfront.origin-facing)

#### Outbound Rules
| Rule ID | Type | Protocol | Port | Destination | Description | 承認者 | 承認日 |
|---------|------|----------|------|-------------|-------------|--------|--------|
| ALB-OUT-001 | Custom | TCP | 3000 | sg-frontend | Frontend転送 | Network Eng | 2025-12-11 |
| ALB-OUT-002 | Custom | TCP | 8000 | sg-backend | Backend転送 | Network Eng | 2025-12-11 |

```hcl
# Terraform例
resource "aws_security_group" "alb" {
  name        = "lifeplan-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTPS from CloudFront"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }

  ingress {
    description     = "HTTP for redirect"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }

  egress {
    description     = "To Frontend"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend.id]
  }

  egress {
    description     = "To Backend"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  tags = {
    Name        = "lifeplan-alb-sg"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
```

---

### 3.2 sg-frontend (Next.js Frontend)

**目的**: ALBからのリクエストを受け付け、静的コンテンツ/SSRを提供

#### Inbound Rules
| Rule ID | Type | Protocol | Port | Source | Description | 承認者 | 承認日 |
|---------|------|----------|------|--------|-------------|--------|--------|
| FE-IN-001 | Custom | TCP | 3000 | sg-alb | ALBからの転送 | Network Eng | 2025-12-11 |

#### Outbound Rules
| Rule ID | Type | Protocol | Port | Destination | Description | 承認者 | 承認日 |
|---------|------|----------|------|-------------|-------------|--------|--------|
| FE-OUT-001 | Custom | TCP | 8000 | sg-backend | Backend API呼び出し | Network Eng | 2025-12-11 |
| FE-OUT-002 | HTTPS | TCP | 443 | sg-vpce | VPCエンドポイント | Network Eng | 2025-12-11 |
| FE-OUT-003 | HTTPS | TCP | 443 | 0.0.0.0/0 | 外部API (NAT経由) | Network Eng | 2025-12-11 |

```hcl
resource "aws_security_group" "frontend" {
  name        = "lifeplan-frontend-sg"
  description = "Security group for Frontend ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "From ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description     = "To Backend"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  egress {
    description     = "To VPC Endpoints"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.vpce.id]
  }

  egress {
    description = "External APIs via NAT"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "lifeplan-frontend-sg"
    Environment = "production"
  }
}
```

---

### 3.3 sg-backend (FastAPI Backend)

**目的**: APIリクエストを処理し、データベースにアクセス

#### Inbound Rules
| Rule ID | Type | Protocol | Port | Source | Description | 承認者 | 承認日 |
|---------|------|----------|------|--------|-------------|--------|--------|
| BE-IN-001 | Custom | TCP | 8000 | sg-alb | ALBからの転送 | Network Eng | 2025-12-11 |
| BE-IN-002 | Custom | TCP | 8000 | sg-frontend | Frontendからの呼び出し | Network Eng | 2025-12-11 |

#### Outbound Rules
| Rule ID | Type | Protocol | Port | Destination | Description | 承認者 | 承認日 |
|---------|------|----------|------|-------------|-------------|--------|--------|
| BE-OUT-001 | PostgreSQL | TCP | 5432 | sg-rds | データベース接続 | Network Eng | 2025-12-11 |
| BE-OUT-002 | Custom | TCP | 6379 | sg-redis | キャッシュ接続 | Network Eng | 2025-12-11 |
| BE-OUT-003 | HTTPS | TCP | 443 | sg-opensearch | 検索エンジン接続 | Network Eng | 2025-12-11 |
| BE-OUT-004 | HTTPS | TCP | 443 | sg-vpce | VPCエンドポイント | Network Eng | 2025-12-11 |
| BE-OUT-005 | HTTPS | TCP | 443 | 0.0.0.0/0 | 外部API (e-Stat等) | Network Eng | 2025-12-11 |

---

### 3.4 sg-worker (Celery Workers)

**目的**: バックグラウンドジョブの実行

#### Inbound Rules
| Rule ID | Type | Protocol | Port | Source | Description | 承認者 | 承認日 |
|---------|------|----------|------|--------|-------------|--------|--------|
| なし | - | - | - | - | Workerはインバウンド不要 | - | - |

#### Outbound Rules
| Rule ID | Type | Protocol | Port | Destination | Description | 承認者 | 承認日 |
|---------|------|----------|------|-------------|-------------|--------|--------|
| WK-OUT-001 | PostgreSQL | TCP | 5432 | sg-rds | データベース接続 | Network Eng | 2025-12-11 |
| WK-OUT-002 | Custom | TCP | 6379 | sg-redis | ジョブキュー接続 | Network Eng | 2025-12-11 |
| WK-OUT-003 | HTTPS | TCP | 443 | sg-opensearch | 検索インデックス更新 | Network Eng | 2025-12-11 |
| WK-OUT-004 | HTTPS | TCP | 443 | sg-vpce | VPCエンドポイント | Network Eng | 2025-12-11 |
| WK-OUT-005 | HTTPS | TCP | 443 | 0.0.0.0/0 | 外部API呼び出し | Network Eng | 2025-12-11 |

---

### 3.5 sg-rds (PostgreSQL Database)

**目的**: データベースへのアクセス制御（最も厳格）

#### Inbound Rules
| Rule ID | Type | Protocol | Port | Source | Description | 承認者 | 承認日 |
|---------|------|----------|------|--------|-------------|--------|--------|
| RDS-IN-001 | PostgreSQL | TCP | 5432 | sg-backend | Backend接続 | DBA/CISO | 2025-12-11 |
| RDS-IN-002 | PostgreSQL | TCP | 5432 | sg-worker | Worker接続 | DBA/CISO | 2025-12-11 |
| RDS-IN-003 | PostgreSQL | TCP | 5432 | sg-bastion | 踏み台経由の管理 | DBA/CISO | 2025-12-11 |

#### Outbound Rules
| Rule ID | Type | Protocol | Port | Destination | Description | 承認者 | 承認日 |
|---------|------|----------|------|-------------|-------------|--------|--------|
| なし | - | - | - | - | DBはアウトバウンド不要 | - | - |

```hcl
resource "aws_security_group" "rds" {
  name        = "lifeplan-rds-sg"
  description = "Security group for RDS PostgreSQL - STRICTLY CONTROLLED"
  vpc_id      = aws_vpc.main.id

  # インターネットアクセス完全禁止
  # アウトバウンドルールなし

  tags = {
    Name         = "lifeplan-rds-sg"
    Environment  = "production"
    DataClass    = "confidential"
    ApprovedBy   = "CISO"
    ApprovalDate = "2025-12-11"
  }
}

# 個別のルール追加（監査用に分離）
resource "aws_security_group_rule" "rds_from_backend" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = aws_security_group.backend.id
  description              = "RDS-IN-001: Backend access to PostgreSQL"
}

resource "aws_security_group_rule" "rds_from_worker" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = aws_security_group.worker.id
  description              = "RDS-IN-002: Worker access to PostgreSQL"
}

resource "aws_security_group_rule" "rds_from_bastion" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = aws_security_group.bastion.id
  description              = "RDS-IN-003: Bastion access for maintenance"
}
```

---

### 3.6 sg-redis (ElastiCache)

**目的**: キャッシュおよびセッション管理

#### Inbound Rules
| Rule ID | Type | Protocol | Port | Source | Description | 承認者 | 承認日 |
|---------|------|----------|------|--------|-------------|--------|--------|
| REDIS-IN-001 | Custom | TCP | 6379 | sg-backend | Backend接続 | Network Eng | 2025-12-11 |
| REDIS-IN-002 | Custom | TCP | 6379 | sg-worker | Worker接続 | Network Eng | 2025-12-11 |

#### Outbound Rules
| Rule ID | Type | Protocol | Port | Destination | Description | 承認者 | 承認日 |
|---------|------|----------|------|-------------|-------------|--------|--------|
| なし | - | - | - | - | Redisはアウトバウンド不要 | - | - |

---

### 3.7 sg-opensearch (OpenSearch Service)

**目的**: 全文検索サービス

#### Inbound Rules
| Rule ID | Type | Protocol | Port | Source | Description | 承認者 | 承認日 |
|---------|------|----------|------|--------|-------------|--------|--------|
| OS-IN-001 | HTTPS | TCP | 443 | sg-backend | Backend接続 | Network Eng | 2025-12-11 |
| OS-IN-002 | HTTPS | TCP | 443 | sg-worker | Worker接続 | Network Eng | 2025-12-11 |

#### Outbound Rules
| Rule ID | Type | Protocol | Port | Destination | Description | 承認者 | 承認日 |
|---------|------|----------|------|-------------|-------------|--------|--------|
| なし | - | - | - | - | OpenSearchはアウトバウンド不要 | - | - |

---

### 3.8 sg-bastion (踏み台サーバー)

**目的**: 管理者による本番環境へのセキュアなアクセス

#### Inbound Rules
| Rule ID | Type | Protocol | Port | Source | Description | 承認者 | 承認日 |
|---------|------|----------|------|--------|-------------|--------|--------|
| BST-IN-001 | SSH | TCP | 22 | 管理者VPN CIDR | VPN経由の管理アクセス | CISO | 2025-12-11 |

※ 管理者VPN CIDR: 203.0.113.0/24 (例)

#### Outbound Rules
| Rule ID | Type | Protocol | Port | Destination | Description | 承認者 | 承認日 |
|---------|------|----------|------|-------------|-------------|--------|--------|
| BST-OUT-001 | PostgreSQL | TCP | 5432 | sg-rds | DBメンテナンス | DBA/CISO | 2025-12-11 |
| BST-OUT-002 | Custom | TCP | 6379 | sg-redis | Redisメンテナンス | Network Eng | 2025-12-11 |
| BST-OUT-003 | HTTPS | TCP | 443 | 0.0.0.0/0 | パッケージ更新 | Network Eng | 2025-12-11 |

```hcl
resource "aws_security_group" "bastion" {
  name        = "lifeplan-bastion-sg"
  description = "Security group for Bastion host - RESTRICTED ACCESS"
  vpc_id      = aws_vpc.main.id

  # VPNからのSSHのみ許可
  ingress {
    description = "SSH from VPN"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_vpn_cidr]  # 203.0.113.0/24
  }

  egress {
    description     = "To RDS for maintenance"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds.id]
  }

  egress {
    description     = "To Redis for maintenance"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.redis.id]
  }

  egress {
    description = "Package updates"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "lifeplan-bastion-sg"
    Environment = "production"
    AccessLevel = "privileged"
  }
}
```

---

### 3.9 sg-vpce (VPC Endpoints)

**目的**: AWSサービスへのプライベート接続

#### Inbound Rules
| Rule ID | Type | Protocol | Port | Source | Description | 承認者 | 承認日 |
|---------|------|----------|------|--------|-------------|--------|--------|
| VPCE-IN-001 | HTTPS | TCP | 443 | sg-frontend | Frontend接続 | Network Eng | 2025-12-11 |
| VPCE-IN-002 | HTTPS | TCP | 443 | sg-backend | Backend接続 | Network Eng | 2025-12-11 |
| VPCE-IN-003 | HTTPS | TCP | 443 | sg-worker | Worker接続 | Network Eng | 2025-12-11 |

---

## 4. Network ACL ポリシー

### 4.1 Public Subnet NACL

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  NACL: lifeplan-public-nacl                                                     │
│  Associated Subnets: public-a, public-c, public-d                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  INBOUND RULES:                                                                 │
│  ┌──────┬──────────┬──────────┬──────────────┬────────────────────┬──────────┐│
│  │ Rule │ Type     │ Protocol │ Port Range   │ Source             │ Action   ││
│  ├──────┼──────────┼──────────┼──────────────┼────────────────────┼──────────┤│
│  │ 100  │ HTTPS    │ TCP (6)  │ 443          │ 0.0.0.0/0          │ ALLOW    ││
│  │ 110  │ HTTP     │ TCP (6)  │ 80           │ 0.0.0.0/0          │ ALLOW    ││
│  │ 120  │ SSH      │ TCP (6)  │ 22           │ 203.0.113.0/24     │ ALLOW    ││
│  │ 200  │ Ephemeral│ TCP (6)  │ 1024-65535   │ 0.0.0.0/0          │ ALLOW    ││
│  │ *    │ ALL      │ ALL      │ ALL          │ 0.0.0.0/0          │ DENY     ││
│  └──────┴──────────┴──────────┴──────────────┴────────────────────┴──────────┘│
│                                                                                  │
│  OUTBOUND RULES:                                                                │
│  ┌──────┬──────────┬──────────┬──────────────┬────────────────────┬──────────┐│
│  │ Rule │ Type     │ Protocol │ Port Range   │ Destination        │ Action   ││
│  ├──────┼──────────┼──────────┼──────────────┼────────────────────┼──────────┤│
│  │ 100  │ HTTPS    │ TCP (6)  │ 443          │ 0.0.0.0/0          │ ALLOW    ││
│  │ 110  │ HTTP     │ TCP (6)  │ 80           │ 0.0.0.0/0          │ ALLOW    ││
│  │ 120  │ Custom   │ TCP (6)  │ 3000         │ 10.0.16.0/20       │ ALLOW    ││
│  │ 130  │ Custom   │ TCP (6)  │ 8000         │ 10.0.16.0/20       │ ALLOW    ││
│  │ 200  │ Ephemeral│ TCP (6)  │ 1024-65535   │ 0.0.0.0/0          │ ALLOW    ││
│  │ *    │ ALL      │ ALL      │ ALL          │ 0.0.0.0/0          │ DENY     ││
│  └──────┴──────────┴──────────┴──────────────┴────────────────────┴──────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Application Subnet NACL

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  NACL: lifeplan-app-nacl                                                        │
│  Associated Subnets: app-a, app-c, app-d                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  INBOUND RULES:                                                                 │
│  ┌──────┬──────────┬──────────┬──────────────┬────────────────────┬──────────┐│
│  │ Rule │ Type     │ Protocol │ Port Range   │ Source             │ Action   ││
│  ├──────┼──────────┼──────────┼──────────────┼────────────────────┼──────────┤│
│  │ 100  │ Custom   │ TCP (6)  │ 3000         │ 10.0.0.0/20        │ ALLOW    ││
│  │ 110  │ Custom   │ TCP (6)  │ 8000         │ 10.0.0.0/20        │ ALLOW    ││
│  │ 200  │ Ephemeral│ TCP (6)  │ 1024-65535   │ 0.0.0.0/0          │ ALLOW    ││
│  │ *    │ ALL      │ ALL      │ ALL          │ 0.0.0.0/0          │ DENY     ││
│  └──────┴──────────┴──────────┴──────────────┴────────────────────┴──────────┘│
│                                                                                  │
│  OUTBOUND RULES:                                                                │
│  ┌──────┬──────────┬──────────┬──────────────┬────────────────────┬──────────┐│
│  │ Rule │ Type     │ Protocol │ Port Range   │ Destination        │ Action   ││
│  ├──────┼──────────┼──────────┼──────────────┼────────────────────┼──────────┤│
│  │ 100  │ PostgreSQL│TCP (6)  │ 5432         │ 10.0.32.0/20       │ ALLOW    ││
│  │ 110  │ Redis    │ TCP (6)  │ 6379         │ 10.0.32.0/20       │ ALLOW    ││
│  │ 120  │ HTTPS    │ TCP (6)  │ 443          │ 10.0.32.0/20       │ ALLOW    ││
│  │ 130  │ HTTPS    │ TCP (6)  │ 443          │ 0.0.0.0/0          │ ALLOW    ││
│  │ 200  │ Ephemeral│ TCP (6)  │ 1024-65535   │ 10.0.0.0/20        │ ALLOW    ││
│  │ *    │ ALL      │ ALL      │ ALL          │ 0.0.0.0/0          │ DENY     ││
│  └──────┴──────────┴──────────┴──────────────┴────────────────────┴──────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Data Subnet NACL

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  NACL: lifeplan-data-nacl                                                       │
│  Associated Subnets: data-a, data-c, data-d                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  INBOUND RULES:                                                                 │
│  ┌──────┬──────────┬──────────┬──────────────┬────────────────────┬──────────┐│
│  │ Rule │ Type     │ Protocol │ Port Range   │ Source             │ Action   ││
│  ├──────┼──────────┼──────────┼──────────────┼────────────────────┼──────────┤│
│  │ 100  │ PostgreSQL│TCP (6)  │ 5432         │ 10.0.16.0/20       │ ALLOW    ││
│  │ 110  │ Redis    │ TCP (6)  │ 6379         │ 10.0.16.0/20       │ ALLOW    ││
│  │ 120  │ HTTPS    │ TCP (6)  │ 443          │ 10.0.16.0/20       │ ALLOW    ││
│  │ 130  │ PostgreSQL│TCP (6)  │ 5432         │ 10.0.0.0/20        │ ALLOW    ││
│  │ *    │ ALL      │ ALL      │ ALL          │ 0.0.0.0/0          │ DENY     ││
│  └──────┴──────────┴──────────┴──────────────┴────────────────────┴──────────┘│
│                                                                                  │
│  OUTBOUND RULES:                                                                │
│  ┌──────┬──────────┬──────────┬──────────────┬────────────────────┬──────────┐│
│  │ Rule │ Type     │ Protocol │ Port Range   │ Destination        │ Action   ││
│  ├──────┼──────────┼──────────┼──────────────┼────────────────────┼──────────┤│
│  │ 100  │ Ephemeral│ TCP (6)  │ 1024-65535   │ 10.0.16.0/20       │ ALLOW    ││
│  │ 110  │ Ephemeral│ TCP (6)  │ 1024-65535   │ 10.0.0.0/20        │ ALLOW    ││
│  │ *    │ ALL      │ ALL      │ ALL          │ 0.0.0.0/0          │ DENY     ││
│  └──────┴──────────┴──────────┴──────────────┴────────────────────┴──────────┘│
│                                                                                  │
│  ※ Data Subnetはインターネットへのアウトバウンド完全禁止                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. AWS WAF ルール詳細

### 5.1 Web ACL構成

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Web ACL: lifeplan-production-waf                                               │
│  Scope: CLOUDFRONT                                                              │
│  Default Action: ALLOW                                                          │
│  Capacity: 2500 WCU (使用中: 1850 WCU)                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  RULES (Priority Order):                                                        │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Priority 0: IPBlocklist (Custom)                                           ││
│  │ Action: Block | WCU: 1                                                     ││
│  │                                                                             ││
│  │ Description: 脅威インテリジェンスで特定された悪意あるIPをブロック         ││
│  │ IP Set: lifeplan-blocked-ips (動的更新)                                    ││
│  │                                                                             ││
│  │ 更新頻度: 毎日（CTI Analystからの情報に基づく）                           ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Priority 1: AWSManagedRulesAmazonIpReputationList                          ││
│  │ Action: Block | WCU: 25                                                    ││
│  │                                                                             ││
│  │ Categories:                                                                 ││
│  │ - AWSManagedIPReputationList: 悪意あるIPブロック                           ││
│  │ - AWSManagedReconnaissanceList: 偵察活動IP                                 ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Priority 2: AWSManagedRulesCommonRuleSet (CRS)                             ││
│  │ Action: Block | WCU: 700                                                   ││
│  │                                                                             ││
│  │ Rules included:                                                             ││
│  │ - SizeRestrictions_QUERYSTRING: クエリ文字列サイズ制限                     ││
│  │ - SizeRestrictions_Cookie: Cookieサイズ制限                                ││
│  │ - SizeRestrictions_BODY: リクエストボディサイズ制限                        ││
│  │ - CrossSiteScripting: XSS攻撃検知                                          ││
│  │ - EC2MetaDataSSRF: SSRFによるEC2メタデータアクセス防止                     ││
│  │ - GenericLFI_QUERYSTRING: LFI攻撃検知                                      ││
│  │ - GenericLFI_BODY: LFI攻撃検知                                             ││
│  │ - RestrictedExtensions_URIPATH: 危険な拡張子ブロック                       ││
│  │ - RestrictedExtensions_QUERYSTRING: 危険な拡張子ブロック                   ││
│  │ - GenericRFI_QUERYSTRING: RFI攻撃検知                                      ││
│  │ - GenericRFI_BODY: RFI攻撃検知                                             ││
│  │                                                                             ││
│  │ Excluded Rules: None                                                        ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Priority 3: AWSManagedRulesKnownBadInputsRuleSet                           ││
│  │ Action: Block | WCU: 200                                                   ││
│  │                                                                             ││
│  │ Rules included:                                                             ││
│  │ - Log4JRCE: Log4Shell (CVE-2021-44228) 攻撃検知                           ││
│  │ - JavaDeserializationRCE: Javaデシリアライゼーション攻撃                   ││
│  │ - Host_localhost_HEADER: 不正なHostヘッダー                                ││
│  │ - PROPFIND_METHOD: PROPFIND メソッドブロック                               ││
│  │ - ExploitablePaths_URIPATH: 既知の脆弱なパスブロック                       ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Priority 4: AWSManagedRulesSQLiRuleSet                                     ││
│  │ Action: Block | WCU: 200                                                   ││
│  │                                                                             ││
│  │ Rules included:                                                             ││
│  │ - SQLi_QUERYARGUMENTS: クエリパラメータのSQLi検知                          ││
│  │ - SQLi_BODY: リクエストボディのSQLi検知                                    ││
│  │ - SQLi_COOKIE: CookieのSQLi検知                                            ││
│  │ - SQLiExtendedPatterns_QUERYARGUMENTS: 拡張SQLiパターン                    ││
│  │ - SQLiExtendedPatterns_BODY: 拡張SQLiパターン                              ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Priority 5: RateLimitPerIP (Custom)                                        ││
│  │ Action: Block | WCU: 2                                                     ││
│  │                                                                             ││
│  │ Configuration:                                                              ││
│  │ - Limit: 2000 requests per 5 minutes                                       ││
│  │ - Aggregate Key: IP                                                        ││
│  │ - Custom Response: 429 Too Many Requests                                   ││
│  │                                                                             ││
│  │ Response Body:                                                              ││
│  │ {                                                                           ││
│  │   "error": "rate_limit_exceeded",                                          ││
│  │   "message": "Too many requests. Please retry later.",                     ││
│  │   "retry_after": 300                                                       ││
│  │ }                                                                           ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Priority 6: LoginRateLimit (Custom)                                        ││
│  │ Action: Block | WCU: 5                                                     ││
│  │                                                                             ││
│  │ Scope: URI Path starts with /api/auth/login                                ││
│  │ Limit: 5 requests per 1 minute per IP                                      ││
│  │ Custom Response: 429 with lockout message                                  ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Priority 7: GeoRestriction (Custom) - OPTIONAL                             ││
│  │ Action: Block | WCU: 1                                                     ││
│  │                                                                             ││
│  │ Block countries: (必要に応じて有効化)                                      ││
│  │ - Currently: Disabled                                                       ││
│  │ - If enabled: Allow only JP, Block all others                              ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 カスタムルール詳細

#### Rate Limit Rule (JSON)
```json
{
  "Name": "RateLimitPerIP",
  "Priority": 5,
  "Statement": {
    "RateBasedStatement": {
      "Limit": 2000,
      "AggregateKeyType": "IP"
    }
  },
  "Action": {
    "Block": {
      "CustomResponse": {
        "ResponseCode": 429,
        "ResponseHeaders": [
          {
            "Name": "Retry-After",
            "Value": "300"
          },
          {
            "Name": "X-RateLimit-Limit",
            "Value": "2000"
          }
        ],
        "CustomResponseBodyKey": "rate-limit-response"
      }
    }
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "RateLimitPerIP"
  }
}
```

#### Login Rate Limit Rule (JSON)
```json
{
  "Name": "LoginRateLimit",
  "Priority": 6,
  "Statement": {
    "RateBasedStatement": {
      "Limit": 5,
      "AggregateKeyType": "IP",
      "ScopeDownStatement": {
        "ByteMatchStatement": {
          "SearchString": "/api/auth/login",
          "FieldToMatch": {
            "UriPath": {}
          },
          "TextTransformations": [
            {
              "Priority": 0,
              "Type": "LOWERCASE"
            }
          ],
          "PositionalConstraint": "STARTS_WITH"
        }
      }
    }
  },
  "Action": {
    "Block": {
      "CustomResponse": {
        "ResponseCode": 429,
        "CustomResponseBodyKey": "login-rate-limit-response"
      }
    }
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "LoginRateLimit"
  }
}
```

---

## 6. ポリシー変更管理

### 6.1 変更プロセス

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Firewall Policy Change Process                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Step 1: 変更申請                                                               │
│  ├── 申請者: 開発者/運用者                                                     │
│  ├── 内容: 変更理由、影響範囲、ロールバック計画                               │
│  └── ツール: Jira チケット作成                                                 │
│                                                                                  │
│  Step 2: セキュリティレビュー                                                   │
│  ├── レビュアー: Network Engineer + Security Team                               │
│  ├── チェック項目:                                                             │
│  │   ├── 最小権限の原則に準拠しているか                                       │
│  │   ├── 不要なポート/IPが開放されていないか                                   │
│  │   ├── ゾーン間通信ポリシーに違反していないか                               │
│  │   └── 監査要件を満たしているか                                             │
│  └── 承認: 双方の承認が必要                                                    │
│                                                                                  │
│  Step 3: CAB承認（重大変更の場合）                                             │
│  ├── 対象: データベースSG変更、DMZ変更、新規ルール追加                        │
│  ├── 承認者: CTO, CISO, CSIRT Leader                                           │
│  └── 開催: 週次CAB会議                                                         │
│                                                                                  │
│  Step 4: 実装                                                                   │
│  ├── 方法: Terraform + GitOps                                                  │
│  ├── 環境: Staging → Production                                                │
│  └── 時間帯: 計画されたメンテナンスウィンドウ                                 │
│                                                                                  │
│  Step 5: 検証                                                                   │
│  ├── テスト: 接続テスト、スモークテスト                                       │
│  ├── 監視: CloudWatch、VPC Flow Logs確認                                       │
│  └── 期間: 24時間監視                                                          │
│                                                                                  │
│  Step 6: 文書化                                                                 │
│  ├── 更新: 本ドキュメントのRule表                                              │
│  └── 記録: 承認者、承認日、変更理由                                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 緊急変更プロセス

| 状況 | 対応 | 承認 |
|------|------|------|
| セキュリティインシデント | 即時ブロック可 | 事後CISO報告（24時間以内） |
| DDoS攻撃 | WAFルール追加 | Network Engineer単独可 |
| サービス障害 | ルール一時緩和 | CSIRT Leader + Network Engineer |

### 6.3 定期レビュー

| レビュー | 頻度 | 担当 | チェック内容 |
|----------|------|------|-------------|
| ルール有効性 | 月次 | Network Engineer | 不要ルールの特定 |
| WAFログ分析 | 週次 | SOC Analyst | 誤検知・ブロック状況 |
| 権限棚卸し | 四半期 | Security Team | 未使用SG/ルール削除 |
| ペネトレーションテスト | 年次 | White Hacker | バイパス可能性 |

---

## 7. 監査・コンプライアンス

### 7.1 監査ログ

| イベント | ログ先 | 保持期間 |
|----------|--------|----------|
| Security Group変更 | CloudTrail | 7年 |
| NACL変更 | CloudTrail | 7年 |
| WAFルール変更 | CloudTrail | 7年 |
| WAFブロックログ | S3/CloudWatch | 2年 |
| VPC Flow Logs | S3 | 1年 |

### 7.2 コンプライアンスマッピング

| 規格 | 要件 | 対応ポリシー |
|------|------|-------------|
| NIST CSF PR.AC-5 | ネットワーク整合性保護 | ゾーン分離、NACL |
| ISO 27001 A.13.1.1 | ネットワーク制御 | Security Groups |
| CIS AWS 5.1 | VPCフローログ有効化 | VPC Flow Logs |
| CIS AWS 5.2 | デフォルトSG制限 | カスタムSG使用 |
| CIS AWS 5.4 | 広範なSSH禁止 | VPN CIDR制限 |

---

## 8. 改訂履歴

| バージョン | 日付 | 変更内容 | 承認者 |
|-----------|------|----------|--------|
| 1.0 | 2025-12-11 | 初版作成 | Network Engineer |

---

**承認**

| 役職 | 氏名 | 署名 | 日付 |
|------|------|------|------|
| CTO | | | |
| CISO | | | |
| Network Engineer | | | |
