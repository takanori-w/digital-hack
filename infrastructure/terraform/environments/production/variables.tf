# ==============================================================================
# LifePlan Navigator - Production Variables
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
  default     = "10.0.0.0/16"
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

variable "enable_bastion" {
  description = "Enable bastion host"
  type        = bool
  default     = true
}

variable "admin_vpn_cidrs" {
  description = "Admin VPN CIDR blocks"
  type        = list(string)
  default     = ["203.0.113.0/24"]
}

variable "blocked_ip_addresses" {
  description = "IP addresses to block via WAF"
  type        = list(string)
  default     = []
}

variable "enable_geo_restriction" {
  description = "Enable geo restriction"
  type        = bool
  default     = false
}

variable "allowed_countries" {
  description = "Allowed countries for geo restriction"
  type        = list(string)
  default     = ["JP"]
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
  description = "ALB DNS name (placeholder, will be updated)"
  type        = string
  default     = "placeholder.elb.amazonaws.com"
}

variable "origin_verify_header" {
  description = "Secret header for origin verification"
  type        = string
  sensitive   = true
}
