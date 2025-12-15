# ==============================================================================
# LifePlan Navigator - Staging Variables
# ==============================================================================

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "lifeplan"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.20.0.0/16"  # Different from dev and prod
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["ap-northeast-1a", "ap-northeast-1c", "ap-northeast-1d"]
}

variable "az_suffixes" {
  description = "AZ suffixes for naming"
  type        = list(string)
  default     = ["a", "c", "d"]
}

variable "admin_vpn_cidrs" {
  description = "Admin VPN CIDR blocks"
  type        = list(string)
  default     = ["203.0.113.0/24"]
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
}

variable "cloudfront_aliases" {
  description = "CloudFront domain aliases"
  type        = list(string)
  default     = []
}

variable "alb_dns_name" {
  description = "ALB DNS name"
  type        = string
  default     = "placeholder.elb.amazonaws.com"
}

variable "origin_verify_header" {
  description = "Secret header for origin verification"
  type        = string
  sensitive   = true
}
