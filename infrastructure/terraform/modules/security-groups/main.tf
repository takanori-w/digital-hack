# ==============================================================================
# Security Groups Module - LifePlan Navigator
# Implements defense-in-depth with strict least-privilege access
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ------------------------------------------------------------------------------
# Data Sources
# ------------------------------------------------------------------------------
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

# ------------------------------------------------------------------------------
# ALB Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "alb_ingress_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  prefix_list_ids   = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  security_group_id = aws_security_group.alb.id
  description       = "ALB-IN-001: HTTPS from CloudFront"
}

resource "aws_security_group_rule" "alb_ingress_http" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  prefix_list_ids   = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  security_group_id = aws_security_group.alb.id
  description       = "ALB-IN-002: HTTP for redirect"
}

resource "aws_security_group_rule" "alb_egress_frontend" {
  type                     = "egress"
  from_port                = 3000
  to_port                  = 3000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.frontend.id
  security_group_id        = aws_security_group.alb.id
  description              = "ALB-OUT-001: To Frontend"
}

resource "aws_security_group_rule" "alb_egress_backend" {
  type                     = "egress"
  from_port                = 8000
  to_port                  = 8000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.backend.id
  security_group_id        = aws_security_group.alb.id
  description              = "ALB-OUT-002: To Backend"
}

