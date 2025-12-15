# ==============================================================================
# LifePlan Navigator - Development Variables
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
  default     = "10.10.0.0/16"  # Different from production
}

variable "availability_zones" {
  description = "Availability zones (2 AZs for dev)"
  type        = list(string)
  default     = ["ap-northeast-1a", "ap-northeast-1c"]
}

variable "az_suffixes" {
  description = "AZ suffixes for naming"
  type        = list(string)
  default     = ["a", "c"]
}

variable "admin_vpn_cidrs" {
  description = "Admin VPN CIDR blocks"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # More permissive for dev
}
