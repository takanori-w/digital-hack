# ==============================================================================
# CloudFront Module Variables
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

variable "domain_aliases" {
  description = "Domain aliases for CloudFront distribution"
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1)"
  type        = string
  default     = ""
}

variable "s3_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name for static assets"
  type        = string
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN for static assets"
  type        = string
}

variable "alb_dns_name" {
  description = "ALB DNS name for dynamic content"
  type        = string
}

variable "waf_web_acl_arn" {
  description = "WAF Web ACL ARN (must be in us-east-1 for CloudFront)"
  type        = string
  default     = ""
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_200"
}

variable "geo_restriction_type" {
  description = "Geo restriction type (none, whitelist, blacklist)"
  type        = string
  default     = "none"
}

variable "geo_restriction_locations" {
  description = "Countries for geo restriction"
  type        = list(string)
  default     = []
}

variable "enable_logging" {
  description = "Enable CloudFront access logging"
  type        = bool
  default     = true
}

variable "log_bucket_domain_name" {
  description = "S3 bucket domain name for CloudFront logs"
  type        = string
  default     = ""
}

variable "origin_verify_header" {
  description = "Custom header value for origin verification"
  type        = string
  sensitive   = true
}

variable "content_security_policy" {
  description = "Content Security Policy header value"
  type        = string
  default     = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