# ------------------------------------------------------------------------------
# Frontend Security Group (Next.js)
# ------------------------------------------------------------------------------
resource "aws_security_group" "frontend" {
  name        = "${var.project_name}-${var.environment}-frontend-sg"
  description = "Security group for Frontend ECS tasks"
  vpc_id      = var.vpc_id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-frontend-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "frontend_ingress_alb" {
  type                     = "ingress"
  from_port                = 3000
  to_port                  = 3000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.frontend.id
  description              = "FE-IN-001: From ALB"
}

resource "aws_security_group_rule" "frontend_egress_backend" {
  type                     = "egress"
  from_port                = 8000
  to_port                  = 8000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.backend.id
  security_group_id        = aws_security_group.frontend.id
  description              = "FE-OUT-001: To Backend API"
}

resource "aws_security_group_rule" "frontend_egress_vpce" {
  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = var.vpce_security_group_id
  security_group_id        = aws_security_group.frontend.id
  description              = "FE-OUT-002: To VPC Endpoints"
}

resource "aws_security_group_rule" "frontend_egress_internet" {
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.frontend.id
  description       = "FE-OUT-003: External APIs via NAT"
}

# ------------------------------------------------------------------------------
# Backend Security Group (FastAPI)
# ------------------------------------------------------------------------------
resource "aws_security_group" "backend" {
  name        = "${var.project_name}-${var.environment}-backend-sg"
  description = "Security group for Backend ECS tasks"
  vpc_id      = var.vpc_id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-backend-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "backend_ingress_alb" {
  type                     = "ingress"
  from_port                = 8000
  to_port                  = 8000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.backend.id
  description              = "BE-IN-001: From ALB"
}

resource "aws_security_group_rule" "backend_ingress_frontend" {
  type                     = "ingress"
  from_port                = 8000
  to_port                  = 8000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.frontend.id
  security_group_id        = aws_security_group.backend.id
  description              = "BE-IN-002: From Frontend"
}

resource "aws_security_group_rule" "backend_egress_rds" {
  type                     = "egress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.rds.id
  security_group_id        = aws_security_group.backend.id
  description              = "BE-OUT-001: To RDS PostgreSQL"
}

resource "aws_security_group_rule" "backend_egress_redis" {
  type                     = "egress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.redis.id
  security_group_id        = aws_security_group.backend.id
  description              = "BE-OUT-002: To Redis"
}

resource "aws_security_group_rule" "backend_egress_opensearch" {
  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.opensearch.id
  security_group_id        = aws_security_group.backend.id
  description              = "BE-OUT-003: To OpenSearch"
}

resource "aws_security_group_rule" "backend_egress_vpce" {
  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = var.vpce_security_group_id
  security_group_id        = aws_security_group.backend.id
  description              = "BE-OUT-004: To VPC Endpoints"
}

resource "aws_security_group_rule" "backend_egress_internet" {
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.backend.id
  description       = "BE-OUT-005: External APIs (e-Stat, etc.)"
}

# ------------------------------------------------------------------------------
# Worker Security Group (Celery)
# ------------------------------------------------------------------------------
resource "aws_security_group" "worker" {
  name        = "${var.project_name}-${var.environment}-worker-sg"
  description = "Security group for Worker ECS tasks"
  vpc_id      = var.vpc_id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-worker-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Workers have no ingress rules - they only pull from queues

resource "aws_security_group_rule" "worker_egress_rds" {
  type                     = "egress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.rds.id
  security_group_id        = aws_security_group.worker.id
  description              = "WK-OUT-001: To RDS PostgreSQL"
}

resource "aws_security_group_rule" "worker_egress_redis" {
  type                     = "egress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.redis.id
  security_group_id        = aws_security_group.worker.id
  description              = "WK-OUT-002: To Redis (job queue)"
}

resource "aws_security_group_rule" "worker_egress_opensearch" {
  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.opensearch.id
  security_group_id        = aws_security_group.worker.id
  description              = "WK-OUT-003: To OpenSearch"
}

resource "aws_security_group_rule" "worker_egress_vpce" {
  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = var.vpce_security_group_id
  security_group_id        = aws_security_group.worker.id
  description              = "WK-OUT-004: To VPC Endpoints"
}

resource "aws_security_group_rule" "worker_egress_internet" {
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.worker.id
  description       = "WK-OUT-005: External API calls"
}

# ------------------------------------------------------------------------------
# RDS Security Group (PostgreSQL) - STRICTLY CONTROLLED
# ------------------------------------------------------------------------------
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL - STRICTLY CONTROLLED"
  vpc_id      = var.vpc_id

  tags = merge(var.common_tags, {
    Name         = "${var.project_name}-${var.environment}-rds-sg"
    DataClass    = "confidential"
    ApprovedBy   = "CISO"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "rds_ingress_backend" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.backend.id
  security_group_id        = aws_security_group.rds.id
  description              = "RDS-IN-001: Backend access to PostgreSQL"
}

resource "aws_security_group_rule" "rds_ingress_worker" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.worker.id
  security_group_id        = aws_security_group.rds.id
  description              = "RDS-IN-002: Worker access to PostgreSQL"
}

resource "aws_security_group_rule" "rds_ingress_bastion" {
  count                    = var.enable_bastion ? 1 : 0
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.bastion[0].id
  security_group_id        = aws_security_group.rds.id
  description              = "RDS-IN-003: Bastion access for maintenance"
}

# RDS has NO outbound rules - completely isolated

# ------------------------------------------------------------------------------
# Redis Security Group (ElastiCache)
# ------------------------------------------------------------------------------
resource "aws_security_group" "redis" {
  name        = "${var.project_name}-${var.environment}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = var.vpc_id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-redis-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "redis_ingress_backend" {
  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.backend.id
  security_group_id        = aws_security_group.redis.id
  description              = "REDIS-IN-001: Backend access"
}

resource "aws_security_group_rule" "redis_ingress_worker" {
  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.worker.id
  security_group_id        = aws_security_group.redis.id
  description              = "REDIS-IN-002: Worker access"
}

# Redis has NO outbound rules

# ------------------------------------------------------------------------------
# OpenSearch Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "opensearch" {
  name        = "${var.project_name}-${var.environment}-opensearch-sg"
  description = "Security group for OpenSearch Service"
  vpc_id      = var.vpc_id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-opensearch-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "opensearch_ingress_backend" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.backend.id
  security_group_id        = aws_security_group.opensearch.id
  description              = "OS-IN-001: Backend access"
}

resource "aws_security_group_rule" "opensearch_ingress_worker" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.worker.id
  security_group_id        = aws_security_group.opensearch.id
  description              = "OS-IN-002: Worker access"
}

# OpenSearch has NO outbound rules

# ------------------------------------------------------------------------------
# Bastion Security Group (Optional)
# ------------------------------------------------------------------------------
resource "aws_security_group" "bastion" {
  count       = var.enable_bastion ? 1 : 0
  name        = "${var.project_name}-${var.environment}-bastion-sg"
  description = "Security group for Bastion host - RESTRICTED ACCESS"
  vpc_id      = var.vpc_id

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-bastion-sg"
    AccessLevel = "privileged"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "bastion_ingress_ssh" {
  count             = var.enable_bastion ? 1 : 0
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = var.admin_vpn_cidrs
  security_group_id = aws_security_group.bastion[0].id
  description       = "BST-IN-001: SSH from VPN"
}

resource "aws_security_group_rule" "bastion_egress_rds" {
  count                    = var.enable_bastion ? 1 : 0
  type                     = "egress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.rds.id
  security_group_id        = aws_security_group.bastion[0].id
  description              = "BST-OUT-001: To RDS for maintenance"
}

resource "aws_security_group_rule" "bastion_egress_redis" {
  count                    = var.enable_bastion ? 1 : 0
  type                     = "egress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.redis.id
  security_group_id        = aws_security_group.bastion[0].id
  description              = "BST-OUT-002: To Redis for maintenance"
}

resource "aws_security_group_rule" "bastion_egress_https" {
  count             = var.enable_bastion ? 1 : 0
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.bastion[0].id
  description       = "BST-OUT-003: Package updates"
}
