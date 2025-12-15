# ==============================================================================
# VPC Module Outputs
# ==============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "application_subnet_ids" {
  description = "Application subnet IDs"
  value       = aws_subnet.application[*].id
}

output "data_subnet_ids" {
  description = "Data subnet IDs"
  value       = aws_subnet.data[*].id
}

output "management_subnet_ids" {
  description = "Management subnet IDs"
  value       = aws_subnet.management[*].id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "NAT Gateway public IPs"
  value       = aws_eip.nat[*].public_ip
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}

output "vpce_security_group_id" {
  description = "VPC Endpoints Security Group ID"
  value       = var.enable_vpc_endpoints ? aws_security_group.vpce[0].id : null
}

output "s3_endpoint_id" {
  description = "S3 VPC Endpoint ID"
  value       = var.enable_vpc_endpoints ? aws_vpc_endpoint.s3[0].id : null
}

output "public_route_table_id" {
  description = "Public route table ID"
  value       = aws_route_table.public.id
}

output "application_route_table_ids" {
  description = "Application route table IDs"
  value       = aws_route_table.application[*].id
}

output "data_route_table_id" {
  description = "Data route table ID"
  value       = aws_route_table.data.id
}

output "flow_log_group_name" {
  description = "VPC Flow Log CloudWatch Log Group name"
  value       = var.enable_flow_logs ? aws_cloudwatch_log_group.flow_log[0].name : null
}
