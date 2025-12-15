# ==============================================================================
# WAF Module Variables
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

variable "waf_scope" {
  description = "WAF scope (REGIONAL or CLOUDFRONT)"
  type        = string
  default     = "CLOUDFRONT"
}

variable "blocked_ip_addresses" {
  description = "List of IP addresses to block"
  type        = list(string)
  default     = []
}

variable "rate_limit_per_ip" {
  description = "Rate limit per IP (requests per 5 minutes)"
  type        = number
  default     = 2000
}

variable "login_rate_limit" {
  description = "Login rate limit per IP (requests per 5 minutes)"
  type        = number
  default     = 5
}

variable "registration_rate_limit" {
  description = "Registration rate limit per IP (requests per 5 minutes)"
  type        = number
  default     = 3
}

variable "password_reset_rate_limit" {
  description = "Password reset rate limit per IP (requests per 5 minutes)"
  type        = number
  default     = 3
}

variable "enable_geo_restriction" {
  description = "Enable geo restriction"
  type        = bool
  default     = false
}

variable "allowed_countries" {
  description = "Allowed country codes when geo restriction is enabled"
  type        = list(string)
  default     = ["JP"]
}

variable "crs_excluded_rules" {
  description = "Rules to exclude from Common Rule Set (count instead of block)"
  type        = list(string)
  default     = []
}

variable "enable_logging" {
  description = "Enable WAF logging"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Log retention period in days"
  type        = number
  default     = 30
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
