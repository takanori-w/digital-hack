# ==============================================================================
# WAF Module Outputs
# ==============================================================================

output "web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.main.id
}

output "web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}

output "web_acl_capacity" {
  description = "WAF Web ACL capacity"
  value       = aws_wafv2_web_acl.main.capacity
}

output "blocked_ip_set_id" {
  description = "Blocked IP Set ID"
  value       = aws_wafv2_ip_set.blocked_ips.id
}

output "blocked_ip_set_arn" {
  description = "Blocked IP Set ARN"
  value       = aws_wafv2_ip_set.blocked_ips.arn
}

output "log_group_name" {
  description = "WAF log group name"
  value       = var.enable_logging ? aws_cloudwatch_log_group.waf[0].name : null
}

output "log_group_arn" {
  description = "WAF log group ARN"
  value       = var.enable_logging ? aws_cloudwatch_log_group.waf[0].arn : null
}
