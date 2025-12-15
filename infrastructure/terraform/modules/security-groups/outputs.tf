# ==============================================================================
# Security Groups Module Outputs
# ==============================================================================

output "alb_security_group_id" {
  description = "ALB Security Group ID"
  value       = aws_security_group.alb.id
}

output "frontend_security_group_id" {
  description = "Frontend Security Group ID"
  value       = aws_security_group.frontend.id
}

output "backend_security_group_id" {
  description = "Backend Security Group ID"
  value       = aws_security_group.backend.id
}

output "worker_security_group_id" {
  description = "Worker Security Group ID"
  value       = aws_security_group.worker.id
}

output "rds_security_group_id" {
  description = "RDS Security Group ID"
  value       = aws_security_group.rds.id
}

output "redis_security_group_id" {
  description = "Redis Security Group ID"
  value       = aws_security_group.redis.id
}

output "opensearch_security_group_id" {
  description = "OpenSearch Security Group ID"
  value       = aws_security_group.opensearch.id
}

output "bastion_security_group_id" {
  description = "Bastion Security Group ID"
  value       = var.enable_bastion ? aws_security_group.bastion[0].id : null
}

output "all_security_group_ids" {
  description = "Map of all security group IDs"
  value = {
    alb        = aws_security_group.alb.id
    frontend   = aws_security_group.frontend.id
    backend    = aws_security_group.backend.id
    worker     = aws_security_group.worker.id
    rds        = aws_security_group.rds.id
    redis      = aws_security_group.redis.id
    opensearch = aws_security_group.opensearch.id
    bastion    = var.enable_bastion ? aws_security_group.bastion[0].id : null
  }
}
