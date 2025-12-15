# ==============================================================================
# LifePlan Navigator - Development Environment
# Simplified configuration for development with cost optimization
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
    key            = "development/terraform.tfstate"
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

# ------------------------------------------------------------------------------
# Local Variables
# ------------------------------------------------------------------------------
locals {
  environment = "development"

  common_tags = {
    Project     = var.project_name
    Environment = local.environment
    ManagedBy   = "terraform"
    CostCenter  = "development"
  }
}

# ------------------------------------------------------------------------------
# Data Sources
# ------------------------------------------------------------------------------
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ------------------------------------------------------------------------------
# VPC Module (Simplified for Development)
# ------------------------------------------------------------------------------
module "vpc" {
  source = "../../modules/vpc"

  project_name           = var.project_name
  environment            = local.environment
  aws_region             = var.aws_region
  vpc_cidr               = var.vpc_cidr
  availability_zones     = var.availability_zones
  az_suffixes            = var.az_suffixes
  enable_nat_gateway     = true  # Single NAT for cost savings
  enable_flow_logs       = true
  flow_log_retention_days = 7   # Shorter retention for dev
  enable_vpc_endpoints   = true

  interface_endpoints = [
    "ecr.api",
    "ecr.dkr",
    "logs",
    "secretsmanager"
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
  enable_bastion         = false  # Use SSM for dev
  admin_vpn_cidrs        = var.admin_vpn_cidrs

  common_tags = local.common_tags
}

# ------------------------------------------------------------------------------
# S3 Bucket for Static Assets (Development)
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "static_assets" {
  bucket = "${var.project_name}-${local.environment}-static-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-static-assets"
  })
}

resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  versioning_configuration {
    status = "Suspended"  # Disabled for dev to save costs
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

output "static_assets_bucket_name" {
  description = "Static assets S3 bucket name"
  value       = aws_s3_bucket.static_assets.id
}

output "nat_gateway_ips" {
  description = "NAT Gateway public IPs"
  value       = module.vpc.nat_gateway_public_ips
}
