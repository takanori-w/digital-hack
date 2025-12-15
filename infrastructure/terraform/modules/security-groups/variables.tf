# ==============================================================================
# Security Groups Module Variables
# ==============================================================================

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "lifeplan"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpce_security_group_id" {
  description = "VPC Endpoints Security Group ID"
  type        = string
}

variable "enable_bastion" {
  description = "Enable bastion host security group"
  type        = bool
  default     = true
}

variable "admin_vpn_cidrs" {
  description = "CIDR blocks for admin VPN access"
  type        = list(string)
  default     = ["203.0.113.0/24"]
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
