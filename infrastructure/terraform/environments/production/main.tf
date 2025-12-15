# ==============================================================================
# LifePlan Navigator - Production Environment
# Main Terraform Configuration
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "lifeplan-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-northeast-1"
    encrypt        = true
    dynamodb_table = "lifeplan-terraform-locks"
  }
}

# ------------------------------------------------------------------------------
# Providers
# ------------------------------------------------------------------------------
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# Provider for CloudFront/WAF (must be us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}

# ------------------------------------------------------------------------------
# Local Variables
# ------------------------------------------------------------------------------
locals {
  environment = "production"

  common_tags = {
    Project     = var.project_name
    Environment = local.environment
    ManagedBy   = "terraform"
    Repository  = "organization_unicorn_team"
  }
}

# ------------------------------------------------------------------------------
# Data Sources
# ------------------------------------------------------------------------------
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ------------------------------------------------------------------------------
# VPC Module
# ------------------------------------------------------------------------------
module "vpc" {
  source = "../../modules/vpc"

  project_name           = var.project_name
  environment            = local.environment
  aws_region             = var.aws_region
  vpc_cidr               = var.vpc_cidr
  availability_zones     = var.availability_zones
  az_suffixes            = var.az_suffixes
  enable_nat_gateway     = true
  enable_flow_logs       = true
  flow_log_retention_days = 14
  enable_vpc_endpoints   = true

  interface_endpoints = [
    "ecr.api",
    "ecr.dkr",
    "logs",
    "secretsmanager",
    "ssm",
    "ssmmessages",
    "kms",
    "sns",
    "sqs"
  ]

  common_tags = local.common_tags
}

# ------------------------------------------------------------------------------
# Security Groups Module
# ------------------------------------------------------------------------------
module "security_groups" {
  source = "../../modules/security-groups"

  project_name           = var.project_name
  environment            = local.environment
  vpc_id                 = module.vpc.vpc_id
  vpce_security_group_id = module.vpc.vpce_security_group_id
  enable_bastion         = var.enable_bastion
  admin_vpn_cidrs        = var.admin_vpn_cidrs

  common_tags = local.common_tags
}

# ------------------------------------------------------------------------------
# WAF Module (us-east-1 for CloudFront)
# ------------------------------------------------------------------------------
module "waf" {
  source = "../../modules/waf"
  providers = {
    aws = aws.us_east_1
  }

  project_name              = var.project_name
  environment               = local.environment
  waf_scope                 = "CLOUDFRONT"
  blocked_ip_addresses      = var.blocked_ip_addresses
  rate_limit_per_ip         = 2000
  login_rate_limit          = 5
  registration_rate_limit   = 3
  password_reset_rate_limit = 3
  enable_geo_restriction    = var.enable_geo_restriction
  allowed_countries         = var.allowed_countries
  enable_logging            = true
  log_retention_days        = 30

  common_tags = local.common_tags
}

# ------------------------------------------------------------------------------
# S3 Bucket for Static Assets
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "static_assets" {
  bucket = "${var.project_name}-${local.environment}-static-assets-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-static-assets"
  })
}

resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ------------------------------------------------------------------------------
# S3 Bucket for Logs
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-${local.environment}-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-logs"
  })
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log-retention"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    expiration {
      days = 1095  # 3 years
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ------------------------------------------------------------------------------
# ACM Certificate (us-east-1 for CloudFront)
# ------------------------------------------------------------------------------
resource "aws_acm_certificate" "cloudfront" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-cloudfront-cert"
  })
}

# ------------------------------------------------------------------------------
# CloudFront Module
# ------------------------------------------------------------------------------
module "cloudfront" {
  source = "../../modules/cloudfront"
  providers = {
    aws = aws.us_east_1
  }

  project_name                   = var.project_name
  environment                    = local.environment
  domain_aliases                 = var.cloudfront_aliases
  acm_certificate_arn            = aws_acm_certificate.cloudfront.arn
  s3_bucket_regional_domain_name = aws_s3_bucket.static_assets.bucket_regional_domain_name
  s3_bucket_arn                  = aws_s3_bucket.static_assets.arn
  alb_dns_name                   = var.alb_dns_name  # Will be updated after ALB creation
  waf_web_acl_arn                = module.waf.web_acl_arn
  price_class                    = "PriceClass_200"
  enable_logging                 = true
  log_bucket_domain_name         = aws_s3_bucket.logs.bucket_domain_name
  origin_verify_header           = var.origin_verify_header
  geo_restriction_type           = var.enable_geo_restriction ? "whitelist" : "none"
  geo_restriction_locations      = var.enable_geo_restriction ? var.allowed_countries : []

  common_tags = local.common_tags

  depends_on = [aws_acm_certificate.cloudfront]
}

# Apply S3 bucket policy for CloudFront
resource "aws_s3_bucket_policy" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  policy = module.cloudfront.s3_bucket_policy_json
}

# ------------------------------------------------------------------------------
# Outputs
# ------------------------------------------------------------------------------
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "application_subnet_ids" {
  description = "Application subnet IDs"
  value       = module.vpc.application_subnet_ids
}

output "data_subnet_ids" {
  description = "Data subnet IDs"
  value       = module.vpc.data_subnet_ids
}

output "security_group_ids" {
  description = "Security group IDs"
  value       = module.security_groups.all_security_group_ids
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = module.waf.web_acl_arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = module.cloudfront.distribution_domain_name
}

output "static_assets_bucket_name" {
  description = "Static assets S3 bucket name"
  value       = aws_s3_bucket.static_assets.id
}

output "logs_bucket_name" {
  description = "Logs S3 bucket name"
  value       = aws_s3_bucket.logs.id
}
