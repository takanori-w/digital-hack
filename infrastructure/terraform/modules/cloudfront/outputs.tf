# ==============================================================================
# CloudFront Module Outputs
# ==============================================================================

output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.main.arn
}

output "distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "distribution_hosted_zone_id" {
  description = "CloudFront Route 53 hosted zone ID"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

output "oac_id" {
  description = "Origin Access Control ID"
  value       = aws_cloudfront_origin_access_control.s3.id
}

output "cache_policy_static_id" {
  description = "Static assets cache policy ID"
  value       = aws_cloudfront_cache_policy.static_assets.id
}

output "cache_policy_dynamic_id" {
  description = "Dynamic content cache policy ID"
  value       = aws_cloudfront_cache_policy.dynamic_content.id
}

output "response_headers_policy_id" {
  description = "Response headers policy ID"
  value       = aws_cloudfront_response_headers_policy.security_headers.id
}
